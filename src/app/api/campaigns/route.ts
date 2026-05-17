import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, logAudit, checkPermission, getOperatorColor } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/campaigns — List campaigns (RLS-filtered)
// Query params: operateurCode, regionCode, statut, type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const scope = await getRLSScope(userRole);
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);

    const { searchParams } = new URL(request.url);
    const operateurCode = searchParams.get("operateurCode");
    const regionCode = searchParams.get("regionCode");
    const statut = searchParams.get("statut");
    const type = searchParams.get("type");

    // Build where clause
    const where: Record<string, unknown> = {
      ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
      ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
    };

    if (operateurCode) {
      const op = await db.operateur.findFirst({ where: { code: operateurCode.toUpperCase() } });
      if (op) where.operateurId = op.id;
    }
    if (regionCode) {
      const reg = await db.region.findFirst({ where: { code: regionCode.toUpperCase() } });
      if (reg) where.regionId = reg.id;
    }
    if (statut) where.statut = statut;
    if (type) where.type = type;

    const campaigns = await db.campagne.findMany({
      where,
      include: { operateur: true, region: true },
      orderBy: { dateDebut: "desc" },
    });

    const result = campaigns.map((c) => ({
      id: c.id,
      name: c.nom,
      type: c.type.replace(/_/g, " "),
      operator: c.operateur.nom,
      operatorCode: c.operateur.code,
      operatorColor: getOperatorColor(c.operateur.code),
      region: c.region.nom,
      date: c.dateDebut.toISOString().split("T")[0],
      statut: c.statut,
      responsable: c.responsable,
    }));

    await logAudit(userId, "READ", "campaign");

    return NextResponse.json({ campaigns: result });
  } catch (error) {
    console.error("Campaigns API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/campaigns — Create a campaign
// Body: { nom, type, operateurId, regionId, dateDebut, dateFin?, responsable? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "campaign", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.nom) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    if (!body.type) return NextResponse.json({ error: "Le type est requis" }, { status: 400 });
    if (!body.operateurId) return NextResponse.json({ error: "L'opérateur est requis" }, { status: 400 });
    if (!body.regionId) return NextResponse.json({ error: "La région est requise" }, { status: 400 });
    if (!body.dateDebut) return NextResponse.json({ error: "La date de début est requise" }, { status: 400 });

    const campaign = await db.campagne.create({
      data: {
        nom: body.nom,
        type: body.type,
        operateurId: body.operateurId,
        regionId: body.regionId,
        dateDebut: new Date(body.dateDebut),
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        statut: "PLANIFIEE",
        responsable: body.responsable,
      },
      include: { operateur: true, region: true },
    });

    await logAudit(userId, "CREATE", "campaign", JSON.stringify({ name: body.nom }), campaign.id);

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.nom,
        type: campaign.type.replace(/_/g, " "),
        operator: campaign.operateur.nom,
        operatorCode: campaign.operateur.code,
        operatorColor: getOperatorColor(campaign.operateur.code),
        region: campaign.region.nom,
        date: campaign.dateDebut.toISOString().split("T")[0],
        statut: campaign.statut,
        responsable: campaign.responsable,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create campaign API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/campaigns — Update campaign status
// Body: { id, statut }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "campaign", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID campagne requis" }, { status: 400 });
    }
    if (!body.statut) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 });
    }

    const validStatuses = ["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"];
    if (!validStatuses.includes(body.statut)) {
      return NextResponse.json({ error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const campaign = await db.campagne.update({
      where: { id: body.id },
      data: { statut: body.statut },
      include: { operateur: true, region: true },
    });

    await logAudit(userId, "UPDATE", "campaign", JSON.stringify({ statut: body.statut }), campaign.id);

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.nom,
        type: campaign.type.replace(/_/g, " "),
        operator: campaign.operateur.nom,
        operatorCode: campaign.operateur.code,
        operatorColor: getOperatorColor(campaign.operateur.code),
        region: campaign.region.nom,
        date: campaign.dateDebut.toISOString().split("T")[0],
        statut: campaign.statut,
        responsable: campaign.responsable,
      },
    });
  } catch (error) {
    console.error("Update campaign API error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

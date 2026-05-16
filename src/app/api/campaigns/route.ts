import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, logAudit, checkPermission } from "@/lib/rbac";

export async function GET() {
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

    const campaigns = await db.campagne.findMany({
      where: {
        ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
        ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
      },
      include: { operateur: true, region: true },
      orderBy: { dateDebut: "desc" },
    });

    const result = campaigns.map((c) => ({
      id: c.id,
      name: c.nom,
      type: c.type.replace(/_/g, " "),
      operator: c.operateur.nom,
      operatorCode: c.operateur.code,
      operatorColor: c.operateur.code === "ORANGE" ? "#FF7900" : c.operateur.code === "MTN" ? "#FFCC00" : "#00B4D8",
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
    });

    await logAudit(userId, "CREATE", "campaign", JSON.stringify({ name: body.nom }), campaign.id);

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Create campaign API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

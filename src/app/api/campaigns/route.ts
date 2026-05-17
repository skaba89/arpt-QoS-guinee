import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, logAudit, checkPermission } from "@/lib/rbac";
import { z } from "zod";

// ── Zod Schema ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

const createCampaignSchema = z.object({
  nom: z.string().min(1, "Nom de campagne requis").max(200).transform(stripHtml),
  type: z.string().min(1, "Type requis").max(50).transform(stripHtml),
  operateurId: z.string().min(1, "Opérateur requis").max(50).transform(stripHtml),
  regionId: z.string().min(1, "Région requise").max(50).transform(stripHtml),
  dateDebut: z.string().min(1, "Date de début requise").max(30).transform(stripHtml),
  dateFin: z.string().max(30).optional().transform((v) => (v && v.trim() !== "" ? stripHtml(v) : undefined)),
  responsable: z.string().min(1, "Responsable requis").max(100).transform(stripHtml),
});

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

    const rawBody = await request.json();
    const parsed = createCampaignSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;
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

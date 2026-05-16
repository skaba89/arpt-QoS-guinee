import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;
    const scope = await getRLSScope(userRole);
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);

    const alerts = await db.alerte.findMany({
      where: {
        ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
        ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
      },
      include: { operateur: true, region: true },
      orderBy: { createdAt: "desc" },
    });

    const result = alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      operator: a.operateur?.nom || "Système",
      operatorCode: a.operateur?.code,
      region: a.region?.nom || "National",
      regionCode: a.region?.code,
      message: a.message,
      details: a.details,
      isResolved: a.isResolved,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ alerts: result });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Allow public submissions (no auth required) for SIGNALEMENT type
    const isPublicReport = body.type === "SIGNALEMENT_PUBLIC" && !session?.user;

    if (!isPublicReport && !session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Build the alert data
    const alertData: {
      type: string;
      severity: string;
      message: string;
      details?: string;
      operateurId?: string;
      regionId?: string;
    } = {
      type: body.type || "SIGNALEMENT_PUBLIC",
      severity: body.severity || "MOYENNE",
      message: body.message,
    };

    if (body.details) {
      alertData.details = body.details;
    }

    // Resolve operator ID from code if provided
    if (body.operatorCode) {
      const op = await db.operateur.findFirst({ where: { code: body.operatorCode.toUpperCase() } });
      if (op) alertData.operateurId = op.id;
    } else if (body.operateurId) {
      alertData.operateurId = body.operateurId;
    }

    // Resolve region ID from code if provided
    if (body.regionCode) {
      const reg = await db.region.findFirst({ where: { code: body.regionCode.toUpperCase() } });
      if (reg) alertData.regionId = reg.id;
    } else if (body.regionId) {
      alertData.regionId = body.regionId;
    }

    const alert = await db.alerte.create({ data: alertData });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Create alert API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const alert = await db.alerte.update({
      where: { id: body.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Resolve alert API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

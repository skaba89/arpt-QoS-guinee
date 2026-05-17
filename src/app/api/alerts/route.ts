import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, checkPermission, logAudit } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/alerts — List alerts (RLS-filtered)
// Query params: severity, type, isResolved, operateurCode, regionCode, limit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");
    const isResolved = searchParams.get("isResolved");
    const operateurCode = searchParams.get("operateurCode");
    const regionCode = searchParams.get("regionCode");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    // Build where clause
    const where: Record<string, unknown> = {
      ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
      ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
    };

    if (severity) where.severity = severity;
    if (type) where.type = type;
    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === "true";
    }
    if (operateurCode) {
      const op = await db.operateur.findFirst({ where: { code: operateurCode.toUpperCase() } });
      if (op) where.operateurId = op.id;
    }
    if (regionCode) {
      const reg = await db.region.findFirst({ where: { code: regionCode.toUpperCase() } });
      if (reg) where.regionId = reg.id;
    }

    const alerts = await db.alerte.findMany({
      where,
      include: { operateur: true, region: true },
      orderBy: { createdAt: "desc" },
      take: limit,
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
      resolvedAt: a.resolvedAt,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ alerts: result });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/alerts — Create alert
// Public submissions allowed for SIGNALEMENT_PUBLIC type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Allow public submissions (no auth required) for SIGNALEMENT type
    const isPublicReport = body.type === "SIGNALEMENT_PUBLIC" && !session?.user;

    if (!isPublicReport && !session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!body.message) {
      return NextResponse.json({ error: "Le message est requis" }, { status: 400 });
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

    const alert = await db.alerte.create({
      data: alertData,
      include: { operateur: true, region: true },
    });

    // Audit log for authenticated users
    if (session?.user) {
      const userId = (session.user as Record<string, unknown>).id as string;
      await logAudit(userId, "CREATE", "alert", JSON.stringify({ type: alertData.type, severity: alertData.severity }), alert.id);
    }

    return NextResponse.json({
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        operator: alert.operateur?.nom || "Système",
        region: alert.region?.nom || "National",
        message: alert.message,
        isResolved: alert.isResolved,
        createdAt: alert.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create alert API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/alerts — Resolve/unresolve an alert
// Body: { id, isResolved? (default true) }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    // Check if user has permission to resolve alerts
    const canResolve = await checkPermission(userRole, "alert", "write") ||
                       await checkPermission(userRole, "alert", "admin") ||
                       await checkPermission(userRole, "dashboard", "admin");
    if (!canResolve) {
      return NextResponse.json({ error: "Permissions insuffisantes pour résoudre une alerte" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID alerte requis" }, { status: 400 });
    }

    const isResolved = body.isResolved !== false;
    const alert = await db.alerte.update({
      where: { id: body.id },
      data: {
        isResolved,
        resolvedAt: isResolved ? new Date() : null,
      },
      include: { operateur: true, region: true },
    });

    await logAudit(
      userId,
      isResolved ? "RESOLVE" : "UNRESOLVE",
      "alert",
      JSON.stringify({ alertId: body.id, type: alert.type, severity: alert.severity }),
      body.id
    );

    return NextResponse.json({
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        operator: alert.operateur?.nom || "Système",
        region: alert.region?.nom || "National",
        message: alert.message,
        isResolved: alert.isResolved,
        resolvedAt: alert.resolvedAt,
        createdAt: alert.createdAt,
      },
    });
  } catch (error) {
    console.error("Resolve alert API error:", error);
    // Check if it's a Prisma not-found error
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Alerte non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

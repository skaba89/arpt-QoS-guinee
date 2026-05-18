import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, checkPermission, logAudit } from "@/lib/rbac";
import { z } from "zod";

// Validation schemas
const createAlertSchema = z.object({
  type: z.enum([
    "DEGRADATION",
    "SEUIL_DEPASSE",
    "NON_CONFORMITE",
    "ZONE_BLANCHE",
    "SIGNALEMENT_PUBLIC",
  ]).default("SIGNALEMENT_PUBLIC"),
  severity: z.enum([
    "CRITIQUE",
    "HAUTE",
    "MOYENNE",
    "BASSE",
  ]).default("MOYENNE"),
  message: z.string()
    .min(5, "Le message doit contenir au moins 5 caractères")
    .max(500, "Le message ne peut pas dépasser 500 caractères")
    .transform((val) => val.replace(/<[^>]*>/g, "")), // Strip HTML tags (XSS prevention)
  details: z.string().max(1000).optional(),
  operatorCode: z.string().max(10).optional(),
  regionCode: z.string().max(10).optional(),
});

const resolveAlertSchema = z.object({
  id: z.string().min(1),
  isResolved: z.boolean().optional().default(true),
});

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
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const isPublicReport = data.type === "SIGNALEMENT_PUBLIC" && !session?.user;

    // Non-SIGNALEMENT_PUBLIC types require auth
    if (data.type !== "SIGNALEMENT_PUBLIC" && !session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Build the alert data with sanitized values
    const alertData: {
      type: string;
      severity: string;
      message: string;
      details?: string;
      operateurId?: string;
      regionId?: string;
    } = {
      type: data.type,
      severity: data.severity,
      message: data.message, // Already sanitized by Zod transform
    };

    if (data.details) {
      alertData.details = data.details.replace(/<[^>]*>/g, "");
    }

    // Resolve operator ID from code if provided
    if (data.operatorCode) {
      const op = await db.operateur.findFirst({ where: { code: data.operatorCode.toUpperCase() } });
      if (op) alertData.operateurId = op.id;
    }

    // Resolve region ID from code if provided
    if (data.regionCode) {
      const reg = await db.region.findFirst({ where: { code: data.regionCode.toUpperCase() } });
      if (reg) alertData.regionId = reg.id;
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
    const parsed = resolveAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const isResolved = parsed.data.isResolved !== false;

    // Verify alert exists
    const existingAlert = await db.alerte.findUnique({ where: { id: parsed.data.id } });
    if (!existingAlert) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }

    const alert = await db.alerte.update({
      where: { id: parsed.data.id },
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
      JSON.stringify({ alertId: parsed.data.id, type: alert.type, severity: alert.severity }),
      parsed.data.id
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

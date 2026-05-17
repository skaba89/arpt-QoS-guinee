import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, checkPermission } from "@/lib/rbac";
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
});

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

    // SECURITY FIX: Only allow SIGNALEMENT_PUBLIC without auth
    // All other alert types require authentication
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

    const alert = await db.alerte.create({ data: alertData });

    return NextResponse.json({ alert }, { status: 201 });
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
    const parsed = resolveAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // SECURITY FIX: Check permission - only users with alert:write or admin can resolve
    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const canResolve = await checkPermission(userRole, "alerts", "write");
    const isAdmin = await checkPermission(userRole, "alerts", "admin");

    if (!canResolve && !isAdmin) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    // Verify alert exists
    const existingAlert = await db.alerte.findUnique({ where: { id: parsed.data.id } });
    if (!existingAlert) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }

    const alert = await db.alerte.update({
      where: { id: parsed.data.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "RESOLVE_ALERT",
        resource: "alerts",
        resourceId: parsed.data.id,
      },
    }).catch(() => {});

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Resolve alert API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

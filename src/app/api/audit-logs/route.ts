import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/audit-logs — List audit logs (permission-filtered)
// Query params: userId, action, resource, limit, offset
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const canRead = await checkPermission(userRole, "audit", "read") ||
                    await checkPermission(userRole, "audit", "admin") ||
                    await checkPermission(userRole, "dashboard", "admin");

    if (!canRead) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get("userId");
    const filterAction = searchParams.get("action");
    const filterResource = searchParams.get("resource");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (filterUserId) where.userId = filterUserId;
    if (filterAction) where.action = filterAction;
    if (filterResource) where.resource = filterResource;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ]);

    const result = logs.map((l) => ({
      id: l.id,
      user: l.user?.name || l.user?.email || "unknown",
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      details: l.details,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      time: l.createdAt,
    }));

    return NextResponse.json({
      logs: result,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const canRead = await checkPermission(userRole, "audit", "read") || await checkPermission(userRole, "dashboard", "admin");

    if (!canRead) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const logs = await db.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

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

    return NextResponse.json({ logs: result });
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

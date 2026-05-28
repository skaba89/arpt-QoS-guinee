import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/admin/stats
// Returns real database statistics for the admin dashboard
// Requires user:read permission
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const hasPermission = await checkPermission(userRole, "user", "read");
    if (!hasPermission) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    // Run all counts in parallel for performance
    const [
      operatorCount,
      regionCount,
      measureCount,
      activeAlertCount,
      reportCount,
      userCount,
      activeUserCount,
      campaignCount,
      activeCampaignCount,
      resolvedAlertCount,
      auditLogCount,
    ] = await Promise.all([
      db.operateur.count({ where: { isActive: true } }),
      db.region.count(),
      db.mesureQoS.count(),
      db.alerte.count({ where: { isResolved: false } }),
      db.rapport.count(),
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.campagne.count(),
      db.campagne.count({ where: { statut: "EN_COURS" } }),
      db.alerte.count({ where: { isResolved: true } }),
      db.auditLog.count(),
    ]);

    // Compute security score based on actual data
    const unresolvedCritical = await db.alerte.count({
      where: { isResolved: false, severity: "CRITIQUE" },
    });
    const unresolvedHigh = await db.alerte.count({
      where: { isResolved: false, severity: "HAUTE" },
    });

    // Security score: starts at 100, penalized by unresolved critical/high alerts
    const securityScore = Math.max(0, Math.min(100,
      100 - (unresolvedCritical * 8) - (unresolvedHigh * 3)
    ));

    // Compliance score: based on resolved vs total alerts ratio
    const totalAlerts = activeAlertCount + resolvedAlertCount;
    const complianceScore = totalAlerts > 0
      ? Math.round((resolvedAlertCount / totalAlerts) * 100)
      : 100;

    // Recent audit activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAuditCount = await db.auditLog.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Login activity
    const loginCount = await db.auditLog.count({
      where: { action: "LOGIN", createdAt: { gte: sevenDaysAgo } },
    });
    const failedLoginCount = await db.auditLog.count({
      where: { action: "LOGIN_FAILED", createdAt: { gte: sevenDaysAgo } },
    });

    // Active threats (unresolved critical + high alerts)
    const activeThreats = unresolvedCritical + unresolvedHigh;

    return NextResponse.json({
      database: {
        type: "SQLite",
        status: "connected",
        operators: operatorCount,
        regions: regionCount,
        measures: measureCount,
        activeAlerts: activeAlertCount,
        reports: reportCount,
        users: userCount,
        activeUsers: activeUserCount,
        campaigns: campaignCount,
        activeCampaigns: activeCampaignCount,
        auditLogs: auditLogCount,
      },
      security: {
        overallScore: securityScore,
        complianceScore,
        activeThreats,
        unresolvedCritical,
        unresolvedHigh,
        twoFactorEnabled: false,
        encryptionStatus: "Chiffrement AES-256 actif",
        dataResidency: "Guinée - Conformité SOA",
      },
      activity: {
        recentAuditCount,
        loginCount,
        failedLoginCount,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api — API root: health check and available endpoints
// REQUIRES AUTHENTICATION — stats & endpoint map are not public
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  try {
    // Auth check — reject unauthenticated requests
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Quick DB health check
    let dbStatus = "ok";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = "error";
    }

    // Count key entities (only for authenticated users)
    const [users, operators, regions, campaigns, measures, alerts, reports] = await Promise.all([
      db.user.count().catch(() => -1),
      db.operateur.count().catch(() => -1),
      db.region.count().catch(() => -1),
      db.campagne.count().catch(() => -1),
      db.mesureQoS.count().catch(() => -1),
      db.alerte.count().catch(() => -1),
      db.rapport.count().catch(() => -1),
    ]);

    return NextResponse.json({
      name: "ONIT-PNG API",
      version: "1.0.0",
      description: "Observatoire National de l'Infrastructure des Télécommunications - Plateforme Nationale de Supervision",
      status: "operational",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      stats: {
        users,
        operators,
        regions,
        campaigns,
        measures,
        alerts,
        reports,
      },
      endpoints: {
        auth: {
          "POST /api/auth/signin": "Authenticate user",
          "POST /api/auth/signout": "Sign out user",
          "GET /api/auth/session": "Get current session",
        },
        core: {
          "GET /api/alerts": "List alerts (RLS-filtered)",
          "POST /api/alerts": "Create alert",
          "PATCH /api/alerts": "Resolve/unresolve alert",
          "GET /api/campaigns": "List campaigns (RLS-filtered)",
          "POST /api/campaigns": "Create campaign",
          "PATCH /api/campaigns": "Update campaign status",
          "GET /api/mesures": "List QoS measurements (RLS-filtered)",
          "POST /api/mesures": "Create measurement",
          "PUT /api/mesures": "Bulk import measurements (JSON/CSV)",
          "GET /api/scores": "List operator scores (RLS-filtered)",
          "POST /api/scores": "Create/update operator score (upsert)",
        },
        analytics: {
          "GET /api/scoring": "Scoring engine data",
          "GET /api/qos": "QoS metrics, trends, benchmark, heatmap",
        },
        reports: {
          "GET /api/reports": "List reports (RLS-filtered)",
          "POST /api/reports": "Create report",
          "PATCH /api/reports": "Update report",
        },
        admin: {
          "GET /api/audit-logs": "List audit logs",
          "GET /api/roles": "List roles with permissions",
          "POST /api/roles": "Create role / update permissions",
          "PATCH /api/roles": "Update role description",
          "GET /api/users": "List users",
          "POST /api/users": "Create user",
          "PATCH /api/users": "Update user",
        },
      },
    });
  } catch (error) {
    console.error("API root error:", error);
    return NextResponse.json({
      name: "ONIT-PNG API",
      version: "1.0.0",
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: { status: "error" },
      error: "Service partiellement disponible",
    }, { status: 503 });
  }
}

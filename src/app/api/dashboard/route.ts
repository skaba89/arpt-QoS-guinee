import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, getOperatorColor } from "@/lib/rbac";
import { handleApiError } from "@/lib/error-handler";
import type { RoleType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const userOrg = (session?.user as Record<string, unknown>)?.organization as string;

    const accessibleOpIds = await getAccessibleOperators(userRole as RoleType, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole as RoleType);
    const scope = await getRLSScope(userRole as RoleType);

    const rlsFilter = {
      ...(scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0 ? { operateurId: { in: accessibleOpIds } } : {}),
      ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
    };

    // ── PERFORMANCE OPTIMIZATION: Use SQL aggregation instead of loading 5000 rows ──

    // 1. Total measurements count
    const totalCount = await db.mesureQoS.count({ where: rlsFilter });

    // 2. Covered measurements count (rssi > -100)
    const coveredFilter = {
      ...rlsFilter,
      rssi: { gt: -100 },
    };
    const coveredCount = await db.mesureQoS.count({ where: coveredFilter });

    // 3. Average QoE from covered measurements only
    const coveredMeasures = await db.mesureQoS.findMany({
      where: { ...coveredFilter, scoreQoE: { not: null } },
      select: { scoreQoE: true },
    });
    const scoreQosGlobal = coveredMeasures.length > 0
      ? Math.round(coveredMeasures.reduce((sum, m) => sum + (m.scoreQoE || 0), 0) / coveredMeasures.length)
      : 0;

    // 4. Coverage percentage
    const couvertureNationale = totalCount > 0
      ? Math.round((coveredCount / totalCount) * 100)
      : 0;

    // 5. Trend calculation: recent (30d) vs older — using SQL aggregation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRssi = await db.mesureQoS.aggregate({
      _avg: { rssi: true },
      _count: true,
      where: { ...rlsFilter, timestamp: { gte: thirtyDaysAgo }, rssi: { not: null } },
    });
    const olderRssi = await db.mesureQoS.aggregate({
      _avg: { rssi: true },
      _count: true,
      where: { ...rlsFilter, timestamp: { lt: thirtyDaysAgo }, rssi: { not: null } },
    });

    const recentQoE = await db.mesureQoS.aggregate({
      _avg: { scoreQoE: true },
      _count: true,
      where: { ...rlsFilter, timestamp: { gte: thirtyDaysAgo }, scoreQoE: { not: null } },
    });
    const olderQoE = await db.mesureQoS.aggregate({
      _avg: { scoreQoE: true },
      _count: true,
      where: { ...rlsFilter, timestamp: { lt: thirtyDaysAgo }, scoreQoE: { not: null } },
    });

    const trendRssi = (recentRssi._count > 0 && olderRssi._count > 0 && recentRssi._avg.rssi && olderRssi._avg.rssi)
      ? Math.round((recentRssi._avg.rssi - olderRssi._avg.rssi) * 10) / 10
      : 0;
    const trendQoE = (recentQoE._count > 0 && olderQoE._count > 0 && recentQoE._avg.scoreQoE && olderQoE._avg.scoreQoE)
      ? Math.round((recentQoE._avg.scoreQoE - olderQoE._avg.scoreQoE) * 10) / 10
      : 0;

    // 6. Zones blanches count
    const zonesBlanches = await db.alerte.count({
      where: {
        type: "ZONE_BLANCHE",
        isResolved: false,
        ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
      },
    });

    // 7. Previous period zones blanches for trend
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevZonesBlanches = await db.alerte.count({
      where: {
        type: "ZONE_BLANCHE",
        isResolved: false,
        createdAt: { lt: prevMonthDate },
        ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
      },
    }).catch(() => 0);

    // 8. Population couverte (lightweight — only region population data)
    const coveredRegions = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only") ? { id: { in: accessibleRegIds } } : {},
      select: { population: true },
    });
    const totalPop = coveredRegions.reduce((sum, r) => sum + (r.population || 0), 0);
    const populationCouverte = totalPop > 0
      ? Math.round(totalPop * (couvertureNationale / 100) / 1000000 * 10) / 10
      : 0;

    // 9. Operator rankings with latest scores (unchanged — already efficient)
    const operators = await db.operateur.findMany({
      where: (scope !== "all" && scope !== "public_only") ? { id: { in: accessibleOpIds } } : {},
      include: {
        scores: { orderBy: { periode: "desc" }, take: 4 },
      },
    });

    const operatorRankings = operators.map((op) => {
      const latestScore = op.scores[0];
      const prevScore = op.scores[1];
      return {
        id: op.code.toLowerCase(),
        name: op.nom,
        code: op.code,
        color: getOperatorColor(op.code),
        score: latestScore?.scoreGlobal || 0,
        trend: latestScore && prevScore ? Math.round((latestScore.scoreGlobal - prevScore.scoreGlobal) * 10) / 10 : 0,
        subscores: {
          couverture: latestScore?.scoreCouverture || 0,
          qos: latestScore?.scoreQoS || 0,
          qoe: latestScore?.scoreQoE || 0,
          conformite: latestScore?.scoreConformite || 0,
          innovation: Math.round((
            (latestScore?.scoreQoS || 0) * 0.4 +
            (latestScore?.scoreQoE || 0) * 0.3 +
            (latestScore?.scoreConformite || 0) * 0.3
          )),
          investissement: Math.round((
            (latestScore?.scoreCouverture || 0) * 0.5 +
            (latestScore?.scoreConformite || 0) * 0.3 +
            (latestScore?.scoreQoS || 0) * 0.2
          )),
        },
        historicalScores: op.scores.map((s) => s.scoreGlobal).reverse(),
      };
    });

    // 10. Recent alerts (already limited to 10)
    const recentAlerts = await db.alerte.findMany({
      where: rlsFilter,
      include: { operateur: true, region: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedAlerts = recentAlerts.map((a) => ({
      id: a.id,
      type: a.severity === "CRITIQUE" ? "critical" : a.severity === "HAUTE" || a.severity === "MOYENNE" ? "warning" : "info",
      severity: a.severity,
      operator: a.operateur?.nom || "Système",
      region: a.region?.nom || "National",
      message: a.message,
      time: formatTimeAgo(a.createdAt),
    }));

    // 11. Region stats — OPTIMIZED: use aggregation per region instead of loading all measures
    const regionData = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only") ? { id: { in: accessibleRegIds } } : {},
      select: { id: true, nom: true, code: true, population: true },
    });

    // Batch: get per-region counts in parallel using aggregation
    const regionStats = await Promise.all(regionData.map(async (r) => {
      const regTotal = await db.mesureQoS.count({ where: { ...rlsFilter, regionId: r.id } });
      const regCovered = await db.mesureQoS.count({ where: { ...rlsFilter, regionId: r.id, rssi: { gt: -100 } } });
      const coverage = regTotal > 0 ? Math.round((regCovered / regTotal) * 100) : 0;

      // Average QoE for this region from covered measurements
      const regQoE = await db.mesureQoS.aggregate({
        _avg: { scoreQoE: true },
        _count: true,
        where: { ...rlsFilter, regionId: r.id, rssi: { gt: -100 }, scoreQoE: { not: null } },
      });
      const qos = regQoE._count > 0 && regQoE._avg.scoreQoE
        ? Math.round(regQoE._avg.scoreQoE)
        : 0;

      // White zone alerts for this region
      const regionWhiteZones = await db.alerte.count({
        where: {
          type: "ZONE_BLANCHE",
          isResolved: false,
          regionId: r.id,
        },
      }).catch(() => 0);

      return {
        name: r.nom,
        code: r.code,
        coverage,
        qos,
        population: r.population || 0,
        whiteZones: regionWhiteZones || (coverage > 0 ? Math.round((100 - coverage) / 3) : 0),
        color: coverage >= 80 ? "#10B981" : coverage >= 65 ? "#3B82F6" : coverage >= 50 ? "#F59E0B" : "#EF4444",
      };
    }));

    // 12. SLA compliance from DB scores (unchanged)
    const allScores = await db.scoreOperateur.findMany({
      where: scope !== "all" && scope !== "public_only" ? { operateurId: { in: accessibleOpIds } } : {},
      orderBy: { periode: "desc" },
    });

    const latestScoresByOp = new Map<string, number>();
    for (const s of allScores) {
      if (!latestScoresByOp.has(s.operateurId)) {
        latestScoresByOp.set(s.operateurId, s.scoreConformite);
      }
    }

    const slaComplianceOps: Record<string, number> = {};
    let totalSLA = 0;
    let slaCount = 0;
    for (const op of operators) {
      const conformite = latestScoresByOp.get(op.id) || 0;
      slaComplianceOps[op.code] = Math.round(conformite);
      totalSLA += conformite;
      slaCount++;
    }
    const globalSLA = slaCount > 0 ? Math.round(totalSLA / slaCount) : 0;

    return NextResponse.json({
      kpis: {
        couvertureNationale: { value: couvertureNationale, unit: "%", trend: trendRssi, label: "Couverture Nationale" },
        scoreQosGlobal: { value: scoreQosGlobal, unit: "/100", trend: trendQoE, label: "Score QoS Global" },
        zonesBlanches: { value: zonesBlanches, unit: "", trend: zonesBlanches > 0 ? Math.round((zonesBlanches - prevZonesBlanches) * 10) / 10 : 0, label: "Zones Blanches" },
        populationCouverte: { value: populationCouverte, unit: "M", trend: 0, label: "Population Couverte" },
      },
      operators: operatorRankings,
      alerts: formattedAlerts,
      regions: regionStats,
      slaCompliance: {
        global: globalSLA,
        operators: slaComplianceOps,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

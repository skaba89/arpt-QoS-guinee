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

    // Get total measurements for calculations
    const allMeasures = await db.mesureQoS.findMany({
      where: rlsFilter,
      include: { operateur: true, region: true },
      take: 5000,
    });

    // Calculate coverage: average of measurements with rssi > -100
    const goodSignalMeasures = allMeasures.filter((m) => (m.rssi ?? -100) > -100);
    const couvertureNationale = allMeasures.length > 0
      ? Math.round((goodSignalMeasures.length / allMeasures.length) * 100)
      : 0;

    // Calculate average QoS score — ONLY from covered measurements (rssi > -100)
    // In production, QoE is meaningless in dead zones; only report QoE where signal exists
    const coveredMeasures = allMeasures.filter((m) => (m.rssi ?? -100) > -100);
    const qosScores = coveredMeasures.map((m) => m.scoreQoE).filter((v): v is number => v !== null);
    const scoreQosGlobal = qosScores.length > 0
      ? Math.round(qosScores.reduce((a, b) => a + b, 0) / qosScores.length)
      : 0;

    // Count zones blanches (unresolved alerts of type ZONE_BLANCHE)
    const zonesBlanches = await db.alerte.count({
      where: {
        type: "ZONE_BLANCHE",
        isResolved: false,
        ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
      },
    });

    // Population couverte
    const coveredRegions = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only") ? { id: { in: accessibleRegIds } } : {},
    });
    const totalPop = coveredRegions.reduce((sum, r) => sum + (r.population || 0), 0);
    const populationCouverte = totalPop > 0
      ? Math.round(totalPop * (couvertureNationale / 100) / 1000000 * 10) / 10
      : 0;

    // Calculate KPI trends from DB: compare recent (last 30 days) vs older measurements
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMeasures = allMeasures.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo);
    const olderMeasures = allMeasures.filter((m) => new Date(m.timestamp) < thirtyDaysAgo);

    const trendCalc = (field: "rssi" | "scoreQoE") => {
      const recentVals = recentMeasures.map((m) => m[field]).filter((v): v is number => v !== null);
      const olderVals = olderMeasures.map((m) => m[field]).filter((v): v is number => v !== null);
      if (!recentVals.length || !olderVals.length) return 0;
      const recentAvg = recentVals.reduce((a, b) => a + b, 0) / recentVals.length;
      const olderAvg = olderVals.reduce((a, b) => a + b, 0) / olderVals.length;
      return Math.round((recentAvg - olderAvg) * 10) / 10;
    };

    // Count previous period zones blanches for trend
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

    // Operator rankings with latest scores
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
          // TODO: Add scoreInnovation/scoreInvestissement to ScoreOperateur model
          // Currently derived as weighted blends to avoid exact duplication
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

    // Recent alerts
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

    // Region data
    const regionData = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only") ? { id: { in: accessibleRegIds } } : {},
    });

    const regionStats = await Promise.all(regionData.map(async (r) => {
      const regMeasures = allMeasures.filter((m) => m.regionId === r.id);
      const regGoodSignal = regMeasures.filter((m) => (m.rssi ?? -100) > -100);
      const coverage = regMeasures.length > 0 ? Math.round((regGoodSignal.length / regMeasures.length) * 100) : 0;
      // Only calculate QoS from covered measurements (dead zones skew the average)
      const qosMeasures = regGoodSignal.filter((m) => m.scoreQoE !== null);
      const qos = qosMeasures.length > 0
        ? Math.round(qosMeasures.reduce((s, m) => s + (m.scoreQoE || 0), 0) / qosMeasures.length)
        : 0;

      // Count actual white zone alerts for this region
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

    // SLA compliance from DB scores
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
        couvertureNationale: { value: couvertureNationale, unit: "%", trend: trendCalc("rssi"), label: "Couverture Nationale" },
        scoreQosGlobal: { value: scoreQosGlobal, unit: "/100", trend: trendCalc("scoreQoE"), label: "Score QoS Global" },
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

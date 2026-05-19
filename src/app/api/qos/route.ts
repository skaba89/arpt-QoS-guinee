import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, getOperatorColor } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: average of an array, rounded to 1 decimal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const avg = (arr: number[]): number =>
  arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: convert periode string like "2026-Q1" to month label
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function periodeToLabel(periode: string): string {
  const match = periode.match(/(\d{4})-Q(\d)/);
  if (!match) return periode;
  const quarterMonths: Record<string, string> = { "1": "T1", "2": "T2", "3": "T3", "4": "T4" };
  const monthLabel = quarterMonths[match[2]];
  return monthLabel ? `${monthLabel} ${match[1].slice(2)}` : periode;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/qos — QoS metrics, trends, benchmark, heatmap, per-operator
// Query params: operateur, region, periode, type
// All data derived from the database — NO hardcoded values
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operateurFilter = searchParams.get("operateur");
    const regionFilter = searchParams.get("region");
    const type = searchParams.get("type");

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;

    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);
    const scope = await getRLSScope(userRole);

    // ── Build where clause for measurements ──
    const measureWhere: Record<string, unknown> = {};
    if (scope !== "all") {
      measureWhere.operateurId = { in: accessibleOpIds };
      measureWhere.regionId = { in: accessibleRegIds };
    }
    if (operateurFilter && operateurFilter !== "all") {
      const op = await db.operateur.findFirst({ where: { code: operateurFilter.toUpperCase() } });
      if (op) measureWhere.operateurId = op.id;
    }
    if (regionFilter && regionFilter !== "all") {
      const reg = await db.region.findFirst({ where: { code: regionFilter.toUpperCase() } });
      if (reg) measureWhere.regionId = reg.id;
    }
    if (type) measureWhere.typeMesure = type;

    // ── 1. Fetch measurements for aggregation ──
    const measures = await db.mesureQoS.findMany({
      where: measureWhere,
      include: { operateur: true, region: true },
      orderBy: { timestamp: "desc" },
      take: 2000,
    });

    // ── 2. Calculate aggregated metrics from DB ──
    const latenceValues = measures.map((m) => m.latence).filter((v): v is number => v !== null);
    const debitValues = measures.map((m) => m.debitDescendant).filter((v): v is number => v !== null);
    const tauxAppelValues = measures.map((m) => m.tauxAppelReussi).filter((v): v is number => v !== null);
    const jitterValues = measures.map((m) => m.gigue).filter((v): v is number => v !== null);

    // Compute trends by comparing recent vs older measurements
    const half = Math.floor(measures.length / 2);
    const recentMeasures = measures.slice(0, half);
    const olderMeasures = measures.slice(half);

    const trendCalc = (recent: typeof recentMeasures, older: typeof olderMeasures, field: "latence" | "debitDescendant" | "tauxAppelReussi" | "gigue") => {
      const recentVals = recent.map((m) => m[field]).filter((v): v is number => v !== null);
      const olderVals = older.map((m) => m[field]).filter((v): v is number => v !== null);
      if (!recentVals.length || !olderVals.length) return 0;
      return Math.round((avg(recentVals) - avg(olderVals)) * 10) / 10;
    };

    const metrics = {
      latency: { value: avg(latenceValues), unit: "ms", label: "Latence Moyenne", trend: trendCalc(recentMeasures, olderMeasures, "latence") },
      debit: { value: avg(debitValues), unit: "Mbps", label: "Débit Moyen", trend: trendCalc(recentMeasures, olderMeasures, "debitDescendant") },
      tauxAppel: { value: avg(tauxAppelValues), unit: "%", label: "Taux Appel Réussi", trend: trendCalc(recentMeasures, olderMeasures, "tauxAppelReussi") },
      jitter: { value: avg(jitterValues), unit: "ms", label: "Jitter", trend: trendCalc(recentMeasures, olderMeasures, "gigue") },
    };

    // ── 3. Per-operator metrics from DB ──
    const operators = await db.operateur.findMany({
      where: scope !== "all" ? { id: { in: accessibleOpIds } } : {},
    });

    const perOperator = operators.map((op) => {
      const opMeasures = measures.filter((m) => m.operateurId === op.id);
      const opLatence = opMeasures.map((m) => m.latence).filter((v): v is number => v !== null);
      const opDebit = opMeasures.map((m) => m.debitDescendant).filter((v): v is number => v !== null);
      const opTauxAppel = opMeasures.map((m) => m.tauxAppelReussi).filter((v): v is number => v !== null);
      const opJitter = opMeasures.map((m) => m.gigue).filter((v): v is number => v !== null);
      const opScoreQoE = opMeasures.map((m) => m.scoreQoE).filter((v): v is number => v !== null);
      const opDropCall = opMeasures.map((m) => m.tauxDropCall).filter((v): v is number => v !== null);

      // Disponibilité = tauxAppelReussi - tauxDropCall (from actual measurements)
      const disponibilite = opTauxAppel.length > 0
        ? Math.max(0, avg(opTauxAppel) - (opDropCall.length > 0 ? avg(opDropCall) : 0))
        : 0;

      return {
        id: op.code.toLowerCase(),
        name: op.nom,
        code: op.code,
        color: getOperatorColor(op.code),
        score: avg(opScoreQoE),
        latence: avg(opLatence),
        debit: avg(opDebit),
        tauxAppel: avg(opTauxAppel),
        jitter: avg(opJitter),
        disponibilite: Math.round(disponibilite * 10) / 10,
        mesureCount: opMeasures.length,
      };
    });

    // ── 4. Trend data from ScoreOperateur (DB) ──
    const allScores = await db.scoreOperateur.findMany({
      where: scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {},
      orderBy: { periode: "asc" },
    });

    // Get unique sorted periods
    const uniquePeriods = [...new Set(allScores.map((s) => s.periode))].sort();

    // Build trend data per operator
    const trendByOperator = (code: string) => {
      const op = operators.find((o) => o.code === code);
      if (!op) return uniquePeriods.map(() => 0);
      return uniquePeriods.map((p) => {
        const score = allScores.find((s) => s.operateurId === op.id && s.periode === p);
        return score?.scoreGlobal || 0;
      });
    };

    // Use last 6 periods for display (or fewer if not enough data)
    const displayPeriods = uniquePeriods.slice(-6);
    const trendData: Record<string, unknown> = {
      months: displayPeriods.map(periodeToLabel),
    };
    // Dynamically include all operators in trend data
    for (const op of operators) {
      trendData[op.code.toLowerCase()] = trendByOperator(op.code).slice(-6);
    }

    // ── 5. Benchmark from DB measurements ──
    const buildBenchmarkRow = (metricLabel: string, field: "latence" | "debitDescendant" | "tauxAppelReussi" | "gigue", threshold: number) => {
      const row: Record<string, unknown> = { metric: metricLabel, threshold };
      for (const op of operators) {
        const opVals = measures
          .filter((m) => m.operateurId === op.id)
          .map((m) => m[field])
          .filter((v): v is number => v !== null);
        row[op.code.toLowerCase()] = avg(opVals);
      }
      return row;
    };

    const benchmark = [
      buildBenchmarkRow("Latence (ms)", "latence", 50),
      buildBenchmarkRow("Débit (Mbps)", "debitDescendant", 15),
      buildBenchmarkRow("Taux Appel (%)", "tauxAppelReussi", 90),
      buildBenchmarkRow("Jitter (ms)", "gigue", 10),
    ];

    // Add Disponibilité row from DB data
    const dispoRow: Record<string, unknown> = { metric: "Disponibilité (%)", threshold: 98 };
    for (const op of operators) {
      const opMatch = perOperator.find((p) => p.code === op.code);
      dispoRow[op.code.toLowerCase()] = opMatch?.disponibilite || 0;
    }
    benchmark.push(dispoRow as { metric: string; threshold: number; [key: string]: unknown });

    // ── 6. Regional heatmap from DB ──
    const regions = await db.region.findMany({
      where: scope !== "all" ? { id: { in: accessibleRegIds } } : {},
    });

    // Query aggregate QoE per region directly from DB for better accuracy
    const regionalHeatmap = await Promise.all(
      regions.map(async (r) => {
        const regMeasures = await db.mesureQoS.findMany({
          where: {
            regionId: r.id,
            ...measureWhere,
          },
          select: { scoreQoE: true, latence: true, debitDescendant: true },
          take: 500,
        });
        const qosScores = regMeasures.map((m) => m.scoreQoE).filter((v): v is number => v !== null);
        const latScores = regMeasures.map((m) => m.latence).filter((v): v is number => v !== null);
        const debitScores = regMeasures.map((m) => m.debitDescendant).filter((v): v is number => v !== null);

        // Compute a composite QoS score if scoreQoE is not available
        const qos = qosScores.length > 0
          ? avg(qosScores)
          : latScores.length > 0 && debitScores.length > 0
            ? Math.max(0, Math.min(100, 100 - avg(latScores) + avg(debitScores)))
            : 0;

        return { name: r.nom, code: r.code, qos: Math.round(qos * 10) / 10 };
      })
    );

    return NextResponse.json({
      metrics,
      trendData,
      benchmark,
      regionalHeatmap,
      perOperator,
    });
  } catch (error) {
    console.error("QoS API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

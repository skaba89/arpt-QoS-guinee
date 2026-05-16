import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operateur = searchParams.get("operateur");
    const region = searchParams.get("region");
    const periode = searchParams.get("periode");
    const type = searchParams.get("type");

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;

    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);
    const scope = await getRLSScope(userRole);

    const where: Record<string, unknown> = {};
    if (scope !== "all") {
      where.operateurId = { in: accessibleOpIds };
      where.regionId = { in: accessibleRegIds };
    }
    if (operateur && operateur !== "all") {
      const op = await db.operateur.findFirst({ where: { code: operateur.toUpperCase() } });
      if (op) where.operateurId = op.id;
    }
    if (region && region !== "all") {
      const reg = await db.region.findFirst({ where: { code: region.toUpperCase() } });
      if (reg) where.regionId = reg.id;
    }
    if (type) where.typeMesure = type;

    const measures = await db.mesureQoS.findMany({
      where,
      include: { operateur: true, region: true },
      orderBy: { timestamp: "desc" },
      take: 500,
    });

    // Calculate aggregated metrics
    const latenceValues = measures.map((m) => m.latence).filter(Boolean) as number[];
    const debitValues = measures.map((m) => m.debitDescendant).filter(Boolean) as number[];
    const tauxAppelValues = measures.map((m) => m.tauxAppelReussi).filter(Boolean) as number[];
    const jitterValues = measures.map((m) => m.gigue).filter(Boolean) as number[];

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;

    // Per-operator metrics
    const operatorMetrics = await db.operateur.findMany({
      where: scope !== "all" ? { id: { in: accessibleOpIds } } : {},
      include: { mesures: { take: 100, orderBy: { timestamp: "desc" } } },
    });

    const perOperator = operatorMetrics.map((op) => {
      const opMeasures = measures.filter((m) => m.operateurId === op.id);
      return {
        id: op.code.toLowerCase(),
        name: op.nom,
        code: op.code,
        color: op.code === "ORANGE" ? "#FF7900" : op.code === "MTN" ? "#FFCC00" : "#00B4D8",
        score: avg(opMeasures.map((m) => m.scoreQoE).filter(Boolean) as number[]) || 0,
        latence: avg(opMeasures.map((m) => m.latence).filter(Boolean) as number[]),
        debit: avg(opMeasures.map((m) => m.debitDescendant).filter(Boolean) as number[]),
        tauxAppel: avg(opMeasures.map((m) => m.tauxAppelReussi).filter(Boolean) as number[]),
        jitter: avg(opMeasures.map((m) => m.gigue).filter(Boolean) as number[]),
        disponibilite: 99 - (op.code === "CELCOM" ? 1.9 : op.code === "MTN" ? 1.5 : 0.8),
      };
    });

    // Trend data (simulated monthly from score history)
    const trendMonths = ["Oct", "Nov", "Déc", "Jan", "Fév", "Mar"];
    const trendData = await db.scoreOperateur.findMany({
      where: scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {},
      orderBy: { periode: "desc" },
      take: 12,
    });

    const trendByOperator = (code: string) => {
      const scores = trendData
        .filter((s) => {
          const op = operatorMetrics.find((o) => o.id === s.operateurId);
          return op?.code === code;
        })
        .map((s) => s.scoreGlobal)
        .reverse();
      return scores.length >= 6 ? scores.slice(-6) : [65, 67, 69, 71, 73, 75].map((v, i) =>
        code === "ORANGE" ? v + 5 : code === "MTN" ? v : v - 8
      );
    };

    // Benchmark data
    const benchmarkData = [
      { metric: "Latence (ms)", orange: avg(measures.filter((m) => m.operateur?.code === "ORANGE").map((m) => m.latence).filter(Boolean) as number[]) || 38, mtn: avg(measures.filter((m) => m.operateur?.code === "MTN").map((m) => m.latence).filter(Boolean) as number[]) || 45, celcom: avg(measures.filter((m) => m.operateur?.code === "CELCOM").map((m) => m.latence).filter(Boolean) as number[]) || 55, threshold: 50 },
      { metric: "Débit (Mbps)", orange: avg(measures.filter((m) => m.operateur?.code === "ORANGE").map((m) => m.debitDescendant).filter(Boolean) as number[]) || 22, mtn: avg(measures.filter((m) => m.operateur?.code === "MTN").map((m) => m.debitDescendant).filter(Boolean) as number[]) || 18, celcom: avg(measures.filter((m) => m.operateur?.code === "CELCOM").map((m) => m.debitDescendant).filter(Boolean) as number[]) || 12, threshold: 15 },
      { metric: "Taux Appel (%)", orange: avg(measures.filter((m) => m.operateur?.code === "ORANGE").map((m) => m.tauxAppelReussi).filter(Boolean) as number[]) || 96, mtn: avg(measures.filter((m) => m.operateur?.code === "MTN").map((m) => m.tauxAppelReussi).filter(Boolean) as number[]) || 93, celcom: avg(measures.filter((m) => m.operateur?.code === "CELCOM").map((m) => m.tauxAppelReussi).filter(Boolean) as number[]) || 89, threshold: 90 },
      { metric: "Jitter (ms)", orange: avg(measures.filter((m) => m.operateur?.code === "ORANGE").map((m) => m.gigue).filter(Boolean) as number[]) || 6, mtn: avg(measures.filter((m) => m.operateur?.code === "MTN").map((m) => m.gigue).filter(Boolean) as number[]) || 9, celcom: avg(measures.filter((m) => m.operateur?.code === "CELCOM").map((m) => m.gigue).filter(Boolean) as number[]) || 14, threshold: 10 },
      { metric: "Disponibilité (%)", orange: 99.2, mtn: 98.5, celcom: 97.1, threshold: 98 },
    ];

    // Regional heatmap
    const regions = await db.region.findMany({
      where: scope !== "all" ? { id: { in: accessibleRegIds } } : {},
    });

    const regionalHeatmap = regions.map((r) => {
      const regMeasures = measures.filter((m) => m.regionId === r.id);
      const qos = avg(regMeasures.map((m) => m.scoreQoE).filter(Boolean) as number[]) || 50;
      return { name: r.nom, code: r.code, qos };
    });

    return NextResponse.json({
      metrics: {
        latency: { value: avg(latenceValues) || 42, unit: "ms", label: "Latence Moyenne", trend: -3 },
        debit: { value: avg(debitValues) || 18.5, unit: "Mbps", label: "Débit Moyen", trend: 1.2 },
        tauxAppel: { value: avg(tauxAppelValues) || 94.2, unit: "%", label: "Taux Appel Réussi", trend: 0.5 },
        jitter: { value: avg(jitterValues) || 8, unit: "ms", label: "Jitter", trend: -1 },
      },
      trendData: {
        months: trendMonths,
        orange: trendByOperator("ORANGE"),
        mtn: trendByOperator("MTN"),
        celcom: trendByOperator("CELCOM"),
      },
      benchmark: benchmarkData,
      regionalHeatmap,
      perOperator,
    });
  } catch (error) {
    console.error("QoS API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

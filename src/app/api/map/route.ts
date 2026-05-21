import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope, getOperatorColor } from "@/lib/rbac";
import type { RoleType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const userOrg = (session?.user as Record<string, unknown>)?.organization as string;
    const scope = await getRLSScope(userRole as RoleType);
    const accessibleOpIds = await getAccessibleOperators(userRole as RoleType, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole as RoleType);

    const rlsFilter = {
      ...(scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0 ? { operateurId: { in: accessibleOpIds } } : {}),
      ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
    };

    // Parse query params
    const { searchParams } = new URL(request.url);
    const operateurCode = searchParams.get("operateur");
    const regionCode = searchParams.get("region");
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 5000);

    // Override RLS filters with specific params
    if (operateurCode && operateurCode !== "all") {
      const op = await db.operateur.findFirst({ where: { code: operateurCode.toUpperCase() } });
      if (op) (rlsFilter as Record<string, unknown>).operateurId = op.id;
    }
    if (regionCode && regionCode !== "all") {
      const reg = await db.region.findFirst({ where: { code: regionCode.toUpperCase() } });
      if (reg) (rlsFilter as Record<string, unknown>).regionId = reg.id;
    }

    const regions = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0) ? { id: { in: accessibleRegIds } } : {},
    });

    const measures = await db.mesureQoS.findMany({
      where: rlsFilter,
      include: { operateur: true, region: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Build region overlay data
    const regionOverlay = regions.map((r) => {
      const regMeasures = measures.filter((m) => m.regionId === r.id);
      const goodSignal = regMeasures.filter((m) => (m.rssi ?? -100) > -100);
      const coverage = regMeasures.length > 0 ? Math.round((goodSignal.length / regMeasures.length) * 100) : 0;
      // Only calculate QoS from covered measurements (dead zones skew the average)
      const qosMeasures = goodSignal.filter((m) => m.scoreQoE !== null);
      const qos = qosMeasures.length > 0
        ? Math.round(qosMeasures.reduce((s, m) => s + (m.scoreQoE || 0), 0) / qosMeasures.length)
        : 0;

      return {
        code: r.code,
        nom: r.nom,
        centreLat: r.centreLat,
        centreLng: r.centreLng,
        population: r.population,
        coverage,
        qos,
        color: coverage >= 80 ? "#10B981" : coverage >= 65 ? "#3B82F6" : coverage >= 50 ? "#F59E0B" : "#EF4444",
        whiteZones: coverage > 0 ? Math.round((100 - coverage) / 3) : 0,
        measurementCount: regMeasures.length,
      };
    });

    // Measurement points for map markers
    const measurementPoints = measures.slice(0, 200).map((m) => ({
      lat: m.latitude,
      lng: m.longitude,
      operator: m.operateur.code,
      operatorColor: getOperatorColor(m.operateur.code),
      rssi: m.rssi,
      rsrp: m.rsrp,
      scoreQoE: m.scoreQoE,
      type: m.typeMesure,
      timestamp: m.timestamp,
    }));

    // Operator data for map
    const operators = await db.operateur.findMany({
      where: scope !== "all" && scope !== "public_only" ? { id: { in: accessibleOpIds } } : {},
    });

    const operatorData = operators.map((op) => ({
      id: op.code.toLowerCase(),
      name: op.nom,
      code: op.code,
      color: getOperatorColor(op.code),
    }));

    return NextResponse.json({
      regions: regionOverlay,
      measurementPoints,
      operators: operatorData,
    });
  } catch (error) {
    console.error("Map API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

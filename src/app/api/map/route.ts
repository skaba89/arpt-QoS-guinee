import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";
import type { RoleType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const userOrg = (session?.user as Record<string, unknown>)?.organization as string;
    const scope = await getRLSScope(userRole as RoleType);
    const accessibleOpIds = await getAccessibleOperators(userRole as RoleType, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole as RoleType);

    const regions = await db.region.findMany({
      where: (scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0) ? { id: { in: accessibleRegIds } } : {},
    });

    const measures = await db.mesureQoS.findMany({
      where: {
        ...(scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0 ? { operateurId: { in: accessibleOpIds } } : {}),
        ...(scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0 ? { regionId: { in: accessibleRegIds } } : {}),
      },
      include: { operateur: true, region: true },
    });

    // Build region overlay data
    const regionOverlay = regions.map((r) => {
      const regMeasures = measures.filter((m) => m.regionId === r.id);
      const goodSignal = regMeasures.filter((m) => (m.rssi ?? -100) > -100);
      const coverage = regMeasures.length > 0 ? Math.round((goodSignal.length / regMeasures.length) * 100) : 50;
      const qos = regMeasures.length > 0
        ? Math.round(regMeasures.filter((m) => m.scoreQoE).reduce((s, m) => s + (m.scoreQoE || 0), 0) / Math.max(regMeasures.filter((m) => m.scoreQoE).length, 1))
        : 50;

      return {
        code: r.code,
        nom: r.nom,
        centreLat: r.centreLat,
        centreLng: r.centreLng,
        population: r.population,
        coverage,
        qos,
        color: coverage >= 80 ? "#10B981" : coverage >= 65 ? "#3B82F6" : coverage >= 50 ? "#F59E0B" : "#EF4444",
        whiteZones: Math.round((100 - coverage) / 3),
        measurementCount: regMeasures.length,
      };
    });

    // Measurement points for map markers
    const measurementPoints = measures.slice(0, 100).map((m) => ({
      lat: m.latitude,
      lng: m.longitude,
      operator: m.operateur.code,
      operatorColor: m.operateur.code === "ORANGE" ? "#FF7900" : m.operateur.code === "MTN" ? "#FFCC00" : "#00B4D8",
      rssi: m.rssi,
      scoreQoE: m.scoreQoE,
      type: m.typeMesure,
    }));

    // Operator data for map
    const operators = await db.operateur.findMany({
      where: scope !== "all" ? { id: { in: accessibleOpIds } } : {},
    });

    const operatorData = operators.map((op) => ({
      id: op.code.toLowerCase(),
      name: op.nom,
      code: op.code,
      color: op.code === "ORANGE" ? "#FF7900" : op.code === "MTN" ? "#FFCC00" : "#00B4D8",
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

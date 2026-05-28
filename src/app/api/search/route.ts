import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";
import { stripHtml } from "@/lib/utils-api";
import type { RoleType } from "@prisma/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/search?q=query
// Global search across operators, regions, alerts, campaigns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const userOrg = session?.user ? ((session.user as Record<string, unknown>).organization as string) : undefined;

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const query = stripHtml(rawQuery).trim();

    if (query.length < 2) {
      return NextResponse.json({
        operators: [],
        regions: [],
        alerts: [],
        campaigns: [],
      });
    }

    const scope = await getRLSScope(userRole as RoleType);
    const accessibleOpIds = await getAccessibleOperators(userRole as RoleType, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole as RoleType);

    const opFilter = scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0
      ? { id: { in: accessibleOpIds } }
      : {};
    const regFilter = scope !== "all" && scope !== "public_only" && accessibleRegIds.length > 0
      ? { id: { in: accessibleRegIds } }
      : {};

    // Search in parallel
    const [operators, regions, alerts, campaigns] = await Promise.all([
      // Operators: search by name, code, licence
      db.operateur.findMany({
        where: {
          ...opFilter,
          OR: [
            { nom: { contains: query } },
            { code: { contains: query.toUpperCase() } },
            { licence: { contains: query } },
          ],
        },
        take: 10,
        select: { id: true, nom: true, code: true, type: true, isActive: true },
      }),

      // Regions: search by name, code
      db.region.findMany({
        where: {
          ...regFilter,
          OR: [
            { nom: { contains: query } },
            { code: { contains: query.toUpperCase() } },
          ],
        },
        take: 10,
        select: { id: true, nom: true, code: true, population: true },
      }),

      // Alerts: search by message, type, severity
      db.alerte.findMany({
        where: {
          OR: [
            { message: { contains: query } },
            { type: { contains: query.toUpperCase() } },
            { severity: { contains: query.toUpperCase() } },
          ],
          ...(scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0
            ? { operateurId: { in: accessibleOpIds } }
            : {}),
        },
        include: { operateur: { select: { nom: true, code: true } }, region: { select: { nom: true, code: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Campaigns: search by name, type, responsable
      db.campagne.findMany({
        where: {
          OR: [
            { nom: { contains: query } },
            { type: { contains: query.toUpperCase() } },
            { responsable: { contains: query } },
          ],
          ...(scope !== "all" && scope !== "public_only" && accessibleOpIds.length > 0
            ? { operateurId: { in: accessibleOpIds } }
            : {}),
        },
        include: { operateur: { select: { nom: true, code: true } }, region: { select: { nom: true, code: true } } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      query,
      operators,
      regions,
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        message: a.message,
        operator: a.operateur?.nom || "Système",
        region: a.region?.nom || "National",
        isResolved: a.isResolved,
        createdAt: a.createdAt,
      })),
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.nom,
        type: c.type,
        operator: c.operateur.nom,
        region: c.region.nom,
        statut: c.statut,
        dateDebut: c.dateDebut,
      })),
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

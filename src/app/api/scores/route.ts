import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getRLSScope } from "@/lib/rbac";
import { z } from "zod";

// ── Zod Schema ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

const scoreField = z.number().min(0, "Score minimum: 0").max(100, "Score maximum: 100").optional();

const createScoreSchema = z.object({
  operateurId: z.string().max(50).transform(stripHtml).optional(),
  operatorCode: z.string().max(20).transform(stripHtml).optional(),
  periode: z.string().min(1, "Période requise (ex: 2026-Q1)").max(20).transform(stripHtml),
  scoreGlobal: scoreField,
  scoreCouverture: scoreField,
  scoreQoS: scoreField,
  scoreQoE: scoreField,
  scoreConformite: scoreField,
  recommandation: z.string().max(2000).transform(stripHtml).optional(),
}).refine(
  (data) => data.operateurId || data.operatorCode,
  { message: "operateurId ou operatorCode requis", path: ["operateurId"] }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/scores — List operator scores (RLS-filtered)
// Query params: operateur, periode
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user
      ? ((session.user as Record<string, unknown>).role as string)
      : "PUBLIC";
    const userOrg = session?.user
      ? ((session.user as Record<string, unknown>).organization as string)
      : undefined;

    const scope = await getRLSScope(userRole, "campaigns");
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);

    const { searchParams } = new URL(request.url);
    const operateurCode = searchParams.get("operateur");
    const periode = searchParams.get("periode");

    const where: Record<string, unknown> = {
      ...(scope !== "all" && scope !== "public_only" ? { operateurId: { in: accessibleOpIds } } : {}),
    };

    if (operateurCode) {
      const op = await db.operateur.findFirst({ where: { code: operateurCode.toUpperCase() } });
      if (op) where.operateurId = op.id;
    }

    if (periode) {
      where.periode = periode;
    }

    const scores = await db.scoreOperateur.findMany({
      where,
      include: { operateur: true },
      orderBy: [{ periode: "desc" }, { operateur: { nom: "asc" } }],
    });

    const result = scores.map((s) => ({
      id: s.id,
      operateur: s.operateur.nom,
      operateurCode: s.operateur.code,
      periode: s.periode,
      scoreGlobal: s.scoreGlobal,
      scoreCouverture: s.scoreCouverture,
      scoreQoS: s.scoreQoS,
      scoreQoE: s.scoreQoE,
      scoreConformite: s.scoreConformite,
      recommandation: s.recommandation,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ scores: result });
  } catch (error) {
    console.error("Scores GET API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/scores — Create or update an operator score (upsert)
// Body: { operateurId, periode, scoreGlobal, scoreCouverture, scoreQoS, scoreQoE, scoreConformite, recommandation? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "scoring", "write");
    if (!canWrite) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — scoring:write requis" },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const parsed = createScoreSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Resolve operator
    let operateurId = body.operateurId;
    if (!operateurId && body.operatorCode) {
      const op = await db.operateur.findFirst({ where: { code: body.operatorCode.toUpperCase() } });
      if (!op) return NextResponse.json({ error: `Opérateur non trouvé: ${body.operatorCode}` }, { status: 400 });
      operateurId = op.id;
    }

    if (!operateurId) {
      return NextResponse.json({ error: "operateurId ou operatorCode requis" }, { status: 400 });
    }

    try {
      // Upsert score (create or update for same operator + period)
      const score = await db.scoreOperateur.upsert({
        where: {
          operateurId_periode: {
            operateurId: operateurId,
            periode: body.periode,
          },
        },
        create: {
          operateurId: operateurId,
          periode: body.periode,
          scoreGlobal: body.scoreGlobal ?? 0,
          scoreCouverture: body.scoreCouverture ?? 0,
          scoreQoS: body.scoreQoS ?? 0,
          scoreQoE: body.scoreQoE ?? 0,
          scoreConformite: body.scoreConformite ?? 0,
          recommandation: body.recommandation ?? "",
        },
        update: {
          scoreGlobal: body.scoreGlobal ?? 0,
          scoreCouverture: body.scoreCouverture ?? 0,
          scoreQoS: body.scoreQoS ?? 0,
          scoreQoE: body.scoreQoE ?? 0,
          scoreConformite: body.scoreConformite ?? 0,
          recommandation: body.recommandation ?? "",
        },
      });

      await logAudit(
        userId,
        "CREATE",
        "score",
        JSON.stringify({ operateurId, periode: body.periode, scoreGlobal: body.scoreGlobal }),
        score.id
      );

      return NextResponse.json({ score, message: "Score mis à jour avec succès" }, { status: 201 });
    } catch (upsertError) {
      return NextResponse.json(
        { error: (upsertError as Error).message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Scores POST API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

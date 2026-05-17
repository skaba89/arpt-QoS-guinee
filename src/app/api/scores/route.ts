import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getRLSScope } from "@/lib/rbac";

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

    const body = await request.json();

    // Validate required fields
    if (!body.operateurId && !body.operatorCode) {
      return NextResponse.json({ error: "operateurId ou operatorCode requis" }, { status: 400 });
    }
    if (!body.periode) {
      return NextResponse.json({ error: "periode requis (ex: 2026-Q1)" }, { status: 400 });
    }

    // Resolve operator
    let operateurId = body.operateurId;
    if (!operateurId && body.operatorCode) {
      const op = await db.operateur.findFirst({ where: { code: body.operatorCode.toUpperCase() } });
      if (!op) return NextResponse.json({ error: `Opérateur non trouvé: ${body.operatorCode}` }, { status: 400 });
      operateurId = op.id;
    }

    // Validate score ranges (0-100)
    const validateScore = (val: unknown, name: string): number => {
      if (val === undefined || val === null) return 0;
      const n = parseFloat(String(val));
      if (isNaN(n) || n < 0 || n > 100) {
        throw new Error(`${name} doit être entre 0 et 100`);
      }
      return n;
    };

    try {
      const scoreGlobal = validateScore(body.scoreGlobal, "scoreGlobal");
      const scoreCouverture = validateScore(body.scoreCouverture, "scoreCouverture");
      const scoreQoS = validateScore(body.scoreQoS, "scoreQoS");
      const scoreQoE = validateScore(body.scoreQoE, "scoreQoE");
      const scoreConformite = validateScore(body.scoreConformite, "scoreConformite");

      // Upsert score (create or update for same operator + period)
      const score = await db.scoreOperateur.upsert({
        where: {
          operateurId_periode: {
            operateurId: operateurId!,
            periode: body.periode,
          },
        },
        create: {
          operateurId: operateurId!,
          periode: body.periode,
          scoreGlobal,
          scoreCouverture,
          scoreQoS,
          scoreQoE,
          scoreConformite,
          recommandation: body.recommandation || "",
        },
        update: {
          scoreGlobal,
          scoreCouverture,
          scoreQoS,
          scoreQoE,
          scoreConformite,
          recommandation: body.recommandation || "",
        },
      });

      await logAudit(
        userId,
        "CREATE",
        "score",
        JSON.stringify({ operateurId, periode: body.periode, scoreGlobal }),
        score.id
      );

      return NextResponse.json({ score, message: "Score mis à jour avec succès" }, { status: 201 });
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Scores POST API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

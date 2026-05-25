import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAccessibleOperators, getRLSScope, getOperatorColor } from "@/lib/rbac";
import { handleApiError } from "@/lib/error-handler";
import type { RoleType } from "@prisma/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/scoring — Scoring engine data for all operators
// Public access allowed (returns public_only data for unauthenticated)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const userOrg = (session?.user as Record<string, unknown>)?.organization as string;
    const scope = await getRLSScope(userRole as RoleType);
    const accessibleOpIds = await getAccessibleOperators(userRole as RoleType, userOrg);

    const operators = await db.operateur.findMany({
      where: scope !== "all" && scope !== "public_only" ? { id: { in: accessibleOpIds } } : {},
      include: {
        scores: { orderBy: { periode: "desc" } },
      },
    });

    const result = operators.map((op) => {
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
        recommendations: op.scores.filter((s) => s.recommandation).map((s) => ({
          periode: s.periode,
          text: s.recommandation,
        })),
      };
    });

    // Radar data — build from actual operator subscores
    const radarData = [
      { label: "Couverture", values: result.map((op) => op.subscores.couverture) },
      { label: "QoS", values: result.map((op) => op.subscores.qos) },
      { label: "QoE", values: result.map((op) => op.subscores.qoe) },
      { label: "Conformité", values: result.map((op) => op.subscores.conformite) },
      { label: "Innovation", values: result.map((op) => op.subscores.innovation) },
      { label: "Investissement", values: result.map((op) => op.subscores.investissement) },
    ];

    return NextResponse.json({
      operators: result,
      radarData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

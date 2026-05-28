import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  stripHtml,
  validateApiKeySecure,
  logPrestataireAudit,
  checkRateLimit,
} from "@/lib/utils-api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/prestataires/scores
// Accepts operator scores from external providers with SECURE API key auth
// Header: X-API-Key with pattern onit-{OPERATOR_CODE}-{secret}
// Key is validated against stored hash in Operateur.cleApi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Zod Schemas ──

const scoreField = z
  .number()
  .min(0, "Score minimum: 0")
  .max(100, "Score maximum: 100")
  .optional();

const scoreEntrySchema = z.object({
  periode: z
    .string()
    .min(1, "Période requise (ex: 2026-Q1)")
    .max(20)
    .transform(stripHtml),
  scoreGlobal: scoreField,
  scoreCouverture: scoreField,
  scoreQoS: scoreField,
  scoreQoE: scoreField,
  scoreConformite: scoreField,
  recommandation: z.string().max(2000).transform(stripHtml).optional(),
});

const prestataireScoresSchema = z.object({
  scores: z
    .array(scoreEntrySchema)
    .min(1, "Au moins un score requis")
    .max(100, "Maximum 100 scores par appel prestataire"),
});

// ── POST Handler ──

export async function POST(request: Request) {
  const apiKey = request.headers.get("X-API-Key");
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // ── Rate Limiting ──
  const rateLimitKey = `prestataire-scores:${ipAddress}`;
  const rateLimit = checkRateLimit(rateLimitKey, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Limite de requêtes atteinte. Réessayez dans ${rateLimit.resetIn}s.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetIn),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── Validate API Key (SECURE: checks against DB hash) ──
  const keyValidation = await validateApiKeySecure(apiKey);
  if (!keyValidation.valid) {
    return NextResponse.json(
      { error: keyValidation.error },
      { status: 401 }
    );
  }

  const operatorCode = keyValidation.operatorCode!;
  const operateurId = keyValidation.operatorId!;

  // ── Resolve Operator ──
  const operateur = await db.operateur.findFirst({
    where: { id: operateurId },
  });

  if (!operateur) {
    await logPrestataireAudit(
      "REJECTED",
      "scores",
      `Opérateur non trouvé: ${operatorCode}`,
      operatorCode,
      ipAddress,
      userAgent
    );
    return NextResponse.json(
      { error: `Opérateur non trouvé: ${operatorCode}` },
      { status: 400 }
    );
  }

  // ── Parse and Validate Body ──
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 }
    );
  }

  const parsed = prestataireScoresSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Données invalides",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // ── Upsert Scores ──
  const results: {
    periode: string;
    action: "created" | "updated";
    scoreGlobal?: number;
  }[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < body.scores.length; i++) {
    const scoreData = body.scores[i];

    try {
      const existing = await db.scoreOperateur.findUnique({
        where: {
          operateurId_periode: {
            operateurId: operateur.id,
            periode: scoreData.periode,
          },
        },
      });

      const upsertData = {
        scoreGlobal: scoreData.scoreGlobal ?? 0,
        scoreCouverture: scoreData.scoreCouverture ?? 0,
        scoreQoS: scoreData.scoreQoS ?? 0,
        scoreQoE: scoreData.scoreQoE ?? 0,
        scoreConformite: scoreData.scoreConformite ?? 0,
        recommandation: scoreData.recommandation ?? "",
      };

      if (existing) {
        await db.scoreOperateur.update({
          where: { id: existing.id },
          data: upsertData,
        });
        results.push({
          periode: scoreData.periode,
          action: "updated",
          scoreGlobal: scoreData.scoreGlobal,
        });
      } else {
        await db.scoreOperateur.create({
          data: {
            operateurId: operateur.id,
            periode: scoreData.periode,
            ...upsertData,
          },
        });
        results.push({
          periode: scoreData.periode,
          action: "created",
          scoreGlobal: scoreData.scoreGlobal,
        });
      }
    } catch (scoreError) {
      console.error(
        `Prestataire score upsert error for period ${scoreData.periode}:`,
        scoreError
      );
      errors.push({
        index: i,
        message: `Erreur pour la période ${scoreData.periode}: ${(scoreError as Error).message}`,
      });
    }
  }

  // ── Audit Log ──
  await logPrestataireAudit(
    "UPSERT",
    "scores",
    `total=${body.scores.length} processed=${results.length} errors=${errors.length} periods=${body.scores.map((s) => s.periode).join(",")}`,
    operatorCode,
    ipAddress,
    userAgent
  );

  // ── Response ──
  const status = results.length > 0 ? 201 : 400;

  return NextResponse.json(
    {
      message:
        results.length > 0
          ? `${results.length} score(s) traité(s) avec succès pour ${operateur.nom}`
          : "Aucun score valide à traiter",
      operatorCode,
      operator: operateur.nom,
      total: body.scores.length,
      processed: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    },
    {
      status,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    }
  );
}

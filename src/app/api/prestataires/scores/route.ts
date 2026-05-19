import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/prestataires/scores
// Accepts operator scores from external providers with API key auth
// Header: X-API-Key with pattern onit-{OPERATOR_CODE}-{anystring}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── API Key Validation ──

const API_KEY_REGEX = /^onit-([A-Z]+)-(.+)$/;

function validateApiKey(apiKey: string | null): {
  valid: boolean;
  operatorCode?: string;
  error?: string;
} {
  if (!apiKey) {
    return { valid: false, error: "X-API-Key header requis" };
  }

  const match = apiKey.match(API_KEY_REGEX);
  if (!match) {
    return {
      valid: false,
      error:
        "Format de clé API invalide. Format attendu: onit-{OPERATOR_CODE}-{anystring}",
    };
  }

  const operatorCode = match[1];
  return { valid: true, operatorCode };
}

// ── Zod Schemas ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

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

// ── Audit Logging ──

async function logPrestataireAudit(
  action: string,
  resource: string,
  details: string,
  operatorCode: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Find a system user for audit logging (prestataire calls are not tied to a user session)
  const adminUser = await db.user.findFirst({
    where: { email: "admin@arpt.gn" },
    select: { id: true },
  });

  if (adminUser) {
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: `PRESTATAIRE_${action}`,
        resource,
        details: `operatorCode=${operatorCode} | ${details}`,
        ipAddress,
        userAgent,
      },
    });
  }
}

// ── POST Handler ──

export async function POST(request: Request) {
  const apiKey = request.headers.get("X-API-Key");
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // ── Validate API Key ──
  const keyValidation = validateApiKey(apiKey);
  if (!keyValidation.valid) {
    return NextResponse.json(
      { error: keyValidation.error },
      { status: 401 }
    );
  }

  const operatorCode = keyValidation.operatorCode!;

  // ── Resolve Operator ──
  const operateur = await db.operateur.findFirst({
    where: { code: operatorCode.toUpperCase() },
  });

  if (!operateur) {
    await logPrestataireAudit(
      "REJECTED",
      "scores",
      `Opérateur inconnu: ${operatorCode}`,
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
    { status }
  );
}

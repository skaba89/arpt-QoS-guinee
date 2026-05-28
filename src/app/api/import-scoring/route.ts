import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit, checkPermission } from "@/lib/rbac";
import { resolveOperatorId, stripHtml, checkRateLimit } from "@/lib/utils-api";
import { z } from "zod";

// ── Zod validation schema for score rows ──
const scoreRowSchema = z.object({
  operateur: z.string().max(100).optional(),
  operateurId: z.string().max(50).optional(),
  periode: z.string()
    .min(1, "Période requise")
    .max(20)
    .regex(/^\d{4}-Q[1-4]$/, "Format période invalide (attendu: YYYY-Q1/Q2/Q3/Q4)")
    .transform(stripHtml),
  scoreGlobal: z.coerce.number().min(0, "Score minimum: 0").max(100, "Score maximum: 100"),
  scoreCouverture: z.coerce.number().min(0).max(100),
  scoreQoS: z.coerce.number().min(0).max(100),
  scoreQoE: z.coerce.number().min(0).max(100),
  scoreConformite: z.coerce.number().min(0).max(100),
  recommandation: z.string().max(2000).transform(stripHtml).optional(),
});

const scoresArraySchema = z.object({
  scores: z.array(scoreRowSchema).min(1, "Au moins un score requis").max(1000, "Maximum 1000 scores par import"),
});

// POST /api/import-scoring — Import operator scores with Zod validation
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`import-scoring-post:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    // Use centralized permission check instead of hardcoded allowedRoles
    const hasPermission = await checkPermission(userRole, "scoring", "admin") ||
      await checkPermission(userRole, "scoring", "export");
    if (!hasPermission) {
      return NextResponse.json({ error: "Permissions insuffisantes pour l'import de scores" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let rawRows: unknown[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
      }
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.scores && Array.isArray(data.scores)) {
        rawRows = data.scores;
      } else if (Array.isArray(data)) {
        rawRows = data;
      } else {
        return NextResponse.json({ error: "Format JSON invalide. Utilisez { scores: [...] }" }, { status: 400 });
      }
    } else {
      const body = await request.json();
      if (body.scores && Array.isArray(body.scores)) {
        rawRows = body.scores;
      } else if (Array.isArray(body)) {
        rawRows = body;
      } else {
        return NextResponse.json({ error: "Format invalide. Envoyez { scores: [...] }" }, { status: 400 });
      }
    }

    // ── Validate all rows with Zod ──
    const validatedRows: z.infer<typeof scoreRowSchema>[] = [];
    const validationErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const parsed = scoreRowSchema.safeParse(rawRows[i]);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        validationErrors.push({
          row: i + 1,
          message: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : "Données invalides",
        });
      } else {
        validatedRows.push(parsed.data);
      }
    }

    // If all rows failed validation, return early
    if (validatedRows.length === 0) {
      return NextResponse.json({
        success: false,
        total: rawRows.length,
        imported: 0,
        errors: validationErrors.length,
        errorDetails: validationErrors.slice(0, 20),
      }, { status: 400 });
    }

    // ── Process validated rows ──
    const results = {
      success: 0,
      errors: validationErrors.length, // Start with validation error count
      errorDetails: [...validationErrors] as { row: number; message: string }[],
    };

    for (let i = 0; i < validatedRows.length; i++) {
      try {
        const row = validatedRows[i];

        const operateurId = row.operateurId
          ? await resolveOperatorId(row.operateurId)
          : row.operateur
          ? await resolveOperatorId(row.operateur)
          : null;

        if (!operateurId) {
          results.errors++;
          results.errorDetails.push({ row: i + 1, message: `Opérateur non trouvé: "${row.operateurId || row.operateur}"` });
          continue;
        }

        // Upsert score (unique on operateurId + periode)
        await db.scoreOperateur.upsert({
          where: {
            operateurId_periode: {
              operateurId,
              periode: row.periode,
            },
          },
          update: {
            scoreGlobal: row.scoreGlobal,
            scoreCouverture: row.scoreCouverture,
            scoreQoS: row.scoreQoS,
            scoreQoE: row.scoreQoE,
            scoreConformite: row.scoreConformite,
            recommandation: row.recommandation || null,
          },
          create: {
            operateurId,
            periode: row.periode,
            scoreGlobal: row.scoreGlobal,
            scoreCouverture: row.scoreCouverture,
            scoreQoS: row.scoreQoS,
            scoreQoE: row.scoreQoE,
            scoreConformite: row.scoreConformite,
            recommandation: row.recommandation || null,
          },
        });

        results.success++;
      } catch (rowError) {
        results.errors++;
        results.errorDetails.push({
          row: i + 1,
          message: rowError instanceof Error ? rowError.message : "Erreur inconnue",
        });
      }
    }

    await logAudit(
      userId,
      "IMPORT",
      "scores",
      JSON.stringify({ total: rawRows.length, validated: validatedRows.length, success: results.success, errors: results.errors })
    );

    return NextResponse.json({
      success: true,
      format: "scoring",
      total: rawRows.length,
      validated: validatedRows.length,
      imported: results.success,
      errors: results.errors,
      errorDetails: results.errorDetails.slice(0, 20),
    });
  } catch (error) {
    console.error("Import scoring API error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'import des scores" }, { status: 500 });
  }
}

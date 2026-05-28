import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit, checkPermission } from "@/lib/rbac";
import { resolveOperatorId } from "@/lib/utils-api";

interface ScoreRow {
  operateur?: string;
  operateurId?: string;
  periode: string;
  scoreGlobal: number;
  scoreCouverture: number;
  scoreQoS: number;
  scoreQoE: number;
  scoreConformite: number;
  recommandation?: string;
}

// POST /api/import-scoring — Import operator scores
export async function POST(request: Request) {
  try {
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
    let rows: ScoreRow[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
      }
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.scores && Array.isArray(data.scores)) {
        rows = data.scores;
      } else if (Array.isArray(data)) {
        rows = data;
      } else {
        return NextResponse.json({ error: "Format JSON invalide. Utilisez { scores: [...] }" }, { status: 400 });
      }
    } else {
      const body = await request.json();
      if (body.scores && Array.isArray(body.scores)) {
        rows = body.scores;
      } else if (Array.isArray(body)) {
        rows = body;
      } else {
        return NextResponse.json({ error: "Format invalide. Envoyez { scores: [...] }" }, { status: 400 });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Aucun score à importer" }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: 0,
      errorDetails: [] as { row: number; message: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

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

        if (!row.periode) {
          results.errors++;
          results.errorDetails.push({ row: i + 1, message: "Période manquante" });
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
      JSON.stringify({ total: rows.length, success: results.success, errors: results.errors })
    );

    return NextResponse.json({
      success: true,
      format: "scoring",
      total: rows.length,
      imported: results.success,
      errors: results.errors,
      errorDetails: results.errorDetails.slice(0, 20),
    });
  } catch (error) {
    console.error("Import scoring API error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'import des scores" }, { status: 500 });
  }
}

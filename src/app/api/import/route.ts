import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/rbac";

// Helper to parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Helper to resolve operator code to ID
async function resolveOperatorId(codeOrId: string): Promise<string | null> {
  // Try as ID first
  const byId = await db.operateur.findUnique({ where: { id: codeOrId } });
  if (byId) return byId.id;
  // Try as code
  const byCode = await db.operateur.findUnique({ where: { code: codeOrId.toUpperCase() } });
  if (byCode) return byCode.id;
  // Try partial name match
  const byName = await db.operateur.findFirst({ where: { nom: { contains: codeOrId } } });
  return byName?.id || null;
}

// Helper to resolve region code to ID
async function resolveRegionId(codeOrId: string): Promise<string | null> {
  // Try as ID first
  const byId = await db.region.findUnique({ where: { id: codeOrId } });
  if (byId) return byId.id;
  // Try as code
  const byCode = await db.region.findUnique({ where: { code: codeOrId.toUpperCase() } });
  if (byCode) return byCode.id;
  // Try partial name match
  const byName = await db.region.findFirst({ where: { nom: { contains: codeOrId } } });
  return byName?.id || null;
}

// Helper to find or create a campaign
async function resolveCampaignId(campagneNom: string, operateurId: string, regionId: string): Promise<string> {
  // Try to find existing campaign
  const existing = await db.campagne.findFirst({
    where: { nom: campagneNom, operateurId, regionId },
  });
  if (existing) return existing.id;

  // Create a new campaign
  const newCampaign = await db.campagne.create({
    data: {
      nom: campagneNom,
      type: "QOS_INTERNET",
      operateurId,
      regionId,
      dateDebut: new Date(),
      statut: "EN_COURS",
    },
  });
  return newCampaign.id;
}

interface ImportRow {
  campagne?: string;
  campagneId?: string;
  operateur?: string;
  operateurId?: string;
  region?: string;
  regionId?: string;
  latitude: number | string;
  longitude: number | string;
  timestamp?: string;
  typeMesure?: string;
  rssi?: number | string | null;
  rsrp?: number | string | null;
  rsrq?: number | string | null;
  sinr?: number | string | null;
  debitDescendant?: number | string | null;
  debitMontant?: number | string | null;
  latence?: number | string | null;
  gigue?: number | string | null;
  tauxAppelReussi?: number | string | null;
  tauxDropCall?: number | string | null;
  debitDownload?: number | string | null;
  debitUpload?: number | string | null;
  ping?: number | string | null;
  dnsLookupTime?: number | string | null;
  tcpConnectTime?: number | string | null;
  scoreQoE?: number | string | null;
  pageLoadTime?: number | string | null;
  videoBuffering?: number | string | null;
}

function toFloat(val: number | string | null | undefined): number | null {
  if (val == null || val === "" || val === "-") return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : n;
}

// POST /api/import — Bulk import measurements from CSV or JSON
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const allowedRoles = ["SUPER_ADMIN", "DG", "DIRECTEUR_TECHNIQUE", "INGENIEUR_RF", "ANALYSTE_QOS"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Permissions insuffisantes pour l'import" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";

    let rows: ImportRow[] = [];
    let format = "unknown";

    if (contentType.includes("multipart/form-data")) {
      // File upload (CSV or JSON)
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const formatParam = formData.get("format") as string | null;

      if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
      }

      const text = await file.text();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv") || formatParam === "csv") {
        format = "csv";
        rows = parseCSV(text);
      } else if (fileName.endsWith(".json") || formatParam === "json") {
        format = "json";
        rows = parseJSON(text);
      } else {
        return NextResponse.json(
          { error: "Format non supporté. Utilisez .csv ou .json" },
          { status: 400 }
        );
      }
    } else {
      // JSON body with array of measurements
      const body = await request.json();
      if (Array.isArray(body)) {
        format = "json-array";
        rows = body;
      } else if (body.measurements && Array.isArray(body.measurements)) {
        format = "json-object";
        rows = body.measurements;
      } else if (body.data && Array.isArray(body.data)) {
        format = "json-data";
        rows = body.data;
      } else {
        return NextResponse.json(
          { error: "Format invalide. Envoyez un tableau de mesures ou un fichier CSV/JSON" },
          { status: 400 }
        );
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à importer" }, { status: 400 });
    }

    if (rows.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 mesures par import" }, { status: 400 });
    }

    // Process each row
    const results = {
      success: 0,
      errors: 0,
      errorDetails: [] as { row: number; message: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        // Resolve operator
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

        // Resolve region
        const regionId = row.regionId
          ? await resolveRegionId(row.regionId)
          : row.region
          ? await resolveRegionId(row.region)
          : null;

        if (!regionId) {
          results.errors++;
          results.errorDetails.push({ row: i + 1, message: `Région non trouvée: "${row.regionId || row.region}"` });
          continue;
        }

        // Resolve campaign
        let campagneId = row.campagneId;
        if (!campagneId && row.campagne) {
          campagneId = await resolveCampaignId(row.campagne, operateurId, regionId);
        }

        if (!campagneId) {
          // Create a default campaign
          campagneId = await resolveCampaignId(
            `Import ${new Date().toISOString().split("T")[0]}`,
            operateurId,
            regionId
          );
        }

        // Validate coordinates
        const lat = parseFloat(String(row.latitude));
        const lng = parseFloat(String(row.longitude));
        if (isNaN(lat) || isNaN(lng)) {
          results.errors++;
          results.errorDetails.push({ row: i + 1, message: "Coordonnées GPS invalides" });
          continue;
        }

        await db.mesureQoS.create({
          data: {
            campagneId,
            operateurId,
            regionId,
            latitude: lat,
            longitude: lng,
            timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
            typeMesure: row.typeMesure || "INTERNET",
            rssi: toFloat(row.rssi),
            rsrp: toFloat(row.rsrp),
            rsrq: toFloat(row.rsrq),
            sinr: toFloat(row.sinr),
            debitDescendant: toFloat(row.debitDescendant),
            debitMontant: toFloat(row.debitMontant),
            latence: toFloat(row.latence),
            gigue: toFloat(row.gigue),
            tauxAppelReussi: toFloat(row.tauxAppelReussi),
            tauxDropCall: toFloat(row.tauxDropCall),
            debitDownload: toFloat(row.debitDownload),
            debitUpload: toFloat(row.debitUpload),
            ping: toFloat(row.ping),
            dnsLookupTime: toFloat(row.dnsLookupTime),
            tcpConnectTime: toFloat(row.tcpConnectTime),
            scoreQoE: toFloat(row.scoreQoE),
            pageLoadTime: toFloat(row.pageLoadTime),
            videoBuffering: toFloat(row.videoBuffering),
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
      "measurements",
      JSON.stringify({ format, total: rows.length, success: results.success, errors: results.errors })
    );

    return NextResponse.json({
      success: true,
      format,
      total: rows.length,
      imported: results.success,
      errors: results.errors,
      errorDetails: results.errorDetails.slice(0, 20), // Limit error details
    });
  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'import" }, { status: 500 });
  }
}

// Parse CSV text into array of objects
function parseCSV(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/"/g, "").trim()
  );

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row as unknown as ImportRow);
  }

  return rows;
}

// Parse JSON text
function parseJSON(text: string): ImportRow[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data.measurements) return data.measurements;
  if (data.data) return data.data;
  if (data.mesures) return data.mesures;
  return [data];
}

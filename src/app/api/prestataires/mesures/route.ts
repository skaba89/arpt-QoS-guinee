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
// POST /api/prestataires/mesures
// Accepts QoS measurements from external providers with SECURE API key auth
// Header: X-API-Key with pattern onit-{OPERATOR_CODE}-{secret}
// Key is validated against stored hash in Operateur.cleApi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Zod Schemas ──

const mesureBaseSchema = z.object({
  regionId: z.string().max(50).transform(stripHtml).optional(),
  regionCode: z.string().max(20).transform(stripHtml).optional(),
  campagneId: z.string().max(50).transform(stripHtml).optional(),
  campagneNom: z.string().max(200).transform(stripHtml).optional(),
  // Required fields
  latitude: z.coerce
    .number()
    .min(-90, "Latitude min -90")
    .max(90, "Latitude max 90"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude min -180")
    .max(180, "Longitude max 180"),
  timestamp: z
    .string()
    .min(1, "Timestamp requis")
    .max(50)
    .transform(stripHtml),
  typeMesure: z
    .string()
    .min(1, "typeMesure requis")
    .max(50)
    .transform(stripHtml),
  // RF Metrics
  rssi: z.coerce.number().min(-150).max(-30).optional(),
  rsrp: z.coerce.number().min(-140).max(-44).optional(),
  rsrq: z.coerce.number().min(-20).max(-3).optional(),
  sinr: z.coerce.number().min(-20).max(30).optional(),
  // Network Metrics
  latence: z.coerce.number().min(0).max(5000).optional(),
  debitDescendant: z.coerce.number().min(0).max(100000).optional(),
  debitMontant: z.coerce.number().min(0).max(100000).optional(),
  gigue: z.coerce.number().min(0).max(5000).optional(),
  tauxAppelReussi: z.coerce.number().min(0).max(100).optional(),
  tauxDropCall: z.coerce.number().min(0).max(100).optional(),
  // Internet Metrics
  debitDownload: z.coerce.number().min(0).max(100000).optional(),
  debitUpload: z.coerce.number().min(0).max(100000).optional(),
  ping: z.coerce.number().min(0).max(5000).optional(),
  dnsLookupTime: z.coerce.number().min(0).max(5000).optional(),
  tcpConnectTime: z.coerce.number().min(0).max(5000).optional(),
  // QoE Metrics
  scoreQoE: z.coerce.number().min(0).max(100).optional(),
  pageLoadTime: z.coerce.number().min(0).max(60000).optional(),
  videoBuffering: z.coerce.number().min(0).max(60000).optional(),
});

const prestataireMesuresSchema = z.object({
  campagneNom: z
    .string()
    .min(1)
    .max(200)
    .transform(stripHtml)
    .optional(),
  mesures: z
    .array(mesureBaseSchema)
    .min(1, "Au moins une mesure requise")
    .max(5000, "Maximum 5 000 mesures par appel prestataire"),
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
  const rateLimitKey = `prestataire-mesures:${ipAddress}`;
  const rateLimit = checkRateLimit(rateLimitKey, 30, 60000); // 30 requests per minute
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

  // ── Resolve Operator (already resolved by validateApiKeySecure) ──
  const operateur = await db.operateur.findFirst({
    where: { id: operateurId },
  });

  if (!operateur) {
    await logPrestataireAudit(
      "REJECTED",
      "mesures",
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

  const parsed = prestataireMesuresSchema.safeParse(rawBody);
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

  // ── Process Measurements ──
  const mesuresData: Record<string, unknown>[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < body.mesures.length; i++) {
    const m = body.mesures[i];

    // Resolve region
    let regionId = m.regionId;
    if (!regionId && m.regionCode) {
      const reg = await db.region.findFirst({
        where: { code: m.regionCode.toUpperCase() },
      });
      if (reg) regionId = reg.id;
    }
    if (!regionId) {
      errors.push({
        index: i,
        message: `Région non trouvée: ${m.regionCode || m.regionId || "manquante"}`,
      });
      continue;
    }

    // Resolve campaign — use provided campagneNom or body-level campagneNom
    const campNom = m.campagneNom || body.campagneNom;
    let campagneId = m.campagneId;

    if (!campagneId && campNom) {
      let camp = await db.campagne.findFirst({
        where: { nom: campNom, operateurId: operateur.id },
      });

      if (!camp) {
        camp = await db.campagne.create({
          data: {
            nom: campNom,
            type: "QOS_MOBILE",
            operateurId: operateur.id,
            regionId: regionId,
            dateDebut: new Date(m.timestamp),
            statut: "EN_COURS",
            responsable: `Prestataire API (${operatorCode})`,
          },
        });
      }
      campagneId = camp.id;
    }

    if (!campagneId) {
      errors.push({
        index: i,
        message: "campagneId ou campagneNom requis",
      });
      continue;
    }

    mesuresData.push({
      operateurId: operateur.id,
      regionId,
      campagneId,
      latitude: m.latitude,
      longitude: m.longitude,
      timestamp: new Date(m.timestamp),
      typeMesure: m.typeMesure,
      rssi: m.rssi,
      rsrp: m.rsrp,
      rsrq: m.rsrq,
      sinr: m.sinr,
      latence: m.latence,
      debitDescendant: m.debitDescendant,
      debitMontant: m.debitMontant,
      gigue: m.gigue,
      tauxAppelReussi: m.tauxAppelReussi,
      tauxDropCall: m.tauxDropCall,
      debitDownload: m.debitDownload,
      debitUpload: m.debitUpload,
      ping: m.ping,
      dnsLookupTime: m.dnsLookupTime,
      tcpConnectTime: m.tcpConnectTime,
      scoreQoE: m.scoreQoE,
      pageLoadTime: m.pageLoadTime,
      videoBuffering: m.videoBuffering,
    });
  }

  // ── Batch Insert ──
  let inserted = 0;
  const CHUNK_SIZE = 100;

  for (let i = 0; i < mesuresData.length; i += CHUNK_SIZE) {
    const chunk = mesuresData.slice(i, i + CHUNK_SIZE);
    try {
      const result = await db.mesureQoS.createMany({
        data: chunk as any,
      });
      inserted += result.count;
    } catch (chunkError) {
      console.error("Prestataire bulk insert chunk error:", chunkError);
      errors.push({
        index: -1,
        message: `Erreur d'insertion chunk ${i}-${i + chunk.length}`,
      });
    }
  }

  // ── Audit Log ──
  await logPrestataireAudit(
    "CREATE",
    "mesures",
    `total=${body.mesures.length} inserted=${inserted} errors=${errors.length} campagneNom=${body.campagneNom || "N/A"}`,
    operatorCode,
    ipAddress,
    userAgent
  );

  // ── Response ──
  const status = inserted > 0 ? 201 : 400;

  return NextResponse.json(
    {
      message:
        inserted > 0
          ? `${inserted} mesures importées avec succès pour ${operateur.nom}`
          : "Aucune mesure valide à insérer",
      operatorCode,
      operator: operateur.nom,
      total: body.mesures.length,
      inserted,
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

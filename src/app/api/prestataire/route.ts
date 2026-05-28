import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKeySecure, stripHtml, checkRateLimit } from "@/lib/utils-api";

// Safe audit logging for prestataire API (handles non-existent userId)
async function safeAuditLog(action: string, resource: string, details?: string, resourceId?: string) {
  try {
    // Find the admin user for audit logging (prestataire API doesn't have a real user)
    const adminUser = await db.user.findFirst({ where: { email: 'admin@arpt.gn' } });
    if (adminUser) {
      await db.auditLog.create({
        data: {
          userId: adminUser.id,
          action: `[PRESTATAIRE-API] ${action}`,
          resource,
          resourceId,
          details,
          ipAddress: 'prestataire-api',
          userAgent: 'ONIT-PNG-Prestataire-API/1.0',
        },
      });
    }
  } catch {
    // Silently ignore audit log failures — never crash the API
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Prestataire — Endpoint pour les opérateurs/prestataires
// pour remonter leurs données QoS dans l'application
//
// Authentification via clé API (header: X-API-Key)
// Routes:
//   POST /api/prestataire/mesures     — Créer des mesures QoS (unitaire ou batch)
//   POST /api/prestataire/scores      — Soumettre un score opérateur
//   POST /api/prestataire/alertes     — Signaler une alerte
//   GET  /api/prestataire/status      — Vérifier le statut de la connexion
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// SECURITY FIX: API keys are now validated against hashed values in the database
// via validateApiKeySecure() — no more hardcoded keys in source code.
// Operators must have a cleApi hash stored in the Operateur table.

async function validateApiKey(request: Request): Promise<{ operateurCode: string; operateurId: string } | null> {
  const apiKey = request.headers.get("X-API-Key");
  const result = await validateApiKeySecure(apiKey);
  if (!result.valid) return null;
  return { operateurCode: result.operatorCode!, operateurId: result.operatorId! };
}

// Helper to parse number or return undefined
const pf = (val: unknown): number | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseFloat(String(val));
  return isNaN(n) ? undefined : n;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/prestataire/status — Vérifier la connexion API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`prestataire-get:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
  }

  const prestataire = await validateApiKey(request);
  if (!prestataire) {
    return NextResponse.json({ error: "Clé API invalide. Utilisez le header X-API-Key" }, { status: 401 });
  }

  const operateur = await db.operateur.findFirst({
    where: { code: prestataire.operateurCode },
  });

  if (!operateur) {
    return NextResponse.json({ error: "Opérateur non trouvé" }, { status: 404 });
  }

  // Return operator stats
  const [mesureCount, campagneCount, scoreCount] = await Promise.all([
    db.mesureQoS.count({ where: { operateurId: operateur.id } }),
    db.campagne.count({ where: { operateurId: operateur.id } }),
    db.scoreOperateur.count({ where: { operateurId: operateur.id } }),
  ]);

  return NextResponse.json({
    status: "OK",
    operateur: {
      id: operateur.id,
      nom: operateur.nom,
      code: operateur.code,
    },
    stats: {
      mesures: mesureCount,
      campagnes: campagneCount,
      scores: scoreCount,
    },
    timestamp: new Date().toISOString(),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/prestataire — Route principale
// Body: { action: "mesures"|"scores"|"alertes", ...data }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`prestataire-post:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
  }

  const prestataire = await validateApiKey(request);
  if (!prestataire) {
    return NextResponse.json({ error: "Clé API invalide. Utilisez le header X-API-Key" }, { status: 401 });
  }

  const operateur = await db.operateur.findFirst({
    where: { code: prestataire.operateurCode },
  });
  if (!operateur) {
    return NextResponse.json({ error: "Opérateur non trouvé" }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("text/csv") || contentType.includes("application/octet-stream")) {
      // CSV format — treat as mesures import
      return await handleCSVMesures(request, operateur);
    } else {
      return NextResponse.json({ error: "Content-Type non supporté — utilisez application/json ou text/csv" }, { status: 400 });
    }

    const action = body.action as string;
    if (!action) {
      return NextResponse.json({ error: "Le champ 'action' est requis. Valeurs: mesures, scores, alertes" }, { status: 400 });
    }

    switch (action) {
      case "mesures":
        return await handleMesures(body, operateur);
      case "scores":
        return await handleScores(body, operateur);
      case "alertes":
        return await handleAlertes(body, operateur);
      default:
        return NextResponse.json({ error: `Action inconnue: ${action}. Valeurs: mesures, scores, alertes` }, { status: 400 });
    }
  } catch (error) {
    console.error("Prestataire API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handler: Mesures QoS (unitaire ou batch)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleMesures(body: Record<string, unknown>, operateur: { id: string; code: string; nom: string }) {
  // Single mesure
  if (body.mesure) {
    const m = body.mesure as Record<string, unknown>;
    if (!m.latitude || !m.longitude || !m.timestamp || !m.typeMesure) {
      return NextResponse.json({ error: "Champs requis manquants: latitude, longitude, timestamp, typeMesure" }, { status: 400 });
    }

    // Resolve region
    let regionId = m.regionId as string | undefined;
    if (!regionId && m.regionCode) {
      const reg = await db.region.findFirst({ where: { code: (m.regionCode as string).toUpperCase() } });
      if (reg) regionId = reg.id;
    }
    if (!regionId) {
      return NextResponse.json({ error: "regionId ou regionCode requis" }, { status: 400 });
    }

    // Resolve or create campaign
    let campagneId = m.campagneId as string | undefined;
    if (!campagneId && m.campagneNom) {
      const camp = await db.campagne.findFirst({ where: { nom: m.campagneNom as string } });
      if (camp) campagneId = camp.id;
    }
    // Auto-create campaign if not found
    if (!campagneId) {
      const autoName = `Auto-Prestataire ${operateur.nom} - ${new Date().toISOString().split('T')[0]}`;
      let camp = await db.campagne.findFirst({ where: { nom: autoName } });
      if (!camp) {
        camp = await db.campagne.create({
          data: {
            nom: autoName,
            type: (m.typeMesure as string) === "INTERNET" ? "QOS_INTERNET" : "DRIVE_TEST",
            operateurId: operateur.id,
            regionId,
            dateDebut: new Date(),
            statut: "EN_COURS",
            responsable: `API Prestataire - ${operateur.nom}`,
          },
        });
      }
      campagneId = camp.id;
    }

    const mesure = await db.mesureQoS.create({
      data: {
        operateurId: operateur.id,
        regionId,
        campagneId,
        latitude: parseFloat(m.latitude as string),
        longitude: parseFloat(m.longitude as string),
        timestamp: new Date(m.timestamp as string),
        typeMesure: m.typeMesure as string,
        rssi: pf(m.rssi), rsrp: pf(m.rsrp), rsrq: pf(m.rsrq), sinr: pf(m.sinr),
        latence: pf(m.latence), debitDescendant: pf(m.debitDescendant), debitMontant: pf(m.debitMontant),
        gigue: pf(m.gigue), tauxAppelReussi: pf(m.tauxAppelReussi), tauxDropCall: pf(m.tauxDropCall),
        debitDownload: pf(m.debitDownload), debitUpload: pf(m.debitUpload), ping: pf(m.ping),
        dnsLookupTime: pf(m.dnsLookupTime), tcpConnectTime: pf(m.tcpConnectTime),
        scoreQoE: pf(m.scoreQoE), pageLoadTime: pf(m.pageLoadTime), videoBuffering: pf(m.videoBuffering),
      },
    });

    await safeAuditLog("CREATE", "mesure", JSON.stringify({ operateur: operateur.code, via: "prestataire-api" }), mesure.id);

    return NextResponse.json({ success: true, mesure: { id: mesure.id } }, { status: 201 });
  }

  // Batch mesures
  if (body.mesures && Array.isArray(body.mesures)) {
    const mesures = body.mesures as Record<string, unknown>[];
    if (mesures.length === 0) {
      return NextResponse.json({ error: "Le tableau mesures est vide" }, { status: 400 });
    }
    if (mesures.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 mesures par requête" }, { status: 400 });
    }

    let campagneId = body.campagneId as string | undefined;
    let inserted = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const m of mesures) {
      try {
        if (!m.latitude || !m.longitude || !m.timestamp || !m.typeMesure) {
          errors++;
          errorDetails.push(`Mesure ignorée: champs requis manquants`);
          continue;
        }

        let regionId = m.regionId as string | undefined;
        if (!regionId && m.regionCode) {
          const reg = await db.region.findFirst({ where: { code: (m.regionCode as string).toUpperCase() } });
          if (reg) regionId = reg.id;
        }
        if (!regionId) {
          errors++;
          errorDetails.push(`Mesure ignorée: région non trouvée pour ${m.regionCode}`);
          continue;
        }

        // Resolve campaign
        let mCampagneId = campagneId;
        if (!mCampagneId && m.campagneId) mCampagneId = m.campagneId as string;
        if (!mCampagneId && body.campagneNom) {
          const camp = await db.campagne.findFirst({ where: { nom: body.campagneNom as string } });
          if (camp) mCampagneId = camp.id;
        }
        if (!mCampagneId) {
          const autoName = `Auto-Prestataire ${operateur.nom} - ${new Date().toISOString().split('T')[0]}`;
          let camp = await db.campagne.findFirst({ where: { nom: autoName } });
          if (!camp) {
            camp = await db.campagne.create({
              data: {
                nom: autoName,
                type: (m.typeMesure as string) === "INTERNET" ? "QOS_INTERNET" : "DRIVE_TEST",
                operateurId: operateur.id,
                regionId,
                dateDebut: new Date(),
                statut: "EN_COURS",
                responsable: `API Prestataire - ${operateur.nom}`,
              },
            });
          }
          mCampagneId = camp.id;
        }

        await db.mesureQoS.create({
          data: {
            operateurId: operateur.id,
            regionId,
            campagneId: mCampagneId,
            latitude: parseFloat(m.latitude as string),
            longitude: parseFloat(m.longitude as string),
            timestamp: new Date(m.timestamp as string),
            typeMesure: m.typeMesure as string,
            rssi: pf(m.rssi), rsrp: pf(m.rsrp), rsrq: pf(m.rsrq), sinr: pf(m.sinr),
            latence: pf(m.latence), debitDescendant: pf(m.debitDescendant), debitMontant: pf(m.debitMontant),
            gigue: pf(m.gigue), tauxAppelReussi: pf(m.tauxAppelReussi), tauxDropCall: pf(m.tauxDropCall),
            debitDownload: pf(m.debitDownload), debitUpload: pf(m.debitUpload), ping: pf(m.ping),
            dnsLookupTime: pf(m.dnsLookupTime), tcpConnectTime: pf(m.tcpConnectTime),
            scoreQoE: pf(m.scoreQoE), pageLoadTime: pf(m.pageLoadTime), videoBuffering: pf(m.videoBuffering),
          },
        });
        inserted++;
      } catch (err) {
        errors++;
        errorDetails.push(`Erreur: ${(err as Error).message}`);
      }
    }

    await safeAuditLog("CREATE", "mesures_batch",
      JSON.stringify({ operateur: operateur.code, total: mesures.length, inserted, errors }), campagneId);

    return NextResponse.json({
      success: true,
      message: `${inserted} mesures importées`,
      total: mesures.length,
      inserted,
      errors,
      ...(errorDetails.length > 0 ? { errorDetails: errorDetails.slice(0, 20) } : {}),
    }, { status: 201 });
  }

  return NextResponse.json({ error: "Format invalide. Envoyez { mesure: {...} } ou { mesures: [...] }" }, { status: 400 });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handler: Scores opérateur
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleScores(body: Record<string, unknown>, operateur: { id: string; code: string; nom: string }) {
  if (!body.periode) {
    return NextResponse.json({ error: "Le champ 'periode' est requis (ex: 2026-Q1)" }, { status: 400 });
  }

  const validateScore = (val: unknown, name: string): number => {
    if (val === undefined || val === null) return 0;
    const n = parseFloat(String(val));
    if (isNaN(n) || n < 0 || n > 100) throw new Error(`${name} doit être entre 0 et 100`);
    return n;
  };

  try {
    const scoreGlobal = validateScore(body.scoreGlobal, "scoreGlobal");
    const scoreCouverture = validateScore(body.scoreCouverture, "scoreCouverture");
    const scoreQoS = validateScore(body.scoreQoS, "scoreQoS");
    const scoreQoE = validateScore(body.scoreQoE, "scoreQoE");
    const scoreConformite = validateScore(body.scoreConformite, "scoreConformite");

    const score = await db.scoreOperateur.upsert({
      where: {
        operateurId_periode: {
          operateurId: operateur.id,
          periode: body.periode as string,
        },
      },
      create: {
        operateurId: operateur.id,
        periode: body.periode as string,
        scoreGlobal,
        scoreCouverture,
        scoreQoS,
        scoreQoE,
        scoreConformite,
        recommandation: (body.recommandation as string) || "",
      },
      update: {
        scoreGlobal,
        scoreCouverture,
        scoreQoS,
        scoreQoE,
        scoreConformite,
        recommandation: (body.recommandation as string) || "",
      },
    });

    await safeAuditLog("UPSERT", "score",
      JSON.stringify({ operateur: operateur.code, periode: body.periode, scoreGlobal }), score.id);

    return NextResponse.json({
      success: true,
      score: {
        id: score.id,
        operateurCode: operateur.code,
        periode: score.periode,
        scoreGlobal: score.scoreGlobal,
      },
    }, { status: 201 });
  } catch (validationError) {
    return NextResponse.json({ error: (validationError as Error).message }, { status: 400 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handler: Alertes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleAlertes(body: Record<string, unknown>, operateur: { id: string; code: string; nom: string }) {
  if (!body.message) {
    return NextResponse.json({ error: "Le champ 'message' est requis" }, { status: 400 });
  }

  const alertData: {
    type: string;
    severity: string;
    message: string;
    details?: string;
    operateurId: string;
    regionId?: string;
  } = {
    type: stripHtml((body.type as string) || "DEGRADATION"),
    severity: stripHtml((body.severity as string) || "MOYENNE"),
    message: stripHtml(body.message as string),
    operateurId: operateur.id,
  };

  if (body.details) alertData.details = stripHtml(body.details as string);

  if (body.regionCode) {
    const reg = await db.region.findFirst({ where: { code: (body.regionCode as string).toUpperCase() } });
    if (reg) alertData.regionId = reg.id;
  } else if (body.regionId) {
    alertData.regionId = body.regionId as string;
  }

  const alert = await db.alerte.create({ data: alertData });

  await safeAuditLog("CREATE", "alert",
    JSON.stringify({ operateur: operateur.code, type: alertData.type, severity: alertData.severity }), alert.id);

  return NextResponse.json({
    success: true,
    alerte: {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
    },
  }, { status: 201 });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Handler: CSV Mesures Import
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function handleCSVMesures(request: Request, operateur: { id: string; code: string; nom: string }) {
  const csvText = await request.text();
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV vide ou format invalide" }, { status: 400 });
  }

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const csvPf = (val: string | undefined): number | undefined => {
    if (!val || val === "" || val === "N/A" || val === "null") return undefined;
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };

  let inserted = 0;
  let errors = 0;

  // Auto-create campaign
  const autoName = `Auto-Prestataire CSV ${operateur.nom} - ${new Date().toISOString().split('T')[0]}`;
  let camp = await db.campagne.findFirst({ where: { nom: autoName } });
  if (!camp) {
    // Find first region as default
    const firstRegion = await db.region.findFirst();
    camp = await db.campagne.create({
      data: {
        nom: autoName,
        type: "DRIVE_TEST",
        operateurId: operateur.id,
        regionId: firstRegion!.id,
        dateDebut: new Date(),
        statut: "EN_COURS",
        responsable: `API Prestataire CSV - ${operateur.nom}`,
      },
    });
  }

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length !== headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });

      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (isNaN(lat) || isNaN(lng)) { errors++; continue; }

      let regionId: string | undefined;
      const regionCode = row.regioncode || row.region_code;
      if (regionCode) {
        const reg = await db.region.findFirst({ where: { code: regionCode.toUpperCase() } });
        if (reg) regionId = reg.id;
      }
      if (!regionId) {
        const firstRegion = await db.region.findFirst();
        if (firstRegion) regionId = firstRegion.id;
      }

      await db.mesureQoS.create({
        data: {
          operateurId: operateur.id,
          regionId: regionId!,
          campagneId: camp!.id,
          latitude: lat,
          longitude: lng,
          timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
          typeMesure: row.typemesure || row.type_mesure || row.type || "MOBILE",
          rssi: csvPf(row.rssi), rsrp: csvPf(row.rsrp), rsrq: csvPf(row.rsrq), sinr: csvPf(row.sinr),
          latence: csvPf(row.latence) || csvPf(row.latency),
          debitDescendant: csvPf(row.debitdescendant) || csvPf(row.download_throughput),
          debitMontant: csvPf(row.debitmontant) || csvPf(row.upload_throughput),
          gigue: csvPf(row.gigue) || csvPf(row.jitter),
          tauxAppelReussi: csvPf(row.tauxappelreussi) || csvPf(row.call_success_rate),
          tauxDropCall: csvPf(row.tauxdropcall) || csvPf(row.drop_call_rate),
          debitDownload: csvPf(row.debitdownload), debitUpload: csvPf(row.debitupload),
          ping: csvPf(row.ping), dnsLookupTime: csvPf(row.dnslookuptime) || csvPf(row.dns_lookup_time),
          tcpConnectTime: csvPf(row.tcpconnecttime) || csvPf(row.tcp_connect_time),
          scoreQoE: csvPf(row.scoreqoe) || csvPf(row.qoe_score),
          pageLoadTime: csvPf(row.pageloadtime) || csvPf(row.page_load_time),
          videoBuffering: csvPf(row.videobuffering) || csvPf(row.video_buffering),
        },
      });
      inserted++;
    } catch {
      errors++;
    }
  }

  await safeAuditLog("CREATE", "mesures_csv",
    JSON.stringify({ operateur: operateur.code, total: lines.length - 1, inserted, errors }), camp.id);

  return NextResponse.json({
    success: true,
    message: `${inserted} mesures importées via CSV`,
    total: lines.length - 1,
    inserted,
    errors,
  }, { status: 201 });
}

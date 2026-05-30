/**
 * ═══════════════════════════════════════════════════════════════════
 * ARPT-QoS-Guinée — OPTION 2 : Import par Opérateur via Clé API
 * ═══════════════════════════════════════════════════════════════════
 *
 * Chaque opérateur pousse ses propres données de mesures QoS
 * et ses scores trimestriels via son clé API dédiée.
 *
 * Endpoints:
 *   POST /api/prestataires/mesures  — Mesures QoS (max 5000/appel)
 *   POST /api/prestataires/scores   — Scores trimestriels (max 100/appel)
 *
 * Usage:
 *   npx tsx scripts/import-operateurs-api.ts                  # Tous les opérateurs
 *   npx tsx scripts/import-operateurs-api.ts --mesures         # Mesures QoS uniquement
 *   npx tsx scripts/import-operateurs-api.ts --scores          # Scores uniquement
 *   npx tsx scripts/import-operateurs-api.ts --orange          # Orange uniquement
 *   npx tsx scripts/import-operateurs-api.ts --mtn             # MTN uniquement
 *   npx tsx scripts/import-operateurs-api.ts --celcom          # Celcom uniquement
 *   npx tsx scripts/import-operateurs-api.ts --intercel        # Intercel uniquement
 *   npx tsx scripts/import-operateurs-api.ts --csv             # Générer aussi CSV
 *   npx tsx scripts/import-operateurs-api.ts --demo            # Mode demo (peu de données)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════════
// CLÉS API PAR OPÉRATEUR (format: onit-{CODE}-{secret})
// ═══════════════════════════════════════════════════════════════════
const API_KEYS: Record<string, string> = {
  ORANGE: "onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ",
  MTN: "onit-MTN-f3Hb7nKcP5dAqW1xY8uE",
  CELCOM: "onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH",
  INTERCEL: "onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ",
};

// ═══════════════════════════════════════════════════════════════════
// RÉGIONS DE GUINÉE (16 CNT)
// ═══════════════════════════════════════════════════════════════════
const REGIONS = [
  { code: "CON", nom: "Conakry", lat: 9.5092, lng: -13.7122, type: "urbain" },
  { code: "CYA", nom: "Coyah", lat: 9.7200, lng: -13.3800, type: "semi-urbain" },
  { code: "KIN", nom: "Kindia", lat: 10.0569, lng: -12.8605, type: "semi-urbain" },
  { code: "BKE", nom: "Boké", lat: 11.1852, lng: -14.2941, type: "semi-rural" },
  { code: "KDR", nom: "Koundara", lat: 12.3537, lng: -13.1823, type: "rural" },
  { code: "LBE", nom: "Labé", lat: 11.3170, lng: -12.2832, type: "semi-urbain" },
  { code: "MLI", nom: "Mali", lat: 12.0218, lng: -12.1222, type: "rural" },
  { code: "DLB", nom: "Dalaba", lat: 10.7000, lng: -12.2500, type: "rural" },
  { code: "MMU", nom: "Mamou", lat: 10.5167, lng: -12.0833, type: "semi-urbain" },
  { code: "FRN", nom: "Faranah", lat: 10.0333, lng: -10.7333, type: "semi-rural" },
  { code: "KDG", nom: "Kissidougou", lat: 9.2000, lng: -10.1000, type: "rural" },
  { code: "KKA", nom: "Kankan", lat: 10.3833, lng: -9.3000, type: "semi-urbain" },
  { code: "SGR", nom: "Siguiri", lat: 11.4000, lng: -9.1700, type: "semi-rural" },
  { code: "GKD", nom: "Guéckédou", lat: 8.5600, lng: -10.1300, type: "rural" },
  { code: "BLA", nom: "Beyla", lat: 8.8139, lng: -8.4073, type: "rural" },
  { code: "ZKR", nom: "N'Zérékoré", lat: 7.7500, lng: -8.8167, type: "semi-urbain" },
];

// ═══════════════════════════════════════════════════════════════════
// PROFILS OPÉRATEURS — Données réalistes pour la Guinée
// ═══════════════════════════════════════════════════════════════════
interface OperatorProfile {
  code: string;
  nom: string;
  couverture: number;
  rssiBase: number;
  rsrpBase: number;
  debitDescBase: number;
  debitDownBase: number;
  debitUpBase: number;
  latenceBase: number;
  tauxAppelBase: number;
  scoreQoEBase: number;
  degradationRurale: number;
  scores: {
    periodes: string[];
    global: number[];
    couverture: number[];
    qos: number[];
    qoe: number[];
    conformite: number[];
    recommandations: string[];
  };
}

const OPERATORS: Record<string, OperatorProfile> = {
  ORANGE: {
    code: "ORANGE",
    nom: "Orange Guinée",
    couverture: 0.88,
    rssiBase: -68,
    rsrpBase: -88,
    debitDescBase: 28,
    debitDownBase: 42,
    debitUpBase: 18,
    latenceBase: 32,
    tauxAppelBase: 97.5,
    scoreQoEBase: 82,
    degradationRurale: 0.65,
    scores: {
      periodes: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"],
      global: [72, 75, 79, 82, 84],
      couverture: [70, 73, 77, 80, 82],
      qos: [74, 78, 82, 85, 86],
      qoe: [73, 77, 81, 84, 85],
      conformite: [71, 74, 79, 82, 83],
      recommandations: [
        "Poursuivre la politique tarifaire compétitive",
        "Déployer la 5G à Conakry en 2026",
        "Étendre la couverture en zone rurale (Faranah, Kissidougou, Beyla)",
        "Maintenir les investissements en infrastructure 4G+",
        "Consolider la position de leader par l'innovation",
      ],
    },
  },
  MTN: {
    code: "MTN",
    nom: "MTN Guinée",
    couverture: 0.75,
    rssiBase: -74,
    rsrpBase: -95,
    debitDescBase: 20,
    debitDownBase: 30,
    debitUpBase: 12,
    latenceBase: 42,
    tauxAppelBase: 95.0,
    scoreQoEBase: 74,
    degradationRurale: 0.55,
    scores: {
      periodes: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"],
      global: [62, 65, 68, 72, 74],
      couverture: [58, 62, 66, 70, 72],
      qos: [65, 69, 73, 76, 78],
      qoe: [63, 67, 71, 74, 76],
      conformite: [61, 65, 68, 71, 73],
      recommandations: [
        "Renforcer la redondance du réseau à Conakry",
        "Accélérer le déploiement 4G en zone semi-urbaine",
        "Investir dans le backhaul fibre vers Labé et Kankan",
        "Améliorer la couverture en région forestière",
        "Plan de modernisation du backhaul national",
      ],
    },
  },
  CELCOM: {
    code: "CELCOM",
    nom: "Celcom Guinée",
    couverture: 0.55,
    rssiBase: -82,
    rsrpBase: -102,
    debitDescBase: 12,
    debitDownBase: 18,
    debitUpBase: 6,
    latenceBase: 65,
    tauxAppelBase: 90.0,
    scoreQoEBase: 58,
    degradationRurale: 0.35,
    scores: {
      periodes: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"],
      global: [42, 45, 48, 55, 57],
      couverture: [38, 42, 45, 50, 52],
      qos: [48, 52, 56, 60, 62],
      qoe: [44, 48, 52, 57, 58],
      conformite: [40, 44, 48, 52, 54],
      recommandations: [
        "Présenter un plan d'investissement crédible à l'ARPT sous 30 jours",
        "Résorber les zones blanches à Labé, Dalaba et Faranah",
        "Moderniser le réseau 3G vers 4G dans les 6 prochains mois",
        "Plan de déploiement URGENT en zone rurale",
        "Renforcer le plan CAPEX pour atteindre les seuils réglementaires",
      ],
    },
  },
  INTERCEL: {
    code: "INTERCEL",
    nom: "Intercel Guinée",
    couverture: 0.32,
    rssiBase: -90,
    rsrpBase: -110,
    debitDescBase: 4,
    debitDownBase: 6,
    debitUpBase: 2,
    latenceBase: 110,
    tauxAppelBase: 82.0,
    scoreQoEBase: 42,
    degradationRurale: 0.15,
    scores: {
      periodes: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"],
      global: [28, 30, 33, 38, 40],
      couverture: [22, 25, 28, 32, 34],
      qos: [35, 38, 42, 46, 48],
      qoe: [32, 35, 38, 41, 43],
      conformite: [27, 30, 33, 37, 39],
      recommandations: [
        "Plan de redressement à soumettre à l'ARPT — délai 60 jours",
        "Remplacement des équipements obsolètes (2G vers minimum 3G)",
        "Extension géographique PRIORITAIRE — 85% du territoire non couvert",
        "MISE EN DEMEURE : Restructuration complète du réseau requise",
        "Risque de retrait de licence si le plan n'est pas soumis",
      ],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(v: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(v * factor) / factor;
}

function randomPoint(centerLat: number, centerLng: number, radiusKm: number) {
  const radiusDeg = radiusKm / 111;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDeg;
  return {
    lat: clamp(centerLat + Math.cos(angle) * distance, 4, 15),
    lng: clamp(centerLng + Math.sin(angle) * distance, -17, -7),
  };
}

// ═══════════════════════════════════════════════════════════════════
// GÉNÉRATION DE MESURES QoS — Format prestataire API
// ═══════════════════════════════════════════════════════════════════

function generatePrestataireMesures(
  op: OperatorProfile,
  region: typeof REGIONS[0],
  periode: string,
  count: number
) {
  const isUrbain = region.type === "urbain";
  const isSemiUrbain = region.type === "semi-urbain";
  const zoneFactor = isUrbain ? 1.0 : isSemiUrbain ? 0.8 : op.degradationRurale;

  const year = parseInt(periode.split("-")[0]);
  const quarter = parseInt(periode.split("-")[1].replace("Q", ""));
  const startMonth = (quarter - 1) * 3;

  const mesures: any[] = [];

  for (let i = 0; i < count; i++) {
    const point = randomPoint(region.lat, region.lng, isUrbain ? 15 : isSemiUrbain ? 30 : 50);
    const isCovered = Math.random() < op.couverture * zoneFactor;
    const typeMesure = Math.random() > 0.4 ? "MOBILE" : "INTERNET";

    const month = startMonth + randInt(0, 2);
    const day = randInt(1, 28);
    const hour = randInt(6, 22);
    const minute = randInt(0, 59);
    const ts = new Date(year, month, day, hour, minute);

    if (!isCovered) {
      // Zone blanche
      mesures.push({
        regionCode: region.code,
        latitude: roundTo(point.lat, 6),
        longitude: roundTo(point.lng, 6),
        timestamp: ts.toISOString(),
        typeMesure,
        rssi: roundTo(clamp(op.rssiBase + rand(-20, -5), -150, -30), 1),
        rsrp: roundTo(clamp(op.rsrpBase + rand(-20, -5), -140, -44), 1),
        rsrq: roundTo(clamp(-15 + rand(-5, 0), -20, -3), 1),
        sinr: roundTo(clamp(rand(-10, 0), -20, 30), 1),
        latence: roundTo(clamp(op.latenceBase * 3 + rand(0, 500), 0, 5000), 1),
        gigue: roundTo(clamp(rand(20, 100), 0, 5000), 1),
        tauxAppelReussi: roundTo(clamp(rand(0, 40), 0, 100), 1),
        tauxDropCall: roundTo(clamp(rand(30, 80), 0, 100), 1),
        scoreQoE: roundTo(clamp(rand(0, 20), 0, 100), 0),
        pageLoadTime: roundTo(clamp(rand(10, 60), 0, 60000), 2),
        videoBuffering: roundTo(clamp(rand(5, 30), 0, 60000), 2),
      });
    } else {
      const qualityVar = rand(0.8, 1.2) * zoneFactor;
      const isMobile = typeMesure === "MOBILE";

      mesures.push({
        regionCode: region.code,
        latitude: roundTo(point.lat, 6),
        longitude: roundTo(point.lng, 6),
        timestamp: ts.toISOString(),
        typeMesure,
        rssi: roundTo(clamp(op.rssiBase * qualityVar + rand(-10, 5), -150, -30), 1),
        rsrp: roundTo(clamp(op.rsrpBase * qualityVar + rand(-10, 5), -140, -44), 1),
        rsrq: roundTo(clamp(-10 + rand(-5, 3), -20, -3), 1),
        sinr: roundTo(clamp(8 * qualityVar + rand(-5, 10), -20, 30), 1),
        debitDescendant: isMobile ? roundTo(clamp(op.debitDescBase * qualityVar + rand(-5, 10), 0, 100000), 1) : undefined,
        debitMontant: isMobile ? roundTo(clamp(op.debitDescBase * 0.4 * qualityVar + rand(-2, 5), 0, 100000), 1) : undefined,
        latence: roundTo(clamp(op.latenceBase / qualityVar + rand(-10, 20), 0, 5000), 1),
        gigue: roundTo(clamp(rand(2, 15), 0, 5000), 1),
        tauxAppelReussi: isMobile ? roundTo(clamp(op.tauxAppelBase * qualityVar + rand(-3, 2), 0, 100), 1) : undefined,
        tauxDropCall: isMobile ? roundTo(clamp(100 - op.tauxAppelBase * qualityVar + rand(-2, 5), 0, 100), 1) : undefined,
        debitDownload: !isMobile ? roundTo(clamp(op.debitDownBase * qualityVar + rand(-5, 15), 0, 100000), 1) : undefined,
        debitUpload: !isMobile ? roundTo(clamp(op.debitUpBase * qualityVar + rand(-2, 5), 0, 100000), 1) : undefined,
        ping: !isMobile ? roundTo(clamp(op.latenceBase / qualityVar + rand(-5, 15), 0, 5000), 1) : undefined,
        dnsLookupTime: !isMobile ? roundTo(clamp(rand(10, 60) / qualityVar, 0, 5000), 1) : undefined,
        tcpConnectTime: !isMobile ? roundTo(clamp(rand(30, 120) / qualityVar, 0, 5000), 1) : undefined,
        scoreQoE: roundTo(clamp(op.scoreQoEBase * qualityVar + rand(-10, 10), 0, 100), 0),
        pageLoadTime: roundTo(clamp(rand(1, 5) / qualityVar, 0, 60000), 2),
        videoBuffering: roundTo(clamp(rand(0, 3) / qualityVar, 0, 60000), 2),
      });
    }
  }

  return mesures;
}

// ═══════════════════════════════════════════════════════════════════
// ENVOI VIA API PRESTATAIRE
// ═══════════════════════════════════════════════════════════════════

async function sendMesuresToApi(
  apiKey: string,
  operatorName: string,
  campagneNom: string,
  mesures: any[]
): Promise<{ inserted: number; errors: number }> {
  try {
    const res = await fetch(`${BASE_URL}/api/prestataires/mesures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        campagneNom,
        mesures,
      }),
    });

    const data = await res.json();

    if (res.status === 201 && data.inserted > 0) {
      return { inserted: data.inserted, errors: data.errors?.length || 0 };
    } else if (res.status === 401) {
      console.error(`    ❌ Clé API invalide pour ${operatorName}`);
      return { inserted: 0, errors: mesures.length };
    } else {
      console.error(`    ❌ Erreur ${res.status}: ${data.error || "Inconnue"}`);
      if (data.details) console.error(`       Détails:`, JSON.stringify(data.details).substring(0, 200));
      if (data.errors) {
        data.errors.slice(0, 3).forEach((e: any) => console.error(`       - Mesure ${e.index}: ${e.message}`));
      }
      return { inserted: data.inserted || 0, errors: data.errors?.length || mesures.length };
    }
  } catch (err: any) {
    console.error(`    ❌ Erreur réseau: ${err.message}`);
    return { inserted: 0, errors: mesures.length };
  }
}

async function sendScoresToApi(
  apiKey: string,
  operatorName: string,
  scores: any[]
): Promise<{ processed: number; errors: number }> {
  try {
    const res = await fetch(`${BASE_URL}/api/prestataires/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ scores }),
    });

    const data = await res.json();

    if (res.status === 201 && data.processed > 0) {
      return { processed: data.processed, errors: data.errors?.length || 0 };
    } else if (res.status === 401) {
      console.error(`    ❌ Clé API invalide pour ${operatorName}`);
      return { processed: 0, errors: scores.length };
    } else {
      console.error(`    ❌ Erreur ${res.status}: ${data.error || "Inconnue"}`);
      return { processed: data.processed || 0, errors: scores.length };
    }
  } catch (err: any) {
    console.error(`    ❌ Erreur réseau: ${err.message}`);
    return { processed: 0, errors: scores.length };
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT DES MESURES PAR OPÉRATEUR
// ═══════════════════════════════════════════════════════════════════

async function importMesures(operatorCodes?: string[], demo = false): Promise<void> {
  console.log("\n📊 Envoi des mesures QoS par opérateur via API...");
  console.log("   Endpoint: POST /api/prestataires/mesures");
  console.log("   Auth: X-API-Key (onit-{CODE}-{secret})\n");

  const periodes = demo ? ["2026-Q1"] : ["2025-Q3", "2025-Q4", "2026-Q1"];
  const codes = operatorCodes || Object.keys(OPERATORS);
  let totalInserted = 0;
  let totalErrors = 0;

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) {
      console.log(`  ⚠️ Opérateur ${code} non trouvé`);
      continue;
    }

    const apiKey = API_KEYS[code];
    if (!apiKey) {
      console.log(`  ⚠️ Clé API non trouvée pour ${code}`);
      continue;
    }

    console.log(`\n  📡 ${op.nom} — Envoi des mesures...`);
    console.log(`     Clé API: ${apiKey.substring(0, 20)}...`);

    for (const periode of periodes) {
      console.log(`    Période ${periode}:`);

      // Build batch of measurements per region
      let batch: any[] = [];

      for (const region of REGIONS) {
        const count = demo
          ? 3
          : region.type === "urbain"
          ? 25
          : region.type === "semi-urbain"
          ? 18
          : region.type === "semi-rural"
          ? 12
          : 8;

        const mesures = generatePrestataireMesures(op, region, periode, count);
        batch.push(...mesures);

        // Send batch when approaching limit (max 5000 per API call)
        if (batch.length >= 4500) {
          const campagneNom = `Drive Test ${op.nom} ${periode}`;
          const result = await sendMesuresToApi(apiKey, op.nom, campagneNom, batch);
          totalInserted += result.inserted;
          totalErrors += result.errors;
          console.log(`      ✅ ${result.inserted} mesures importées (batch)`);
          batch = [];
        }
      }

      // Send remaining batch
      if (batch.length > 0) {
        const campagneNom = `Drive Test ${op.nom} ${periode}`;
        const result = await sendMesuresToApi(apiKey, op.nom, campagneNom, batch);
        totalInserted += result.inserted;
        totalErrors += result.errors;
        console.log(`      ✅ ${result.inserted} mesures importées`);
      }
    }

    console.log(`  ✅ ${op.nom} — terminé`);
  }

  console.log(`\n  📈 Total mesures insérées: ${totalInserted}`);
  console.log(`  📈 Total erreurs: ${totalErrors}`);
}

// ═══════════════════════════════════════════════════════════════════
// IMPORT DES SCORES PAR OPÉRATEUR
// ═══════════════════════════════════════════════════════════════════

async function importScores(operatorCodes?: string[]): Promise<void> {
  console.log("\n🏆 Envoi des scores opérateurs via API...");
  console.log("   Endpoint: POST /api/prestataires/scores");
  console.log("   Auth: X-API-Key (onit-{CODE}-{secret})\n");

  const codes = operatorCodes || Object.keys(OPERATORS);
  let totalProcessed = 0;
  let totalErrors = 0;

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    const apiKey = API_KEYS[code];
    if (!apiKey) continue;

    console.log(`  📡 ${op.nom}...`);

    // Construction des scores — l'opérateur est automatiquement
    // déterminé par la clé API (pas besoin de le spécifier)
    const scores = op.scores.periodes.map((periode, idx) => ({
      periode,
      scoreGlobal: op.scores.global[idx],
      scoreCouverture: op.scores.couverture[idx],
      scoreQoS: op.scores.qos[idx],
      scoreQoE: op.scores.qoe[idx],
      scoreConformite: op.scores.conformite[idx],
      recommandation: op.scores.recommandations[idx] || "",
    }));

    const result = await sendScoresToApi(apiKey, op.nom, scores);
    totalProcessed += result.processed;
    totalErrors += result.errors;

    if (result.processed > 0) {
      console.log(`    ✅ ${result.processed} scores traités`);
      for (const s of scores) {
        console.log(`    ${s.periode}: Global=${s.scoreGlobal} | Couverture=${s.scoreCouverture} | QoS=${s.scoreQoS} | QoE=${s.scoreQoE} | Conformité=${s.scoreConformite}`);
      }
    }
  }

  console.log(`\n  📈 Total scores traités: ${totalProcessed}`);
  console.log(`  📈 Total erreurs: ${totalErrors}`);
}

// ═══════════════════════════════════════════════════════════════════
// GÉNÉRATION DES CSV MODÈLES
// ═══════════════════════════════════════════════════════════════════

async function generateCSVTemplates(operatorCodes?: string[]): Promise<void> {
  console.log("\n📄 Génération des fichiers CSV modèles (pour les opérateurs)...");

  const fs = await import("fs");
  const path = await import("path");
  const codes = operatorCodes || Object.keys(OPERATORS);

  const outputDir = path.join(process.cwd(), "data-templates");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    // ─── CSV Mesures (format prestataire) ───
    const headers = [
      "regionCode", "latitude", "longitude", "typeMesure", "timestamp",
      "rssi", "rsrp", "rsrq", "sinr",
      "debitDescendant", "debitMontant", "latence", "gigue",
      "tauxAppelReussi", "tauxDropCall",
      "debitDownload", "debitUpload", "ping", "dnsLookupTime", "tcpConnectTime",
      "scoreQoE", "pageLoadTime", "videoBuffering",
    ];

    const rows: string[] = [headers.join(",")];

    for (const region of REGIONS) {
      const count = region.type === "urbain" ? 10 : 5;
      const mesures = generatePrestataireMesures(op, region, "2026-Q1", count);
      for (const m of mesures) {
        const row = [
          m.regionCode,
          m.latitude, m.longitude,
          m.typeMesure, m.timestamp,
          m.rssi ?? "", m.rsrp ?? "", m.rsrq ?? "", m.sinr ?? "",
          m.debitDescendant ?? "", m.debitMontant ?? "",
          m.latence ?? "", m.gigue ?? "",
          m.tauxAppelReussi ?? "", m.tauxDropCall ?? "",
          m.debitDownload ?? "", m.debitUpload ?? "",
          m.ping ?? "", m.dnsLookupTime ?? "", m.tcpConnectTime ?? "",
          m.scoreQoE ?? "", m.pageLoadTime ?? "", m.videoBuffering ?? "",
        ];
        rows.push(row.join(","));
      }
    }

    const filePath = path.join(outputDir, `prestataire-${code.toLowerCase()}-2026-Q1.csv`);
    fs.writeFileSync(filePath, rows.join("\n"));
    console.log(`  ✅ ${filePath}`);

    // ─── JSON Scores modèle ───
    const scoresJson = {
      scores: op.scores.periodes.map((periode, idx) => ({
        periode,
        scoreGlobal: op.scores.global[idx],
        scoreCouverture: op.scores.couverture[idx],
        scoreQoS: op.scores.qos[idx],
        scoreQoE: op.scores.qoe[idx],
        scoreConformite: op.scores.conformite[idx],
        recommandation: op.scores.recommandations[idx] || "",
      })),
    };
    const scoresPath = path.join(outputDir, `scores-${code.toLowerCase()}.json`);
    fs.writeFileSync(scoresPath, JSON.stringify(scoresJson, null, 2));
    console.log(`  ✅ ${scoresPath}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// VÉRIFICATION DU SERVEUR
// ═══════════════════════════════════════════════════════════════════

async function checkServer(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`✅ Serveur accessible — ${data.timestamp}`);
  } catch {
    console.error(`❌ Serveur non accessible sur ${BASE_URL}`);
    console.error("   Démarrez le serveur avec: cd /home/z/my-project && npm run dev");
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST DE CONNEXITÉ API POUR CHAQUE OPÉRATEUR
// ═══════════════════════════════════════════════════════════════════

async function testApiKeys(operatorCodes?: string[]): Promise<void> {
  console.log("\n🔑 Test des clés API opérateurs...");

  const codes = operatorCodes || Object.keys(OPERATORS);

  for (const code of codes) {
    const apiKey = API_KEYS[code];
    if (!apiKey) continue;

    // Envoyer une mesure test
    const testMesure = {
      campagneNom: `Test Connectivité ${code}`,
      mesures: [{
        regionCode: "CON",
        latitude: 9.5092,
        longitude: -13.7122,
        timestamp: new Date().toISOString(),
        typeMesure: "MOBILE",
        rssi: -70,
        rsrp: -85,
        latence: 30,
        scoreQoE: 80,
      }],
    };

    try {
      const res = await fetch(`${BASE_URL}/api/prestataires/mesures`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(testMesure),
      });

      if (res.status === 201 || res.status === 200) {
        console.log(`  ✅ ${code}: Clé API valide — connectivité confirmée`);
      } else if (res.status === 401) {
        console.error(`  ❌ ${code}: Clé API invalide ou non configurée`);
      } else {
        const data = await res.json();
        console.warn(`  ⚠️ ${code}: HTTP ${res.status} — ${data.error || "Réponse inattendue"}`);
      }
    } catch (err: any) {
      console.error(`  ❌ ${code}: Erreur réseau — ${err.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  console.log("═══════════════════════════════════════════════════════");
  console.log("🇬🇳  OPTION 2 — Import par Opérateur (Clé API)");
  console.log("═══════════════════════════════════════════════════════");
  console.log("   Chaque opérateur pousse ses données avec sa clé");
  console.log("   POST /api/prestataires/mesures");
  console.log("   POST /api/prestataires/scores");
  console.log("═══════════════════════════════════════════════════════\n");

  // Vérifier le serveur
  await checkServer();

  // Déterminer les opérateurs à traiter
  let operatorCodes: string[] | undefined;
  for (const arg of args) {
    const upper = arg.toUpperCase();
    if (OPERATORS[upper]) {
      operatorCodes = operatorCodes || [];
      operatorCodes.push(upper);
    }
  }

  const doMesures = !args.includes("--scores") || args.includes("--mesures");
  const doScores = !args.includes("--mesures") || args.includes("--scores");
  const doCSV = args.includes("--csv");
  const doDemo = args.includes("--demo");

  try {
    // 1. Tester les clés API
    await testApiKeys(operatorCodes);

    // 2. Import des mesures
    if (doMesures) {
      await importMesures(operatorCodes, doDemo);
    }

    // 3. Import des scores
    if (doScores) {
      await importScores(operatorCodes);
    }

    // 4. Générer CSV modèles
    if (doCSV) {
      await generateCSVTemplates(operatorCodes);
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ Import par Opérateur terminé avec succès !");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n📋 Résumé des clés API opérateurs :");
    for (const [code, key] of Object.entries(API_KEYS)) {
      console.log(`   ${code}: ${key}`);
    }
    console.log("\n📊 Pour vérifier les indicateurs, connectez-vous à :");
    console.log(`   ${BASE_URL}`);
    console.log("   Email: admin@arpt.gn | Mot de passe: Admin@2026!");
    console.log("═══════════════════════════════════════════════════════");
  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);
    process.exit(1);
  }
}

main();

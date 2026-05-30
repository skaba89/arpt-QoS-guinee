/**
 * ═══════════════════════════════════════════════════════════════════
 * ARPT-QoS-Guinée — OPTION 1 : Import par l'ARPT (Session Admin)
 * ═══════════════════════════════════════════════════════════════════
 *
 * L'ARPT (organisme régulateur) importe les données collectées lors
 * des campagnes de mesures via l'interface d'administration.
 * Authentification par session NextAuth (email + mot de passe).
 *
 * Usage:
 *   npx tsx scripts/import-arpt-admin.ts                  # Import complet
 *   npx tsx scripts/import-arpt-admin.ts --mesures         # Mesures QoS uniquement
 *   npx tsx scripts/import-arpt-admin.ts --scores          # Scores uniquement
 *   npx tsx scripts/import-arpt-admin.ts --orange          # Orange uniquement
 *   npx tsx scripts/import-arpt-admin.ts --mtn             # MTN uniquement
 *   npx tsx scripts/import-arpt-admin.ts --celcom          # Celcom uniquement
 *   npx tsx scripts/import-arpt-admin.ts --intercel        # Intercel uniquement
 *   npx tsx scripts/import-arpt-admin.ts --csv             # Générer CSV + import
 *   npx tsx scripts/import-arpt-admin.ts --alertes         # Alertes uniquement
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ─── Identifiants ARPT ───
const ARPT_CREDENTIALS = {
  email: "admin@arpt.gn",
  password: "Admin@2026!",
};

// ─── Régions de Guinée (16 CNT) ───
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

// ─── Profils opérateurs (données réalistes Guinée) ───
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
        "Améliorer la couverture en région forestière (Guéckédou, Nzérékoré)",
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
        "Plan de déploiement URGENT en zone rurale — Koundara, Mali, Beyla sans couverture",
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
        "Risque de retrait de licence si le plan de redressement n'est pas soumis",
      ],
    },
  },
};

// ─── Utilitaires ───
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

// ─── Génération de mesures réalistes ───
function generateMesures(
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
        operateur: op.code,
        region: region.code,
        latitude: roundTo(point.lat, 6),
        longitude: roundTo(point.lng, 6),
        timestamp: ts.toISOString(),
        typeMesure,
        rssi: roundTo(clamp(op.rssiBase + rand(-20, -5), -130, -50), 1),
        rsrp: roundTo(clamp(op.rsrpBase + rand(-20, -5), -140, -60), 1),
        rsrq: roundTo(clamp(-15 + rand(-5, 0), -20, -3), 1),
        sinr: roundTo(clamp(rand(-10, 0), -20, 30), 1),
        debitDescendant: 0,
        debitMontant: 0,
        latence: roundTo(clamp(op.latenceBase * 3 + rand(0, 500), 0, 5000), 1),
        gigue: roundTo(clamp(rand(20, 100), 0, 5000), 1),
        tauxAppelReussi: roundTo(clamp(rand(0, 40), 0, 100), 1),
        tauxDropCall: roundTo(clamp(rand(30, 80), 0, 100), 1),
        debitDownload: roundTo(clamp(rand(0, 1), 0, 100000), 1),
        debitUpload: 0,
        ping: roundTo(clamp(op.latenceBase * 3 + rand(0, 500), 0, 5000), 1),
        dnsLookupTime: roundTo(clamp(rand(100, 500), 0, 5000), 1),
        tcpConnectTime: roundTo(clamp(rand(200, 800), 0, 5000), 1),
        scoreQoE: roundTo(clamp(rand(0, 20), 0, 100), 0),
        pageLoadTime: roundTo(clamp(rand(10, 60), 0, 60000), 2),
        videoBuffering: roundTo(clamp(rand(5, 30), 0, 60000), 2),
        campagne: `Drive Test ${region.nom} ${periode}`,
      });
    } else {
      const qualityVar = rand(0.8, 1.2) * zoneFactor;
      const isMobile = typeMesure === "MOBILE";

      mesures.push({
        operateur: op.code,
        region: region.code,
        latitude: roundTo(point.lat, 6),
        longitude: roundTo(point.lng, 6),
        timestamp: ts.toISOString(),
        typeMesure,
        rssi: roundTo(clamp(op.rssiBase * qualityVar + rand(-10, 5), -130, -30), 1),
        rsrp: roundTo(clamp(op.rsrpBase * qualityVar + rand(-10, 5), -140, -44), 1),
        rsrq: roundTo(clamp(-10 + rand(-5, 3), -20, -3), 1),
        sinr: roundTo(clamp(8 * qualityVar + rand(-5, 10), -20, 30), 1),
        debitDescendant: isMobile ? roundTo(clamp(op.debitDescBase * qualityVar + rand(-5, 10), 0, 100000), 1) : null,
        debitMontant: isMobile ? roundTo(clamp(op.debitDescBase * 0.4 * qualityVar + rand(-2, 5), 0, 100000), 1) : null,
        latence: roundTo(clamp(op.latenceBase / qualityVar + rand(-10, 20), 0, 5000), 1),
        gigue: roundTo(clamp(rand(2, 15), 0, 5000), 1),
        tauxAppelReussi: isMobile ? roundTo(clamp(op.tauxAppelBase * qualityVar + rand(-3, 2), 0, 100), 1) : null,
        tauxDropCall: isMobile ? roundTo(clamp(100 - op.tauxAppelBase * qualityVar + rand(-2, 5), 0, 100), 1) : null,
        debitDownload: !isMobile ? roundTo(clamp(op.debitDownBase * qualityVar + rand(-5, 15), 0, 100000), 1) : null,
        debitUpload: !isMobile ? roundTo(clamp(op.debitUpBase * qualityVar + rand(-2, 5), 0, 100000), 1) : null,
        ping: !isMobile ? roundTo(clamp(op.latenceBase / qualityVar + rand(-5, 15), 0, 5000), 1) : null,
        dnsLookupTime: !isMobile ? roundTo(clamp(rand(10, 60) / qualityVar, 0, 5000), 1) : null,
        tcpConnectTime: !isMobile ? roundTo(clamp(rand(30, 120) / qualityVar, 0, 5000), 1) : null,
        scoreQoE: roundTo(clamp(op.scoreQoEBase * qualityVar + rand(-10, 10), 0, 100), 0),
        pageLoadTime: roundTo(clamp(rand(1, 5) / qualityVar, 0, 60000), 2),
        videoBuffering: roundTo(clamp(rand(0, 3) / qualityVar, 0, 60000), 2),
        campagne: `Drive Test ${region.nom} ${periode}`,
      });
    }
  }

  return mesures;
}

// ─── Authentification ARPT (session NextAuth) ───
async function loginArpt(): Promise<string> {
  console.log("\n🔐 Authentification ARPT...");
  console.log(`   Email: ${ARPT_CREDENTIALS.email}`);

  // Step 1: Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // Extract CSRF cookie
  const csrfSetCookie = csrfRes.headers.get("set-cookie") || "";
  const csrfCookieMatch = csrfSetCookie.match(/next-auth\.csrf-token=[^;]+/);
  const csrfCookie = csrfCookieMatch ? csrfCookieMatch[0] : "";

  if (!csrfToken || !csrfCookie) {
    throw new Error("Impossible de récupérer le token CSRF");
  }

  // Step 2: Login with credentials + CSRF token
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      email: ARPT_CREDENTIALS.email,
      password: ARPT_CREDENTIALS.password,
      csrfToken,
      callbackUrl: `${BASE_URL}/`,
      json: "true",
    }),
    redirect: "manual",
  });

  // Step 3: Extract session token from response cookies
  const loginSetCookie = loginRes.headers.get("set-cookie") || "";
  const sessionMatch = loginSetCookie.match(/next-auth\.session-token=[^;]+/);
  const secureMatch = loginSetCookie.match(/__Secure-next-auth\.session-token=[^;]+/);
  const sessionCookie = sessionMatch ? sessionMatch[0] : secureMatch ? secureMatch[0] : "";

  if (!sessionCookie) {
    throw new Error("Cookie de session non reçu — vérifiez les identifiants");
  }

  // Step 4: Verify session
  const allCookies = `${csrfCookie}; ${sessionCookie}`;
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: allCookies },
  });
  const session = await sessionRes.json();

  if (session.user) {
    console.log(`   ✅ Authentification réussie — ${session.user.name} (${session.user.role})`);
  } else {
    throw new Error("Session non valide après authentification");
  }

  return allCookies;
}

// ─── Délai pour respecter le rate limiting (10 req/60s) ───
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Import des mesures via /api/import ───
async function importMesures(
  sessionCookie: string,
  operatorCodes?: string[]
): Promise<{ total: number; inserted: number; errors: number }> {
  console.log("\n📊 Import des mesures QoS via /api/import (Session ARPT)...");

  const periodes = ["2025-Q3", "2025-Q4", "2026-Q1"];
  const codes = operatorCodes || Object.keys(OPERATORS);
  let totalInserted = 0;
  let totalErrors = 0;
  let totalGenerated = 0;

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) {
      console.log(`  ⚠️ Opérateur ${code} non trouvé`);
      continue;
    }

    console.log(`\n  📡 ${op.nom} — Génération des mesures...`);

    for (const periode of periodes) {
      console.log(`    Période ${periode}...`);

      // Build batch of measurements (max 1000 per API call)
      let batch: any[] = [];

      for (const region of REGIONS) {
        const mesuresParRegion =
          region.type === "urbain" ? 25 :
          region.type === "semi-urbain" ? 18 :
          region.type === "semi-rural" ? 12 : 8;

        const mesures = generateMesures(op, region, periode, mesuresParRegion);
        batch.push(...mesures);
        totalGenerated += mesures.length;

        // Send batch when approaching limit
        if (batch.length >= 900) {
          const result = await sendMesuresBatch(sessionCookie, batch);
          totalInserted += result.inserted;
          totalErrors += result.errors;
          batch = [];
          // Respect rate limit: 10 req/60s → wait 7s between batches
          await sleep(7000);
        }
      }

      // Send remaining batch
      if (batch.length > 0) {
        const result = await sendMesuresBatch(sessionCookie, batch);
        totalInserted += result.inserted;
        totalErrors += result.errors;
      }
      // Wait between periods
      await sleep(7000);
    }
    console.log(`  ✅ ${op.nom} — mesures traitées`);
  }

  console.log(`\n  📈 Total mesures générées: ${totalGenerated}`);
  console.log(`  📈 Total mesures insérées: ${totalInserted}`);
  console.log(`  📈 Total erreurs: ${totalErrors}`);

  return { total: totalGenerated, inserted: totalInserted, errors: totalErrors };
}

async function sendMesuresBatch(
  sessionCookie: string,
  mesures: any[]
): Promise<{ inserted: number; errors: number }> {
  try {
    const res = await fetch(`${BASE_URL}/api/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ measurements: mesures }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      console.log(`      ✅ ${data.imported} importées, ${data.errors} erreurs`);
      return { inserted: data.imported || 0, errors: data.errors || 0 };
    } else {
      console.error(`      ❌ Erreur: ${data.error || res.status}`);
      return { inserted: 0, errors: mesures.length };
    }
  } catch (err: any) {
    console.error(`      ❌ Erreur réseau: ${err.message}`);
    return { inserted: 0, errors: mesures.length };
  }
}

// ─── Import des scores via /api/import-scoring ───
async function importScores(
  sessionCookie: string,
  operatorCodes?: string[]
): Promise<{ total: number; inserted: number; errors: number }> {
  console.log("\n🏆 Import des scores opérateurs via /api/import-scoring...");

  const codes = operatorCodes || Object.keys(OPERATORS);
  let totalInserted = 0;
  let totalErrors = 0;

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    console.log(`  📡 ${op.nom}...`);

    const scores = op.scores.periodes.map((periode, idx) => ({
      operateur: op.code,
      periode,
      scoreGlobal: op.scores.global[idx],
      scoreCouverture: op.scores.couverture[idx],
      scoreQoS: op.scores.qos[idx],
      scoreQoE: op.scores.qoe[idx],
      scoreConformite: op.scores.conformite[idx],
      recommandation: op.scores.recommandations[idx] || "",
    }));

    try {
      const res = await fetch(`${BASE_URL}/api/import-scoring`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ scores }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        totalInserted += data.imported || 0;
        totalErrors += data.errors || 0;
        console.log(`    ✅ ${data.imported} scores importés`);

        // Afficher le détail
        for (const s of scores) {
          console.log(`    ${s.periode}: Global=${s.scoreGlobal} | Couverture=${s.scoreCouverture} | QoS=${s.scoreQoS} | QoE=${s.scoreQoE} | Conformité=${s.scoreConformite}`);
        }
      } else {
        totalErrors += scores.length;
        console.error(`    ❌ Erreur: ${data.error || res.status}`);
        if (data.errorDetails) {
          data.errorDetails.forEach((e: any) => console.error(`       Ligne ${e.row}: ${e.message}`));
        }
      }
    } catch (err: any) {
      totalErrors += scores.length;
      console.error(`    ❌ Erreur réseau: ${err.message}`);
    }
  }

  return { total: codes.length * 5, inserted: totalInserted, errors: totalErrors };
}

// ─── Génération de fichiers CSV modèles ───
async function generateCSVTemplates(operatorCodes?: string[]): Promise<void> {
  console.log("\n📄 Génération des fichiers CSV modèles...");

  const fs = await import("fs");
  const path = await import("path");
  const codes = operatorCodes || Object.keys(OPERATORS);

  const outputDir = path.join(process.cwd(), "data-templates");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    // CSV Mesures
    const headers = [
      "operateur", "region", "latitude", "longitude", "typeMesure", "timestamp",
      "rssi", "rsrp", "rsrq", "sinr",
      "debitDescendant", "debitMontant", "latence", "gigue",
      "tauxAppelReussi", "tauxDropCall",
      "debitDownload", "debitUpload", "ping", "dnsLookupTime", "tcpConnectTime",
      "scoreQoE", "pageLoadTime", "videoBuffering",
      "campagne",
    ];

    const rows: string[] = [headers.join(",")];

    for (const region of REGIONS) {
      const count = region.type === "urbain" ? 10 : 5;
      const mesures = generateMesures(op, region, "2026-Q1", count);
      for (const m of mesures) {
        const row = [
          m.operateur, m.region,
          m.latitude, m.longitude,
          m.typeMesure, m.timestamp,
          m.rssi ?? "", m.rsrp ?? "", m.rsrq ?? "", m.sinr ?? "",
          m.debitDescendant ?? "", m.debitMontant ?? "",
          m.latence ?? "", m.gigue ?? "",
          m.tauxAppelReussi ?? "", m.tauxDropCall ?? "",
          m.debitDownload ?? "", m.debitUpload ?? "",
          m.ping ?? "", m.dnsLookupTime ?? "", m.tcpConnectTime ?? "",
          m.scoreQoE ?? "", m.pageLoadTime ?? "", m.videoBuffering ?? "",
          m.campagne ?? "",
        ];
        rows.push(row.join(","));
      }
    }

    const mesuresPath = path.join(outputDir, `mesures-${code.toLowerCase()}-2026-Q1.csv`);
    fs.writeFileSync(mesuresPath, rows.join("\n"));
    console.log(`  ✅ ${mesuresPath}`);

    // CSV Scores
    const scoreHeaders = "operateur,periode,scoreGlobal,scoreCouverture,scoreQoS,scoreQoE,scoreConformite,recommandation";
    const scoreRows: string[] = [scoreHeaders];
    for (let i = 0; i < op.scores.periodes.length; i++) {
      scoreRows.push([
        op.code,
        op.scores.periodes[i],
        op.scores.global[i],
        op.scores.couverture[i],
        op.scores.qos[i],
        op.scores.qoe[i],
        op.scores.conformite[i],
        `"${op.scores.recommandations[i]}"`,
      ].join(","));
    }
    const scoresPath = path.join(outputDir, `scores-${code.toLowerCase()}.csv`);
    fs.writeFileSync(scoresPath, scoreRows.join("\n"));
    console.log(`  ✅ ${scoresPath}`);
  }
}

// ─── Vérification du serveur ───
async function checkServer(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`✅ Serveur accessible sur ${BASE_URL}`);
  } catch {
    console.error(`❌ Serveur non accessible sur ${BASE_URL}`);
    console.error("   Démarrez le serveur avec: cd /home/z/my-project && npm run dev");
    process.exit(1);
  }
}

// ─── Vérification finale des données ───
async function verifyData(): Promise<void> {
  console.log("\n📊 Vérification des données via API...");

  // Vérifier via /api/health ou /api/dashboard
  try {
    const res = await fetch(`${BASE_URL}/api/prestataire`);
    if (res.ok) {
      const data = await res.json();
      console.log("  ✅ API prestataire fonctionnelle");
    }
  } catch {
    // Non critique
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📊 Pour vérifier les indicateurs, connectez-vous à :");
  console.log(`   ${BASE_URL}`);
  console.log("   Email: admin@arpt.gn");
  console.log("   Mot de passe: Admin@2026!");
  console.log("═══════════════════════════════════════════════════════");
}

// ═════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  console.log("═══════════════════════════════════════════════════════");
  console.log("🇬🇳  OPTION 1 — Import ARPT Admin (Session Auth)");
  console.log("═══════════════════════════════════════════════════════");

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
  const doAlertes = args.includes("--alertes");

  try {
    // 1. Authentification
    const sessionCookie = await loginArpt();

    // 2. Import des mesures
    if (doMesures) {
      await importMesures(sessionCookie, operatorCodes);
    }

    // 3. Import des scores
    if (doScores) {
      await importScores(sessionCookie, operatorCodes);
    }

    // 4. Générer les CSV modèles
    if (doCSV) {
      await generateCSVTemplates(operatorCodes);
    }

    // 5. Vérification
    await verifyData();

    console.log("\n✅ Import ARPT Admin terminé avec succès !");
  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);
    process.exit(1);
  }
}

main();

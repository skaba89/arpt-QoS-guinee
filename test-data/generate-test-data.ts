// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONIT-PNG — Script de génération des données de test réalistes
// 4 opérateurs × 4 périodes × 8 régions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import fs from 'fs';
import path from 'path';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OPERATORS = [
  { nom: 'Orange Guinée', code: 'ORANGE', apiKey: 'prest-orange-2026-ak1a2b3c4d' },
  { nom: 'MTN Guinée', code: 'MTN', apiKey: 'prest-mtn-2026-x9y8z7w6v5' },
  { nom: 'Celcom Guinée', code: 'CELCOM', apiKey: 'prest-celcom-2026-p1q2r3s4t5' },
  { nom: 'Guinée Telecom', code: 'GUINETEL', apiKey: 'prest-guinetel-2026-m6n7o8p9q0' },
];

const REGIONS = [
  { code: 'CON', nom: 'Conakry', centreLat: 9.5092, centreLng: -13.7122, factor: 1.0 },
  { code: 'KIN', nom: 'Kindia', centreLat: 10.0569, centreLng: -12.8605, factor: 1.1 },
  { code: 'BOK', nom: 'Boké', centreLat: 11.1852, centreLng: -14.2941, factor: 1.35 },
  { code: 'LAB', nom: 'Labé', centreLat: 11.3170, centreLng: -12.2832, factor: 1.25 },
  { code: 'MAM', nom: 'Mamou', centreLat: 10.5167, centreLng: -12.0833, factor: 1.15 },
  { code: 'FAR', nom: 'Faranah', centreLat: 10.0333, centreLng: -10.7333, factor: 1.45 },
  { code: 'KAN', nom: 'Kankan', centreLat: 10.3833, centreLng: -9.3000, factor: 1.3 },
  { code: 'NZE', nom: "N'Zérékoré", centreLat: 7.7500, centreLng: -8.8167, factor: 1.4 },
];

const PERIODES = ['2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1'];

// QoS baselines per operator — qualité décroissante
const QOS_BASE: Record<string, {
  latence: number; debit: number; tauxAppel: number; jitter: number;
  debitDown: number; debitUp: number; ping: number; rssi: number;
  rsrp: number; rsrq: number; sinr: number; scoreQoE: number;
}> = {
  ORANGE: { latence: 38, debit: 22, tauxAppel: 96, jitter: 6, debitDown: 24, debitUp: 12, ping: 35, rssi: -70, rsrp: -85, rsrq: -8, sinr: 15, scoreQoE: 79 },
  MTN: { latence: 45, debit: 18, tauxAppel: 93, jitter: 9, debitDown: 20, debitUp: 10, ping: 42, rssi: -75, rsrp: -90, rsrq: -10, sinr: 12, scoreQoE: 74 },
  CELCOM: { latence: 55, debit: 12, tauxAppel: 89, jitter: 14, debitDown: 14, debitUp: 7, ping: 52, rssi: -80, rsrp: -95, rsrq: -13, sinr: 8, scoreQoE: 64 },
  GUINETEL: { latence: 62, debit: 9, tauxAppel: 85, jitter: 18, debitDown: 10, debitUp: 5, ping: 60, rssi: -83, rsrp: -97, rsrq: -14, sinr: 6, scoreQoE: 57 },
};

// Scores par période — progression temporelle
const SCORE_DATA: Record<string, {
  base: number[]; couverture: number[]; qos: number[]; qoe: number[]; conformite: number[];
  recos: string[];
}> = {
  ORANGE: {
    base: [70, 73, 75, 78],
    couverture: [75, 78, 80, 82],
    qos: [68, 72, 74, 76],
    qoe: [72, 75, 77, 79],
    conformite: [78, 81, 83, 85],
    recos: ['Maintenir la qualité en zone urbaine', 'Étendre la 4G en zone rurale', 'Renforcer le backbone fibre'],
  },
  MTN: {
    base: [68, 71, 73, 74],
    couverture: [70, 73, 75, 76],
    qos: [66, 70, 71, 72],
    qoe: [69, 72, 73, 74],
    conformite: [72, 75, 77, 78],
    recos: ['Améliorer la latence dans la région de Boké', 'Renforcer l\'infrastructure backhaul', 'Investir dans les sites solaires'],
  },
  CELCOM: {
    base: [55, 59, 62, 65],
    couverture: [48, 52, 55, 58],
    qos: [52, 56, 59, 62],
    qoe: [54, 58, 61, 64],
    conformite: [62, 66, 68, 70],
    recos: ['Améliorer la couverture en zone rurale - objectif +15%', 'Investir dans l\'infrastructure 4G', 'Réduire les zones blanches prioritaires'],
  },
  GUINETEL: {
    base: [42, 46, 49, 52],
    couverture: [35, 39, 42, 45],
    qos: [40, 44, 47, 50],
    qoe: [41, 45, 48, 51],
    conformite: [50, 54, 56, 58],
    recos: ['Plan de déploiement urgent — couverture nationale insuffisante', 'Acquérir de nouvelles licences spectrales', 'Partage d\'infrastructure avec les opérateurs établis'],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fonctions utilitaires
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function round(val: number, decimals: number = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

function generateMesure(
  opCode: string,
  region: typeof REGIONS[0],
  periodeIdx: number,
  mesureIdx: number,
  rng: () => number,
): Record<string, unknown> {
  const base = QOS_BASE[opCode];
  const factor = region.factor;
  const isCovered = rng() < (1.0 / factor); // coverage probability inversely related to degradation factor

  if (isCovered) {
    return {
      latitude: round(region.centreLat + (rng() - 0.5) * 0.5, 4),
      longitude: round(region.centreLng + (rng() - 0.5) * 0.5, 4),
      timestamp: `2025-${String((periodeIdx * 3) + 1).padStart(2, '0')}-${String(1 + Math.floor(rng() * 27)).padStart(2, '0')}T${String(8 + Math.floor(rng() * 10)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}:00Z`,
      typeMesure: rng() > 0.5 ? 'MOBILE' : 'INTERNET',
      regionCode: region.code,
      rssi: round(base.rssi + (rng() - 0.5) * 20),
      rsrp: round(base.rsrp + (rng() - 0.5) * 10),
      rsrq: round(base.rsrq + (rng() - 0.5) * 4),
      sinr: round(base.sinr / factor + (rng() - 0.5) * 3),
      latence: round(base.latence * factor * (0.9 + rng() * 0.2)),
      debitDescendant: round(base.debit / factor * (0.85 + rng() * 0.3)),
      debitMontant: round(base.debit * 0.5 / factor * (0.85 + rng() * 0.3)),
      gigue: round(base.jitter * factor * (0.8 + rng() * 0.4)),
      tauxAppelReussi: Math.min(100, round(base.tauxAppel / (factor * 0.9 + rng() * 0.2))),
      tauxDropCall: round((100 - base.tauxAppel) * factor * (0.8 + rng() * 0.4)),
      debitDownload: round(base.debitDown / factor * (0.85 + rng() * 0.3)),
      debitUpload: round(base.debitUp / factor * (0.85 + rng() * 0.3)),
      ping: round(base.ping * factor * (0.9 + rng() * 0.2)),
      dnsLookupTime: round(15 * factor * (0.8 + rng() * 0.4)),
      tcpConnectTime: round(25 * factor * (0.8 + rng() * 0.4)),
      scoreQoE: Math.min(100, round(base.scoreQoE / factor * (0.9 + rng() * 0.2))),
      pageLoadTime: round(2.5 * factor * (0.8 + rng() * 0.4), 2),
      videoBuffering: round(0.5 * factor * (0.8 + rng() * 0.4), 2),
    };
  } else {
    // Dead zone
    const isCompleteDeadZone = rng() < 0.4;
    return {
      latitude: round(region.centreLat + (rng() - 0.5) * 0.5, 4),
      longitude: round(region.centreLng + (rng() - 0.5) * 0.5, 4),
      timestamp: `2025-${String((periodeIdx * 3) + 1).padStart(2, '0')}-${String(1 + Math.floor(rng() * 27)).padStart(2, '0')}T${String(8 + Math.floor(rng() * 10)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}:00Z`,
      typeMesure: rng() > 0.5 ? 'MOBILE' : 'INTERNET',
      regionCode: region.code,
      rssi: round(isCompleteDeadZone ? (-110 - rng() * 15) : (-101 - rng() * 8)),
      rsrp: round(-105 - rng() * 20),
      rsrq: round(-18 - rng() * 8),
      sinr: round(-5 - rng() * 10),
      latence: round(base.latence * factor * 2.5 + rng() * 50),
      debitDescendant: round(Math.max(0.1, base.debit / factor * 0.1 + rng() * 2)),
      debitMontant: round(Math.max(0.05, base.debit * 0.5 / factor * 0.1 + rng())),
      gigue: round(base.jitter * factor * 3 * (0.8 + rng() * 0.6)),
      tauxAppelReussi: round(Math.max(0, 30 + rng() * 40)),
      tauxDropCall: round(Math.min(100, (100 - base.tauxAppel) * factor * 3 + rng() * 20)),
      debitDownload: round(Math.max(0.1, base.debitDown / factor * 0.08 + rng() * 1.5)),
      debitUpload: round(Math.max(0.05, base.debitUp / factor * 0.08 + rng() * 0.5)),
      ping: round(base.ping * factor * 3 + rng() * 100),
      dnsLookupTime: round(40 + rng() * 60),
      tcpConnectTime: round(60 + rng() * 80),
      scoreQoE: round(Math.max(5, base.scoreQoE / factor * 0.15 + rng() * 8)),
      pageLoadTime: round(8 + rng() * 15, 2),
      videoBuffering: round(3 + rng() * 8, 2),
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Génération des fichiers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const outputDir = path.resolve(__dirname);

// 1. Generate per-operator per-period batch mesure files
console.log('📊 Génération des données de test...\n');

for (const op of OPERATORS) {
  for (let pi = 0; pi < PERIODES.length; pi++) {
    const periode = PERIODES[pi];
    const rng = seededRandom(op.code.charCodeAt(0) * 1000 + pi * 100);
    const mesures: Record<string, unknown>[] = [];
    const mesuresPerRegion = 10;

    for (const region of REGIONS) {
      for (let m = 0; m < mesuresPerRegion; m++) {
        mesures.push(generateMesure(op.code, region, pi, m, rng));
      }
    }

    // Campaign for this batch
    const campagne = {
      nom: `Campagne QoS ${periode} - ${op.nom}`,
      type: pi % 2 === 0 ? 'DRIVE_TEST' : 'QOS_MOBILE',
      operateurCode: op.code,
      dateDebut: `2025-${String(pi * 3 + 1).padStart(2, '0')}-01`,
      dateFin: `2025-${String(pi * 3 + 3).padStart(2, '0')}-28`,
      responsable: `Prestataire ${op.nom}`,
    };

    const batchFile = {
      campagne,
      mesures,
    };

    const filename = `mesures_${op.code.toLowerCase()}_${periode.replace('-', '_')}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(batchFile, null, 2));
    console.log(`  ✅ ${filename} — ${mesures.length} mesures`);
  }
}

// 2. Generate scores files per operator (all periods)
for (const op of OPERATORS) {
  const sd = SCORE_DATA[op.code];
  const scores = PERIODES.map((periode, qi) => ({
    action: 'scores',
    operateurCode: op.code,
    periode,
    scoreGlobal: sd.base[qi],
    scoreCouverture: sd.couverture[qi],
    scoreQoS: sd.qos[qi],
    scoreQoE: sd.qoe[qi],
    scoreConformite: sd.conformite[qi],
    recommandation: qi === PERIODES.length - 1 ? sd.recos[0] : null,
  }));

  const filename = `scores_${op.code.toLowerCase()}.json`;
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(scores, null, 2));
  console.log(`  ✅ ${filename} — ${scores.length} scores`);
}

// 3. Generate CSV test data (all operators, Q1 2026)
const csvHeaders = 'latitude,longitude,timestamp,typeMesure,regionCode,rssi,rsrp,rsrq,sinr,latence,debitDescendant,debitMontant,gigue,tauxAppelReussi,tauxDropCall,debitDownload,debitUpload,ping,dnsLookupTime,tcpConnectTime,scoreQoE,pageLoadTime,videoBuffering';

for (const op of OPERATORS) {
  const rng = seededRandom(op.code.charCodeAt(0) * 7777);
  const rows: string[] = [csvHeaders];

  for (const region of REGIONS) {
    for (let m = 0; m < 8; m++) {
      const mesure = generateMesure(op.code, region, 3, m, rng);
      rows.push([
        mesure.latitude, mesure.longitude, mesure.timestamp, mesure.typeMesure, mesure.regionCode,
        mesure.rssi, mesure.rsrp, mesure.rsrq, mesure.sinr, mesure.latence,
        mesure.debitDescendant, mesure.debitMontant, mesure.gigue, mesure.tauxAppelReussi,
        mesure.tauxDropCall, mesure.debitDownload, mesure.debitUpload, mesure.ping,
        mesure.dnsLookupTime, mesure.tcpConnectTime, mesure.scoreQoE, mesure.pageLoadTime,
        mesure.videoBuffering,
      ].join(','));
    }
  }

  const filename = `mesures_${op.code.toLowerCase()}_csv_2026_Q1.csv`;
  fs.writeFileSync(path.join(outputDir, filename), rows.join('\n'));
  console.log(`  ✅ ${filename} — ${rows.length - 1} lignes`);
}

// 4. Generate alert test files
const alertes: Record<string, unknown>[] = [
  { action: 'alertes', type: 'DEGRADATION', severity: 'CRITIQUE', operateurCode: 'CELCOM', regionCode: 'FAR', message: 'Dégradation critique QoS - Latence > 100ms dans la région de Faranah', details: '{"latence": 108, "seuil": 50}' },
  { action: 'alertes', type: 'SEUIL_DEPASSE', severity: 'HAUTE', operateurCode: 'MTN', regionCode: 'BOK', message: 'Chute débit mobile en zone rurale de Boké (-35%)', details: '{"debit": 8.2, "seuil": 15}' },
  { action: 'alertes', type: 'NON_CONFORMITE', severity: 'CRITIQUE', operateurCode: 'CELCOM', regionCode: 'NZE', message: "Taux d'appel réussi < 85% - Seuil réglementaire N'Zérékoré", details: '{"tauxAppel": 82.3, "seuil": 90}' },
  { action: 'alertes', type: 'DEGRADATION', severity: 'MOYENNE', operateurCode: 'ORANGE', regionCode: 'LAB', message: 'Couverture 4G en baisse dans la région de Labé', details: '{"couverture4G": 45, "precedent": 58}' },
  { action: 'alertes', type: 'ZONE_BLANCHE', severity: 'HAUTE', operateurCode: 'GUINETEL', regionCode: 'FAR', message: '23 nouvelles zones blanches identifiées dans la région de Faranah', details: '{"count": 23}' },
  { action: 'alertes', type: 'DEGRADATION', severity: 'BASSE', operateurCode: 'MTN', regionCode: 'CON', message: 'Maintenance planifiée MTN Conakry - 22h00-04h00', details: '{"maintenance": true}' },
  { action: 'alertes', type: 'SEUIL_DEPASSE', severity: 'HAUTE', operateurCode: 'GUINETEL', regionCode: 'KAN', message: 'Jitter > 20ms dans la région de Kankan — réseau instable', details: '{"jitter": 22, "seuil": 10}' },
  { action: 'alertes', type: 'ZONE_BLANCHE', severity: 'CRITIQUE', operateurCode: 'GUINETEL', regionCode: 'NZE', message: "Couverture quasi inexistante N'Zérékoré sud — urgence déploiement", details: '{"count": 42, "population_affectee": 350000}' },
];

fs.writeFileSync(path.join(outputDir, 'alertes_test.json'), JSON.stringify(alertes, null, 2));
console.log('  ✅ alertes_test.json — 8 alertes');

// 5. Generate curl command examples
const curlExamples = `#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Commandes curl de test pour l'API Prestataire
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE_URL="http://localhost:3000"

echo "━━━ 1. Vérifier le statut de l'API ━━━"
curl -s -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 2. Envoyer une mesure unique (Orange) ━━━"
curl -s -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "mesures",
    "mesure": {
      "latitude": 9.5092,
      "longitude": -13.7122,
      "timestamp": "2026-05-15T10:30:00Z",
      "typeMesure": "MOBILE",
      "regionCode": "CON",
      "rssi": -72,
      "rsrp": -88,
      "rsrq": -9,
      "sinr": 14,
      "latence": 40,
      "debitDescendant": 21,
      "debitMontant": 10,
      "gigue": 7,
      "tauxAppelReussi": 95,
      "tauxDropCall": 5,
      "debitDownload": 23,
      "debitUpload": 11,
      "ping": 38,
      "dnsLookupTime": 18,
      "tcpConnectTime": 28,
      "scoreQoE": 78,
      "pageLoadTime": 2.8,
      "videoBuffering": 0.6
    }
  }' \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 3. Envoyer un batch de mesures (MTN) ━━━"
curl -s -X POST -H "X-API-Key: prest-mtn-2026-x9y8z7w6v5" \\
  -H "Content-Type: application/json" \\
  -d @test-data/mesures_mtn_2026_Q1.json \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 4. Envoyer un score opérateur (Celcom) ━━━"
curl -s -X POST -H "X-API-Key: prest-celcom-2026-p1q2r3s4t5" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "scores",
    "periode": "2026-Q1",
    "scoreGlobal": 65,
    "scoreCouverture": 58,
    "scoreQoS": 62,
    "scoreQoE": 64,
    "scoreConformite": 70,
    "recommandation": "Améliorer la couverture en zone rurale"
  }' \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 5. Signaler une alerte (Guinée Telecom) ━━━"
curl -s -X POST -H "X-API-Key: prest-guinetel-2026-m6n7o8p9q0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "alertes",
    "type": "DEGRADATION",
    "severity": "CRITIQUE",
    "regionCode": "FAR",
    "message": "Couverture dégradée dans la région de Faranah - RSSI < -100 dBm sur 40% des sites",
    "details": "{\\\"rssi_moyen\\\": -102, \\\"sites_affectes\\\": 12}"
  }' \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 6. Importer un fichier CSV (Orange) ━━━"
curl -s -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \\
  -H "Content-Type: text/csv" \\
  --data-binary @test-data/mesures_orange_csv_2026_Q1.csv \\
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 7. Connexion admin pour tester l'API interne ━━━"
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email=admin@arpt.gn&password=Admin@2026!" \\
  -c - | grep -oP 'next-auth.session-token=\\K[^;]+' | head -1)

echo "Token: $TOKEN"

echo ""
echo "━━━ 8. Lister les campagnes (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \\
  "$BASE_URL/api/campaigns" | jq .

echo ""
echo "━━━ 9. Lister les mesures (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \\
  "$BASE_URL/api/mesures?limit=10" | jq .

echo ""
echo "━━━ 10. Lister les scores (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \\
  "$BASE_URL/api/scores" | jq .

echo ""
echo "━━━ 11. Dashboard KPIs ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \\
  "$BASE_URL/api/dashboard" | jq .

echo ""
echo "━━━ 12. Données carte SIG ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \\
  "$BASE_URL/api/map" | jq .
`;

fs.writeFileSync(path.join(outputDir, 'test_api_curl.sh'), curlExamples);
console.log('  ✅ test_api_curl.sh — Commandes curl de test');

// 6. Generate batch import script (all data in sequence)
const batchScript = `#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Script d'injection complète des données de test
# Injecte les données pour les 4 opérateurs sur 4 périodes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

BASE_URL="\${1:-http://localhost:3000}"

echo "🚀 Injection des données de test sur $BASE_URL"
echo ""

# ─── Phase 1: Scores opérateurs ───
echo "📊 Phase 1: Injection des scores opérateurs..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  SCORES_FILE="test-data/scores_\${op}.json"
  if [ -f "$SCORES_FILE" ]; then
    # Send each score individually
    cat "$SCORES_FILE" | jq -c '.[]' | while read -r score; do
      RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \\
        -H "Content-Type: application/json" \\
        -d "$score" \\
        "$BASE_URL/api/prestataire")
      echo "  Score: $(echo $RESULT | jq -r '.score.periode // .error' 2>/dev/null)"
    done
  fi
done
echo ""

# ─── Phase 2: Mesures QoS ───
echo "📡 Phase 2: Injection des mesures QoS..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  for periode in 2025_Q2 2025_Q3 2025_Q4 2026_Q1; do
    MES_FILE="test-data/mesures_\${op}_\${periode}.json"
    if [ -f "$MES_FILE" ]; then
      # Wrap in action + mesures format for the API
      WRAPPED=$(jq '{action: "mesures", campagne: .campagne, mesures: .mesures}' "$MES_FILE")
      RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \\
        -H "Content-Type: application/json" \\
        -d "$WRAPPED" \\
        "$BASE_URL/api/prestataire")
      INSERTED=$(echo $RESULT | jq -r '.inserted // 0' 2>/dev/null)
      echo "  \${op} \${periode}: \${INSERTED} mesures insérées"
    fi
  done
done
echo ""

# ─── Phase 3: Alertes ───
echo "🚨 Phase 3: Injection des alertes..."
if [ -f "test-data/alertes_test.json" ]; then
  cat "test-data/alertes_test.json" | jq -c '.[]' | while read -r alert; do
    OP_CODE=$(echo $alert | jq -r '.operateurCode' 2>/dev/null)
    API_KEY=""
    case $OP_CODE in
      ORANGE)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
      MTN)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
      CELCOM)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
      GUINETEL) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
      *)        API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    esac
    
    RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \\
      -H "Content-Type: application/json" \\
      -d "$alert" \\
      "$BASE_URL/api/prestataire")
    echo "  Alerte: $(echo $RESULT | jq -r '.alerte.type // .error' 2>/dev/null)"
  done
fi
echo ""

# ─── Phase 4: Vérification ───
echo "✅ Phase 4: Vérification du statut..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  STATUS=$(curl -s -H "X-API-Key: $API_KEY" "$BASE_URL/api/prestataire")
  echo "  \${op}: $(echo $STATUS | jq -c '{mesures: .stats.mesures, campagnes: .stats.campagnes, scores: .stats.scores}' 2>/dev/null)"
done

echo ""
echo "🎉 Injection terminée ! Accédez à $BASE_URL pour voir les données."
`;

fs.writeFileSync(path.join(outputDir, 'inject_all_test_data.sh'), batchScript);
console.log('  ✅ inject_all_test_data.sh — Script d\'injection complète');

console.log('\n✨ Génération terminée ! Tous les fichiers sont dans test-data/');

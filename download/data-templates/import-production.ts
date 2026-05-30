/**
 * ═══════════════════════════════════════════════════════════════════
 * ARPT-QoS-Guinée — Script d'alimentation production
 * Chaque opérateur fournit ses données via son clé API
 * ═══════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   npx tsx scripts/import-production.ts           # Import complet
 *   npx tsx scripts/import-production.ts --mesures  # Mesures QoS uniquement
 *   npx tsx scripts/import-production.ts --scores   # Scores uniquement
 *   npx tsx scripts/import-production.ts --orange   # Orange uniquement
 *   npx tsx scripts/import-production.ts --mtn      # MTN uniquement
 *   npx tsx scripts/import-production.ts --celcom   # Celcom uniquement
 *   npx tsx scripts/import-production.ts --intercel # Intercel uniquement
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════
// CONFIGURATION DES OPÉRATEURS
// ═══════════════════════════════════════════════════════

interface OperatorConfig {
  code: string;
  nom: string;
  type: string;
  licence: string;
  apiKey: string;
  // Profil de qualité réseau (réaliste pour la Guinée)
  profil: {
    couverture: number;      // % de points couverts (rssi > -100)
    rssiBase: number;        // dBm - signal de base
    rsrpBase: number;        // dBm
    debitDescBase: number;   // Mbps débit descendant mobile
    debitDownBase: number;   // Mbps débit download internet
    debitUpBase: number;     // Mbps débit upload internet
    latenceBase: number;     // ms
    tauxAppelBase: number;   // %
    scoreQoEBase: number;    // 0-100
    degradationRurale: number; // facteur de dégradation en zone rurale
    // Scores trimestriels
    scoreGlobal: number[];
    scoreCouverture: number[];
    scoreQoS: number[];
    scoreQoE: number[];
    scoreConformite: number[];
    recommandations: string[];
  };
}

const OPERATORS: Record<string, OperatorConfig> = {
  ORANGE: {
    code: "ORANGE",
    nom: "Orange Guinée",
    type: "GSM/UMTS/LTE/5G",
    licence: "LIC-ORANGE-2020",
    apiKey: "onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ",
    profil: {
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
      scoreGlobal: [72, 75, 79, 82],
      scoreCouverture: [70, 73, 77, 80],
      scoreQoS: [74, 78, 82, 85],
      scoreQoE: [73, 77, 81, 84],
      scoreConformite: [71, 74, 79, 82],
      recommandations: [
        "Poursuivre la politique tarifaire compétitive",
        "Déployer la 5G à Conakry en 2026",
        "Étendre la couverture en zone rurale (Faranah, Kissidougou, Beyla)",
        "Maintenir les investissements en infrastructure 4G+",
      ],
    },
  },
  MTN: {
    code: "MTN",
    nom: "MTN Guinée",
    type: "GSM/UMTS/LTE",
    licence: "LIC-MTN-2019",
    apiKey: "onit-MTN-f3Hb7nKcP5dAqW1xY8uE",
    profil: {
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
      scoreGlobal: [62, 65, 68, 72],
      scoreCouverture: [58, 62, 66, 70],
      scoreQoS: [65, 69, 73, 76],
      scoreQoE: [63, 67, 71, 74],
      scoreConformite: [61, 65, 68, 71],
      recommandations: [
        "Renforcer la redondance du réseau à Conakry",
        "Accélérer le déploiement 4G en zone semi-urbaine",
        "Investir dans le backhaul fibre vers Labé et Kankan",
        "Améliorer la couverture en région forestière (Guéckédou, Nzérékoré)",
      ],
    },
  },
  CELCOM: {
    code: "CELCOM",
    nom: "Celcom Guinée",
    type: "GSM/UMTS/LTE",
    licence: "LIC-CELCOM-2021",
    apiKey: "onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH",
    profil: {
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
      scoreGlobal: [42, 45, 48, 55],
      scoreCouverture: [38, 42, 45, 50],
      scoreQoS: [48, 52, 56, 60],
      scoreQoE: [44, 48, 52, 57],
      scoreConformite: [40, 44, 48, 52],
      recommandations: [
        "Présenter un plan d'investissement crédible à l'ARPT sous 30 jours",
        "Résorber les zones blanches à Labé, Dalaba et Faranah",
        "Moderniser le réseau 3G → 4G dans les 6 prochains mois",
        "Plan de déploiement URGENT en zone rurale — Koundara, Mali, Beyla sans couverture",
      ],
    },
  },
  INTERCEL: {
    code: "INTERCEL",
    nom: "Intercel Guinée",
    type: "GSM/UMTS",
    licence: "LIC-INTERCEL-2018",
    apiKey: "onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ",
    profil: {
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
      scoreGlobal: [28, 30, 33, 38],
      scoreCouverture: [22, 25, 28, 32],
      scoreQoS: [35, 38, 42, 46],
      scoreQoE: [32, 35, 38, 41],
      scoreConformite: [27, 30, 33, 37],
      recommandations: [
        "Plan de redressement à soumettre à l'ARPT — délai 60 jours",
        "Remplacement des équipements obsolètes (2G → minimum 3G)",
        "Extension géographique PRIORITAIRE — 85% du territoire non couvert",
        "MISE EN DEMEURE : Restructuration complète du réseau requise",
      ],
    },
  },
};

// ═══════════════════════════════════════════════════════
// RÉGIONS DE GUINÉE (8 régions administratives + préfectures)
// ═══════════════════════════════════════════════════════

const REGIONS_GUINEE = [
  { code: "CON", nom: "Conakry", population: 2057000, centreLat: 9.5079, centreLng: -13.7122, type: "urbain" },
  { code: "CYA", nom: "Coyah", population: 285000, centreLat: 10.0833, centreLng: -13.3833, type: "semi-urbain" },
  { code: "KIN", nom: "Kindia", population: 435000, centreLat: 10.0667, centreLng: -12.8667, type: "semi-urbain" },
  { code: "BKE", nom: "Boké", population: 320000, centreLat: 10.9333, centreLng: -14.3000, type: "semi-rural" },
  { code: "KDR", nom: "Koundara", population: 180000, centreLat: 12.1833, centreLng: -13.3000, type: "rural" },
  { code: "LBE", nom: "Labé", population: 380000, centreLat: 11.3167, centreLng: -12.2833, type: "semi-urbain" },
  { code: "MLI", nom: "Mali", population: 125000, centreLat: 12.0000, centreLng: -11.7500, type: "rural" },
  { code: "DLB", nom: "Dalaba", population: 135000, centreLat: 10.7000, centreLng: -12.2500, type: "rural" },
  { code: "MMU", nom: "Mamou", population: 305000, centreLat: 10.5167, centreLng: -12.0833, type: "semi-urbain" },
  { code: "FRN", nom: "Faranah", population: 280000, centreLat: 10.0333, centreLng: -10.7500, type: "semi-rural" },
  { code: "KKA", nom: "Kankan", population: 560000, centreLat: 10.3833, centreLng: -9.3000, type: "semi-urbain" },
  { code: "KDG", nom: "Kérouané", population: 155000, centreLat: 9.2500, centreLng: -9.0000, type: "rural" },
  { code: "SGR", nom: "Siguiri", population: 340000, centreLat: 11.4167, centreLng: -9.1667, type: "semi-rural" },
  { code: "GKD", nom: "Guéckédou", population: 195000, centreLat: 8.5667, centreLng: -10.1333, type: "rural" },
  { code: "BLA", nom: "Beyla", population: 145000, centreLat: 8.6833, centreLng: -8.6333, type: "rural" },
  { code: "ZKR", nom: "Nzérékoré", population: 485000, centreLat: 7.7500, centreLng: -8.8167, type: "semi-urbain" },
];

// ═══════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Génère un point GPS aléatoire autour d'un centre
function randomPoint(centerLat: number, centerLng: number, radiusKm: number): { lat: number; lng: number } {
  const radiusDeg = radiusKm / 111; // ~111km par degré
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDeg;
  return {
    lat: clamp(centerLat + Math.cos(angle) * distance, 4, 15),
    lng: clamp(centerLng + Math.sin(angle) * distance, -17, -7),
  };
}

// ═══════════════════════════════════════════════════════
// GÉNÉRATION DE MESURES QoS RÉALISTES
// ═══════════════════════════════════════════════════════

function generateMesures(
  operator: OperatorConfig,
  regionId: string,
  region: typeof REGIONS_GUINEE[0],
  campagneId: string,
  periode: string,
  count: number
): any[] {
  const profil = operator.profil;
  const isUrbain = region.type === "urbain";
  const isSemiUrbain = region.type === "semi-urbain";
  const isRural = region.type === "rural";

  // Facteur de qualité selon le type de zone
  const zoneFactor = isUrbain ? 1.0 : isSemiUrbain ? 0.8 : isRural ? profil.degradationRurale : 0.5;

  const mesures: any[] = [];
  const baseDate = new Date(periode.split("-")[0] + "-" + (periode.includes("Q1") ? "01" : periode.includes("Q2") ? "04" : periode.includes("Q3") ? "07" : "10") + "-01");

  for (let i = 0; i < count; i++) {
    const point = randomPoint(region.centreLat, region.centreLng, isUrbain ? 15 : isSemiUrbain ? 30 : 50);
    const isCovered = Math.random() < profil.couverture * zoneFactor;
    const typeMesure = Math.random() > 0.4 ? "MOBILE" : "INTERNET";

    // Timestamp aléatoire dans le trimestre
    const quarterMonths = periode.includes("Q1") ? [0,1,2] : periode.includes("Q2") ? [3,4,5] : periode.includes("Q3") ? [6,7,8] : [9,10,11];
    const month = quarterMonths[randInt(0, 2)];
    const day = randInt(1, 28);
    const hour = randInt(6, 22);
    const minute = randInt(0, 59);
    const ts = new Date(baseDate.getFullYear(), month, day, hour, minute);

    if (!isCovered) {
      // Zone blanche — signal très faible ou absent
      mesures.push({
        operateurId: undefined as any, // sera rempli par l'appelant
        regionId,
        campagneId,
        latitude: point.lat,
        longitude: point.lng,
        timestamp: ts,
        typeMesure,
        rssi: clamp(profil.rssiBase + rand(-20, -5), -130, -50),
        rsrp: clamp(profil.rsrpBase + rand(-20, -5), -140, -60),
        rsrq: clamp(-15 + rand(-5, 0), -20, -3),
        sinr: clamp(rand(-10, 0), -20, 30),
        debitDescendant: 0,
        debitMontant: 0,
        latence: clamp(profil.latenceBase * 3 + rand(0, 500), 0, 5000),
        gigue: clamp(rand(20, 100), 0, 5000),
        tauxAppelReussi: clamp(rand(0, 40), 0, 100),
        tauxDropCall: clamp(rand(30, 80), 0, 100),
        debitDownload: clamp(rand(0, 1), 0, 100000),
        debitUpload: 0,
        ping: clamp(profil.latenceBase * 3 + rand(0, 500), 0, 5000),
        dnsLookupTime: clamp(rand(100, 500), 0, 5000),
        tcpConnectTime: clamp(rand(200, 800), 0, 5000),
        scoreQoE: clamp(rand(0, 20), 0, 100),
        pageLoadTime: clamp(rand(10, 60), 0, 60000),
        videoBuffering: clamp(rand(5, 30), 0, 60000),
      });
    } else {
      // Zone couverte — signal réaliste avec variabilité
      const qualityVar = rand(0.8, 1.2) * zoneFactor;
      const isMobile = typeMesure === "MOBILE";

      mesures.push({
        operateurId: undefined as any,
        regionId,
        campagneId,
        latitude: point.lat,
        longitude: point.lng,
        timestamp: ts,
        typeMesure,
        // Signal RF
        rssi: clamp(profil.rssiBase * qualityVar + rand(-10, 5), -130, -30),
        rsrp: clamp(profil.rsrpBase * qualityVar + rand(-10, 5), -140, -44),
        rsrq: clamp(-10 + rand(-5, 3), -20, -3),
        sinr: clamp(8 * qualityVar + rand(-5, 10), -20, 30),
        // Réseau mobile
        debitDescendant: isMobile ? clamp(profil.debitDescBase * qualityVar + rand(-5, 10), 0, 100000) : null,
        debitMontant: isMobile ? clamp(profil.debitDescBase * 0.4 * qualityVar + rand(-2, 5), 0, 100000) : null,
        latence: clamp(profil.latenceBase / qualityVar + rand(-10, 20), 0, 5000),
        gigue: clamp(rand(2, 15), 0, 5000),
        tauxAppelReussi: isMobile ? clamp(profil.tauxAppelBase * qualityVar + rand(-3, 2), 0, 100) : null,
        tauxDropCall: isMobile ? clamp(100 - profil.tauxAppelBase * qualityVar + rand(-2, 5), 0, 100) : null,
        // Réseau internet
        debitDownload: !isMobile ? clamp(profil.debitDownBase * qualityVar + rand(-5, 15), 0, 100000) : null,
        debitUpload: !isMobile ? clamp(profil.debitUpBase * qualityVar + rand(-2, 5), 0, 100000) : null,
        ping: !isMobile ? clamp(profil.latenceBase / qualityVar + rand(-5, 15), 0, 5000) : null,
        dnsLookupTime: !isMobile ? clamp(rand(10, 60) / qualityVar, 0, 5000) : null,
        tcpConnectTime: !isMobile ? clamp(rand(30, 120) / qualityVar, 0, 5000) : null,
        // QoE
        scoreQoE: clamp(profil.scoreQoEBase * qualityVar + rand(-10, 10), 0, 100),
        pageLoadTime: clamp(rand(1, 5) / qualityVar, 0, 60000),
        videoBuffering: clamp(rand(0, 3) / qualityVar, 0, 60000),
      });
    }
  }

  return mesures;
}

// ═══════════════════════════════════════════════════════
// FONCTIONS D'IMPORT
// ═══════════════════════════════════════════════════════

async function ensureOperators() {
  console.log("\n🏭 Vérification des opérateurs...");
  for (const [code, op] of Object.entries(OPERATORS)) {
    const existing = await prisma.operateur.findUnique({ where: { code } });
    if (existing) {
      // Mettre à jour la clé API hashée
      const hash = hashApiKey(op.apiKey);
      await prisma.operateur.update({
        where: { code },
        data: { cleApi: hash, nom: op.nom, type: op.type, licence: op.licence },
      });
      console.log(`  ✅ ${op.nom} — mis à jour (clé API hashée)`);
    } else {
      const hash = hashApiKey(op.apiKey);
      await prisma.operateur.create({
        data: {
          code,
          nom: op.nom,
          type: op.type,
          licence: op.licence,
          cleApi: hash,
          isActive: true,
        },
      });
      console.log(`  ✅ ${op.nom} — créé`);
    }
  }
}

async function ensureRegions() {
  console.log("\n🗺️ Vérification des régions...");
  for (const r of REGIONS_GUINEE) {
    const existing = await prisma.region.findUnique({ where: { code: r.code } });
    if (existing) {
      await prisma.region.update({
        where: { code: r.code },
        data: { nom: r.nom, population: r.population, centreLat: r.centreLat, centreLng: r.centreLng },
      });
    } else {
      await prisma.region.create({
        data: {
          code: r.code,
          nom: r.nom,
          population: r.population,
          centreLat: r.centreLat,
          centreLng: r.centreLng,
        },
      });
    }
  }
  console.log(`  ✅ ${REGIONS_GUINEE.length} régions garanties`);
}

async function importMesures(operatorCodes?: string[]) {
  console.log("\n📊 Import des mesures QoS par opérateur...");

  const periodes = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"];
  const codes = operatorCodes || Object.keys(OPERATORS);
  let totalInserted = 0;

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) { console.log(`  ⚠️ Opérateur ${code} non trouvé`); continue; }

    const operateur = await prisma.operateur.findUnique({ where: { code } });
    if (!operateur) { console.log(`  ⚠️ ${op.nom} non trouvé en base`); continue; }

    console.log(`\n  📡 ${op.nom} — Génération des mesures...`);

    for (const periode of periodes) {
      console.log(`    Période ${periode}...`);

      for (const region of REGIONS_GUINEE) {
        const regionDb = await prisma.region.findUnique({ where: { code: region.code } });
        if (!regionDb) continue;

        // Créer ou trouver la campagne
        const campNom = `Drive Test ${region.nom} ${periode}`;
        let campagne = await prisma.campagne.findFirst({
          where: { nom: campNom, operateurId: operateur.id },
        });

        if (!campagne) {
          const quarterStart = new Date(
            periode.split("-")[0] + "-" +
            (periode.includes("Q1") ? "01" : periode.includes("Q2") ? "04" : periode.includes("Q3") ? "07" : "10") +
            "-01"
          );
          campagne = await prisma.campagne.create({
            data: {
              nom: campNom,
              type: "QOS_MOBILE",
              operateurId: operateur.id,
              regionId: regionDb.id,
              dateDebut: quarterStart,
              dateFin: new Date(quarterStart.getTime() + 90 * 24 * 3600 * 1000),
              statut: periode === "2026-Q1" ? "EN_COURS" : "TERMINEE",
              responsable: `Équipe ARPT ${region.nom}`,
            },
          });
        }

        // Nombre de mesures par région selon le type
        const mesuresParRegion =
          region.type === "urbain" ? 30 :
          region.type === "semi-urbain" ? 20 :
          region.type === "semi-rural" ? 12 : 8;

        const mesures = generateMesures(op, regionDb.id, region, campagne.id, periode, mesuresParRegion);

        // Ajouter l'operateurId
        for (const m of mesures) {
          m.operateurId = operateur.id;
        }

        // Insérer par batch de 100
        const CHUNK = 100;
        for (let i = 0; i < mesures.length; i += CHUNK) {
          const chunk = mesures.slice(i, i + CHUNK);
          try {
            await prisma.mesureQoS.createMany({ data: chunk });
            totalInserted += chunk.length;
          } catch (err) {
            console.error(`      ❌ Erreur chunk ${i}: ${err}`);
          }
        }
      }
    }
    console.log(`  ✅ ${op.nom} — mesures importées`);
  }

  console.log(`\n  📈 Total mesures insérées: ${totalInserted}`);
}

async function importScores(operatorCodes?: string[]) {
  console.log("\n🏆 Import des scores opérateurs...");

  const periodes = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"];
  const codes = operatorCodes || Object.keys(OPERATORS);

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    const operateur = await prisma.operateur.findUnique({ where: { code } });
    if (!operateur) continue;

    console.log(`  📡 ${op.nom}...`);

    for (let pi = 0; pi < periodes.length; pi++) {
      const periode = periodes[pi];
      // L'index des scores correspond à la progression temporelle
      const scoreIdx = Math.min(pi, op.profil.scoreGlobal.length - 1);

      try {
        await prisma.scoreOperateur.upsert({
          where: {
            operateurId_periode: { operateurId: operateur.id, periode },
          },
          create: {
            operateurId: operateur.id,
            periode,
            scoreGlobal: op.profil.scoreGlobal[scoreIdx],
            scoreCouverture: op.profil.scoreCouverture[scoreIdx],
            scoreQoS: op.profil.scoreQoS[scoreIdx],
            scoreQoE: op.profil.scoreQoE[scoreIdx],
            scoreConformite: op.profil.scoreConformite[scoreIdx],
            recommandation: op.profil.recommandations[Math.min(scoreIdx, op.profil.recommandations.length - 1)],
          },
          update: {
            scoreGlobal: op.profil.scoreGlobal[scoreIdx],
            scoreCouverture: op.profil.scoreCouverture[scoreIdx],
            scoreQoS: op.profil.scoreQoS[scoreIdx],
            scoreQoE: op.profil.scoreQoE[scoreIdx],
            scoreConformite: op.profil.scoreConformite[scoreIdx],
            recommandation: op.profil.recommandations[Math.min(scoreIdx, op.profil.recommandations.length - 1)],
          },
        });
        console.log(`    ${periode}: Global=${op.profil.scoreGlobal[scoreIdx]} | Couverture=${op.profil.scoreCouverture[scoreIdx]} | QoS=${op.profil.scoreQoS[scoreIdx]} | QoE=${op.profil.scoreQoE[scoreIdx]} | Conformité=${op.profil.scoreConformite[scoreIdx]}`);
      } catch (err) {
        console.error(`    ❌ Erreur ${periode}: ${err}`);
      }
    }
    console.log(`  ✅ ${op.nom} — scores importés`);
  }
}

async function importAlertes(operatorCodes?: string[]) {
  console.log("\n🚨 Import des alertes...");

  const codes = operatorCodes || Object.keys(OPERATORS);
  const alertesConfig = [
    { type: "ZONE_BLANCHE", severity: "CRITIQUE", message: "Zone blanche détectée — aucun signal opérateur" },
    { type: "DEGRADATION_RESEAU", severity: "HAUTE", message: "Dégradation significative de la qualité réseau" },
    { type: "SURCHARGE_TRAFIC", severity: "MOYENNE", message: "Surcharge trafic détectée sur le segment" },
    { type: "PANNE_EQUIPEMENT", severity: "HAUTE", message: "Panne équipement signalée — intervention requise" },
    { type: "NON_CONFORMITE_SLA", severity: "CRITIQUE", message: "Non-conformité SLA — seuils minimaux non respectés" },
    { type: "COUVERTURE_INSUFFISANTE", severity: "MOYENNE", message: "Couverture insuffisante par rapport aux obligations licence" },
  ];

  // Supprimer les anciennes alertes d'import
  await prisma.alerte.deleteMany({});

  for (const code of codes) {
    const op = OPERATORS[code];
    if (!op) continue;

    const operateur = await prisma.operateur.findUnique({ where: { code } });
    if (!operateur) continue;

    // Plus d'alertes pour les opérateurs moins performants
    const alertCount = code === "ORANGE" ? 3 : code === "MTN" ? 5 : code === "CELCOM" ? 8 : 12;

    for (let i = 0; i < alertCount; i++) {
      const alerteConfig = alertesConfig[randInt(0, alertesConfig.length - 1)];
      const region = REGIONS_GUINEE[randInt(0, REGIONS_GUINEE.length - 1)];
      const regionDb = await prisma.region.findUnique({ where: { code: region.code } });

      // Les opérateurs moins performants ont plus d'alertes critiques
      const severityMap = code === "INTERCEL"
        ? ["CRITIQUE", "CRITIQUE", "HAUTE", "HAUTE", "MOYENNE"]
        : code === "CELCOM"
        ? ["CRITIQUE", "HAUTE", "HAUTE", "MOYENNE", "BASSE"]
        : ["HAUTE", "MOYENNE", "MOYENNE", "BASSE", "BASSE"];

      await prisma.alerte.create({
        data: {
          type: alerteConfig.type,
          severity: severityMap[randInt(0, severityMap.length - 1)],
          operateurId: operateur.id,
          regionId: regionDb?.id,
          message: `${alerteConfig.message} — ${op.nom} (${region.nom})`,
          details: `Région: ${region.nom} | Période: 2026-Q1 | Seuil: ${rand(50, 95).toFixed(0)}% | Mesuré: ${rand(10, 70).toFixed(0)}%`,
          isResolved: Math.random() > 0.6,
          resolvedAt: Math.random() > 0.6 ? new Date() : null,
        },
      });
    }
    console.log(`  ✅ ${op.nom} — ${alertCount} alertes créées`);
  }
}

// ═══════════════════════════════════════════════════════
// GÉNÉRATION DES FICHIERS CSV PAR OPÉRATEUR
// ═══════════════════════════════════════════════════════

function generateCSVForOperator(code: string): string {
  const op = OPERATORS[code];
  if (!op) return "";

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

  for (const region of REGIONS_GUINEE) {
    const mesures = generateMesures(op, "region-id", region, "campagne-id", "2026-Q1", 5);
    for (const m of mesures) {
      const row = [
        code, region.code,
        m.latitude.toFixed(6), m.longitude.toFixed(6),
        m.typeMesure, (m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp),
        m.rssi?.toFixed(1) ?? "", m.rsrp?.toFixed(1) ?? "", m.rsrq?.toFixed(1) ?? "", m.sinr?.toFixed(1) ?? "",
        m.debitDescendant?.toFixed(1) ?? "", m.debitMontant?.toFixed(1) ?? "",
        m.latence?.toFixed(0) ?? "", m.gigue?.toFixed(1) ?? "",
        m.tauxAppelReussi?.toFixed(1) ?? "", m.tauxDropCall?.toFixed(1) ?? "",
        m.debitDownload?.toFixed(1) ?? "", m.debitUpload?.toFixed(1) ?? "",
        m.ping?.toFixed(0) ?? "", m.dnsLookupTime?.toFixed(0) ?? "", m.tcpConnectTime?.toFixed(0) ?? "",
        m.scoreQoE?.toFixed(0) ?? "", m.pageLoadTime?.toFixed(1) ?? "", m.videoBuffering?.toFixed(1) ?? "",
        `Drive Test ${region.nom} 2026-Q1`,
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\n");
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  console.log("═══════════════════════════════════════════════════════");
  console.log("🇬🇳  ARPT-QoS-Guinée — Alimentation Production");
  console.log("═══════════════════════════════════════════════════════");

  // Déterminer quels opérateurs importer
  let operatorCodes: string[] | undefined;
  for (const arg of args) {
    if (OPERATORS[arg.toUpperCase()]) {
      operatorCodes = operatorCodes || [];
      operatorCodes.push(arg.toUpperCase());
    }
  }

  const doMesures = !args.includes("--scores") || args.includes("--mesures");
  const doScores = !args.includes("--mesures") || args.includes("--scores");
  const doCSV = args.includes("--csv");

  try {
    // 1. Garantir les opérateurs et régions
    await ensureOperators();
    await ensureRegions();

    // 2. Importer les mesures QoS
    if (doMesures) {
      await importMesures(operatorCodes);
    }

    // 3. Importer les scores
    if (doScores) {
      await importScores(operatorCodes);
    }

    // 4. Importer les alertes
    if (doMesures) {
      await importAlertes(operatorCodes);
    }

    // 5. Générer les CSV
    if (doCSV) {
      console.log("\n📄 Génération des fichiers CSV...");
      const fs = await import("fs");
      const path = await import("path");

      for (const code of Object.keys(OPERATORS)) {
        const csv = generateCSVForOperator(code);
        const filePath = path.join(process.cwd(), "data-templates", `mesures-${code.toLowerCase()}-2026-Q1.csv`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, csv);
        console.log(`  ✅ ${filePath}`);
      }
    }

    // 6. Statistiques finales
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📊 Statistiques de la base :");
    console.log("═══════════════════════════════════════════════════════");

    const mesureCount = await prisma.mesureQoS.count();
    const scoreCount = await prisma.scoreOperateur.count();
    const alerteCount = await prisma.alerte.count();
    const campagneCount = await prisma.campagne.count();
    const operateurCount = await prisma.operateur.count();
    const regionCount = await prisma.region.count();

    console.log(`  🏭 Opérateurs     : ${operateurCount}`);
    console.log(`  🗺️  Régions        : ${regionCount}`);
    console.log(`  📋 Campagnes      : ${campagneCount}`);
    console.log(`  📊 Mesures QoS    : ${mesureCount}`);
    console.log(`  🏆 Scores         : ${scoreCount}`);
    console.log(`  🚨 Alertes        : ${alerteCount}`);
    console.log("═══════════════════════════════════════════════════════");

  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

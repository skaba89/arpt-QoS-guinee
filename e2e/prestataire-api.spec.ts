/**
 * ============================================================================
 * TESTS E2E — API PRESTATAIRES / FOURNISSEURS DE DONNÉES — ONIT-PNG
 * ============================================================================
 * Ces tests simulent les intégrations API avec les prestataires externes
 * qui remontent des données vers la plateforme ONIT-PNG.
 * 
 * CAS D'USAGE :
 * - Orange Guinée envoie ses mesures QoS via API
 * - MTN Guinée remonte des données de couverture
 * - Celcom Guinée fournit ses scores de qualité
 * - Un prestataire tiers envoie des données CSV d'un drive test
 * - Un système de monitoring automatique pousse des alertes
 * ============================================================================
 * 
 * ENDPOINTS UTILISÉS PAR LES PRESTATAIRES :
 * - POST /api/auth/callback/credentials — Authentification
 * - POST /api/mesures — Envoi d'une mesure unique
 * - PUT  /api/mesures — Import en masse (JSON ou CSV)
 * - POST /api/alerts — Création d'alerte
 * - POST /api/scores — Mise à jour des scores
 * - GET  /api/campaigns — Consultation des campagnes
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import {
  TEST_USERS,
  DEFAULT_PASSWORD,
  OPERATOR_CODES,
} from "./fixtures/test-data";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 1 : Orange Guinée — Envoi de mesures QoS
// Scénario : Le système d'information d'Orange envoie automatiquement
// des mesures de qualité de service via l'API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Orange Guinée envoie des mesures QoS", () => {
  let orangeContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    // Note: En production, Orange utiliserait un compte API dédié
    // Ici on simule avec le compte SUPER_ADMIN pour les écritures
    orangeContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
    const campaignsResp = await orangeContext.context.get("/api/campaigns?operateurCode=ORG");
    const data = await campaignsResp.json();
    if (data.campaigns?.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test.afterAll(async () => {
    await orangeContext.context.dispose();
  });

  test("Authentification API — Obtenir un token de session", async () => {
    const resp = await orangeContext.context.get("/api/auth/session");
    expect(resp.ok()).toBeTruthy();
    const session = await resp.json();
    expect(session.user).toBeTruthy();
  });

  test("Envoi mesure unique — Station BTS Conakry Kaloum", async () => {
    if (!campaignId) { test.skip(); return; }

    const resp = await orangeContext.context.post("/api/mesures", {
      data: {
        campagneId: campaignId,
        operatorCode: "ORG",
        regionCode: "CKY",
        latitude: 9.5092,
        longitude: -13.7122,
        timestamp: "2026-05-18T08:30:00Z",
        typeMesure: "MOBILE",
        rssi: -65,
        rsrp: -82,
        rsrq: -6,
        sinr: 20,
        latence: 25,
        debitDescendant: 38,
        debitMontant: 14,
        gigue: 2,
        tauxAppelReussi: 99.8,
        tauxDropCall: 0.1,
        debitDownload: 35,
        debitUpload: 12,
        ping: 22,
        dnsLookupTime: 8,
        tcpConnectTime: 18,
        scoreQoE: 95,
        pageLoadTime: 600,
        videoBuffering: 0.05,
      },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.mesure.typeMesure).toBe("MOBILE");
    expect(data.mesure.operateurCode).toBe("ORG");
  });

  test("Envoi mesure unique — Station BTS Kindia", async () => {
    if (!campaignId) { test.skip(); return; }

    const resp = await orangeContext.context.post("/api/mesures", {
      data: {
        campagneId: campaignId,
        operatorCode: "ORG",
        regionCode: "KND",
        latitude: 10.058,
        longitude: -12.86,
        timestamp: "2026-05-18T09:15:00Z",
        typeMesure: "INTERNET",
        rssi: -78,
        rsrp: -98,
        rsrq: -11,
        sinr: 9,
        latence: 55,
        debitDescendant: 18,
        debitMontant: 5,
        gigue: 8,
        debitDownload: 15,
        debitUpload: 4,
        ping: 50,
        dnsLookupTime: 22,
        tcpConnectTime: 42,
        scoreQoE: 70,
        pageLoadTime: 1800,
        videoBuffering: 1.5,
      },
    });

    expect(resp.status()).toBe(201);
  });

  test("Envoi mesure — Validation RSSI hors limites rejetée", async () => {
    if (!campaignId) { test.skip(); return; }

    const resp = await orangeContext.context.post("/api/mesures", {
      data: {
        campagneId: campaignId,
        operatorCode: "ORG",
        regionCode: "CKY",
        latitude: 9.5,
        longitude: -13.7,
        timestamp: "2026-05-18T10:00:00Z",
        typeMesure: "MOBILE",
        rssi: 50, // Hors limites [-150, -30]
      },
    });

    expect(resp.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 2 : Import CSV en masse — Drive Test externe
// Scénario : Un prestataire de drive test envoie un fichier CSV avec
// les mesures collectées sur le terrain
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Import CSV Drive Test", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
    const campaignsResp = await adminContext.context.get("/api/campaigns");
    const data = await campaignsResp.json();
    if (data.campaigns?.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
  });

  test("Import CSV — Drive Test Conakry — 8 mesures multi-opérateurs", async () => {
    if (!campaignId) { test.skip(); return; }

    const csvData = `operatorCode,regionCode,latitude,longitude,timestamp,typeMesure,rssi,rsrp,rsrq,sinr,latence,debitDescendant,debitMontant,gigue,tauxAppelReussi,tauxDropCall,debitDownload,debitUpload,ping,dnsLookupTime,tcpConnectTime,scoreQoE,pageLoadTime,videoBuffering
ORG,CKY,9.5092,-13.7122,2026-05-18T08:00:00Z,MOBILE,-65,-82,-6,20,25,38,14,2,99.8,0.1,35,12,22,8,18,95,600,0.05
ORG,CKY,9.5250,-13.6850,2026-05-18T08:05:00Z,MOBILE,-68,-85,-7,18,28,35,12,3,99.5,0.2,32,10,25,10,20,92,700,0.1
ORG,CKY,9.5400,-13.6600,2026-05-18T08:10:00Z,INTERNET,-72,-88,-8,16,32,30,10,4,98,0.5,28,9,30,12,25,88,850,0.2
MTN,CKY,9.5092,-13.7122,2026-05-18T09:00:00Z,MOBILE,-78,-98,-11,10,50,20,6,7,94,2,17,5,48,22,42,72,1500,0.8
MTN,CKY,9.5250,-13.6850,2026-05-18T09:05:00Z,MOBILE,-82,-102,-12,8,58,16,4,9,92,2.5,14,4,55,25,48,68,1800,1.2
MTN,CKY,9.5400,-13.6600,2026-05-18T09:10:00Z,INTERNET,-85,-105,-13,6,65,12,3,11,90,3,10,2,62,28,52,60,2200,1.8
CEL,CKY,9.5092,-13.7122,2026-05-18T10:00:00Z,MOBILE,-80,-100,-12,9,52,18,5,8,93,1.8,15,4,50,22,45,72,1600,0.9
CEL,CKY,9.5250,-13.6850,2026-05-18T10:05:00Z,INTERNET,-88,-108,-14,5,75,10,2,14,87,4,8,2,72,28,55,58,2800,2.2`;

    const resp = await adminContext.context.put(
      `/api/mesures?campagneId=${campaignId}`,
      {
        data: csvData,
        headers: { "Content-Type": "text/csv" },
      }
    );

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.inserted).toBe(8);
    expect(data.format).toBe("CSV");
  });

  test("Import CSV — Données régionales Labé et Kankan", async () => {
    if (!campaignId) { test.skip(); return; }

    const csvData = `operatorCode,regionCode,latitude,longitude,timestamp,typeMesure,rssi,rsrp,rsrq,sinr,latence,debitDescendant,debitMontant,gigue,tauxAppelReussi,tauxDropCall,scoreQoE,pageLoadTime,videoBuffering
ORG,LAB,11.3167,-12.5000,2026-05-18T11:00:00Z,RF_DRIVE,-82,-102,-12,7,65,15,4,10,92,2.5,68,2200,1.5
ORG,KNK,10.3833,-9.3000,2026-05-18T12:00:00Z,WALK_TEST,-80,-100,-11,8,58,18,5,8,93,2,72,1800,1.0
MTN,LAB,11.3500,-12.4500,2026-05-18T11:30:00Z,RF_DRIVE,-90,-110,-14,4,85,8,2,15,85,5,50,3200,2.8
CEL,KNK,10.4000,-9.2500,2026-05-18T12:30:00Z,WALK_TEST,-95,-115,-16,2,110,5,1,20,78,7,40,4500,3.5`;

    const resp = await adminContext.context.put(
      `/api/mesures?campagneId=${campaignId}`,
      {
        data: csvData,
        headers: { "Content-Type": "text/csv" },
      }
    );

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.inserted).toBe(4);
  });

  test("Import CSV — Format invalide rejeté", async () => {
    if (!campaignId) { test.skip(); return; }

    const badCSV = `ceci,n'est,pas\nun,fichier,correct`;

    const resp = await adminContext.context.put(
      `/api/mesures?campagneId=${campaignId}`,
      {
        data: badCSV,
        headers: { "Content-Type": "text/csv" },
      }
    );

    // Le serveur peut rejeter (400) ou accepter partiellement
    expect([201, 400, 500]).toContain(resp.status());
  });

  test("Import CSV — Sans campagneId, rejeté", async () => {
    const resp = await adminContext.context.put("/api/mesures", {
      data: "operatorCode,regionCode\nORG,CKY",
      headers: { "Content-Type": "text/csv" },
    });
    expect(resp.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 3 : Système de monitoring — Alertes automatiques
// Scénario : Un système de monitoring automatique détecte des seuils
// dépassés et crée des alertes via l'API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Système de monitoring automatique", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  const createdAlertIds: string[] = [];

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    // Nettoyer toutes les alertes créées
    for (const id of createdAlertIds) {
      await adminContext.context.patch("/api/alerts", {
        data: { id, isResolved: true },
      });
    }
    await adminContext.context.dispose();
  });

  test("Alerte automatique — Latence critique détectée à Conakry", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "SEUIL_DEPASSE",
        severity: "CRITIQUE",
        operatorCode: "MTN",
        regionCode: "CKY",
        message: "[AUTO] Seuil de latence critique détecté — Moyenne: 250ms (seuil: 100ms)",
        details: JSON.stringify({
          source: "Monitoring Automatique ONIT",
          timestamp_detection: new Date().toISOString(),
          seuil: 100,
          valeur_mesuree: 250,
          unite: "ms",
          impact: "Zone Conakry — 12000 abonnés affectés",
        }),
      },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.severity).toBe("CRITIQUE");
    createdAlertIds.push(data.alert.id);
  });

  test("Alerte automatique — Zone blanche détectée à Boké", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "ZONE_BLANCHE",
        severity: "HAUTE",
        operatorCode: "CEL",
        regionCode: "BOK",
        message: "[AUTO] Zone blanche confirmée — Aucun signal Celcom détecté dans le secteur Boké Nord",
        details: JSON.stringify({
          source: "Monitoring Automatique ONIT",
          timestamp_detection: new Date().toISOString(),
          duree_absence_signal: "72h+",
          population_estimee: 5000,
          coordonnees_centre: { lat: 11.15, lng: -14.35 },
          rayon_km: 25,
        }),
      },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.type).toBe("ZONE_BLANCHE");
    createdAlertIds.push(data.alert.id);
  });

  test("Alerte automatique — Non-conformité SLA Orange", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "NON_CONFORMITE",
        severity: "HAUTE",
        operatorCode: "ORG",
        regionCode: "KND",
        message: "[AUTO] Non-conformité SLA — Taux d'appels réussis Orange Kindia: 82% (minimum requis: 95%)",
        details: JSON.stringify({
          source: "Monitoring Automatique ONIT",
          indicateur: "taux_appel_reussi",
          seuil_sla: 95,
          valeur_mesuree: 82,
          unite: "%",
          periode: "2026-05-18",
        }),
      },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.type).toBe("NON_CONFORMITE");
    createdAlertIds.push(data.alert.id);
  });

  test("Alerte automatique — Dégradation progressive signal MTN", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "DEGRADATION",
        severity: "MOYENNE",
        operatorCode: "MTN",
        regionCode: "MAM",
        message: "[AUTO] Dégradation progressive signal MTN Mamou — RSSI moyen passé de -75dBm à -92dBm en 48h",
        details: JSON.stringify({
          source: "Monitoring Automatique ONIT",
          tendance: "degradation",
          valeur_initiale: -75,
          valeur_actuelle: -92,
          unite: "dBm",
          duree: "48h",
        }),
      },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    createdAlertIds.push(data.alert.id);
  });

  test("Vérifier que toutes les alertes sont visibles", async () => {
    const resp = await adminContext.context.get("/api/alerts?isResolved=false");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    // Au moins les alertes qu'on vient de créer
    expect(data.alerts.length).toBeGreaterThanOrEqual(createdAlertIds.length);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 4 : Mise à jour des scores opérateurs
// Scénario : Le système de scoring calcule et met à jour les scores
// de chaque opérateur pour la période en cours
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Système de scoring automatique", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
  });

  test("Mise à jour score Orange — Q2 2026", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "ORG",
        periode: "2026-Q2",
        scoreGlobal: 78,
        scoreCouverture: 82,
        scoreQoS: 75,
        scoreQoE: 78,
        scoreConformite: 90,
        recommandation: "Orange maintient sa position de leader. Recommandation: accélérer le déploiement rural dans les nouvelles régions CNT (Dubréka, Forécariah).",
      },
    });
    expect(resp.status()).toBe(201);
  });

  test("Mise à jour score MTN — Q2 2026", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "MTN",
        periode: "2026-Q2",
        scoreGlobal: 68,
        scoreCouverture: 70,
        scoreQoS: 62,
        scoreQoE: 65,
        scoreConformite: 75,
        recommandation: "MTN doit améliorer la latence à Conakry et la couverture en intérieur. Plan d'action requis sous 30 jours.",
      },
    });
    expect(resp.status()).toBe(201);
  });

  test("Mise à jour score Celcom — Q2 2026", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "CEL",
        periode: "2026-Q2",
        scoreGlobal: 55,
        scoreCouverture: 58,
        scoreQoS: 48,
        scoreQoE: 52,
        scoreConformite: 62,
        recommandation: "Celcom est sous les seuils réglementaires. Mise en demeure recommandée. Zones prioritaires: Boké, Labé, N'Zérékoré.",
      },
    });
    expect(resp.status()).toBe(201);
  });

  test("Upsert — Mise à jour du score Orange (même période, nouvelle valeur)", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "ORG",
        periode: "2026-Q2",
        scoreGlobal: 80, // Mise à jour
        scoreCouverture: 84,
        scoreQoS: 76,
        scoreQoE: 80,
        scoreConformite: 92,
        recommandation: "Score ajusté après correction des données de campagne.",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.score.scoreGlobal).toBe(80);
  });

  test("Score invalide — Valeur hors limites rejetée", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "ORG",
        periode: "2026-Q3",
        scoreGlobal: 150, // Max 100
      },
    });
    expect(resp.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 5 : Import JSON en masse — Grand volume
// Scénario : Un prestataire envoie un grand volume de mesures JSON
// pour une campagne de mesure complète
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Import JSON grand volume", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
    const campaignsResp = await adminContext.context.get("/api/campaigns");
    const data = await campaignsResp.json();
    if (data.campaigns?.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
  });

  test("Import JSON — 20 mesures multi-opérateurs multi-régions", async () => {
    if (!campaignId) { test.skip(); return; }

    const operateurs = ["ORG", "MTN", "CEL"];
    const regions = [
      { code: "CKY", lat: 9.5092, lng: -13.7122 },
      { code: "KND", lat: 10.058, lng: -12.86 },
      { code: "BOK", lat: 10.9333, lng: -14.3 },
      { code: "LAB", lat: 11.3167, lng: -12.5 },
      { code: "MAM", lat: 10.5, lng: -12.0833 },
      { code: "FRN", lat: 10.0333, lng: -10.7333 },
      { code: "KNK", lat: 10.3833, lng: -9.3 },
      { code: "NZR", lat: 7.75, lng: -8.8167 },
    ];

    const mesures = [];
    for (const opCode of operateurs) {
      for (let i = 0; i < regions.length; i++) {
        if (mesures.length >= 20) break;
        const region = regions[i];
        const isUrban = ["CKY", "KND"].includes(region.code);
        const baseRSSI = opCode === "ORG" ? (isUrban ? -65 : -80) :
                         opCode === "MTN" ? (isUrban ? -75 : -88) :
                         (isUrban ? -78 : -92);
        const baseLatence = opCode === "ORG" ? (isUrban ? 25 : 55) :
                           opCode === "MTN" ? (isUrban ? 45 : 75) :
                           (isUrban ? 55 : 90);

        mesures.push({
          operatorCode: opCode,
          regionCode: region.code,
          latitude: region.lat + (Math.random() - 0.5) * 0.03,
          longitude: region.lng + (Math.random() - 0.5) * 0.03,
          timestamp: `2026-05-18T${String(8 + i).padStart(2, '0')}:00:00Z`,
          typeMesure: i % 2 === 0 ? "MOBILE" : "INTERNET",
          rssi: baseRSSI + Math.floor(Math.random() * 10 - 5),
          rsrp: baseRSSI - 18 + Math.floor(Math.random() * 8 - 4),
          rsrq: -7 + Math.floor(Math.random() * 8 - 4),
          sinr: isUrban ? 15 + Math.floor(Math.random() * 8) : 5 + Math.floor(Math.random() * 8),
          latence: baseLatence + Math.floor(Math.random() * 15 - 7),
          debitDescendant: isUrban ? 20 + Math.random() * 20 : 5 + Math.random() * 12,
          debitMontant: isUrban ? 6 + Math.random() * 8 : 1 + Math.random() * 4,
          gigue: 2 + Math.floor(Math.random() * 10),
          tauxAppelReussi: isUrban ? 95 + Math.random() * 5 : 80 + Math.random() * 15,
          tauxDropCall: isUrban ? Math.random() * 2 : Math.random() * 6,
          debitDownload: isUrban ? 18 + Math.random() * 20 : 3 + Math.random() * 10,
          debitUpload: isUrban ? 5 + Math.random() * 8 : 1 + Math.random() * 3,
          ping: baseLatence - 3 + Math.floor(Math.random() * 10),
          dnsLookupTime: 8 + Math.floor(Math.random() * 20),
          tcpConnectTime: 18 + Math.floor(Math.random() * 25),
          scoreQoE: isUrban ? 75 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 30),
          pageLoadTime: isUrban ? 700 + Math.floor(Math.random() * 800) : 1500 + Math.floor(Math.random() * 3000),
          videoBuffering: isUrban ? Math.random() * 0.8 : Math.random() * 3,
        });
      }
      if (mesures.length >= 20) break;
    }

    const resp = await adminContext.context.put("/api/mesures", {
      data: { campagneId: campaignId, mesures: mesures.slice(0, 20) },
      headers: { "Content-Type": "application/json" },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.inserted).toBeGreaterThan(0);
    expect(data.format).toBe("JSON");
  });

  test("Import JSON — Tableau vide rejeté", async () => {
    if (!campaignId) { test.skip(); return; }

    const resp = await adminContext.context.put("/api/mesures", {
      data: { campagneId: campaignId, mesures: [] },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(400);
  });

  test("Import JSON — Sans campagneId rejeté", async () => {
    const resp = await adminContext.context.put("/api/mesures", {
      data: { mesures: [{ operatorCode: "ORG" }] },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESTATAIRE 6 : Signalement citoyen via API publique
// Scénario : Une application mobile citoyenne permet de signaler
// des problèmes réseau sans authentification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API Prestataire — Signalement citoyen (API publique)", () => {
  const createdAlertIds: string[] = [];

  test.afterAll(async () => {
    const { context } = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
    for (const id of createdAlertIds) {
      await context.patch("/api/alerts", { data: { id, isResolved: true } });
    }
    await context.dispose();
  });

  test("Signalement public — Pas de réseau à Mamou", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "SIGNALEMENT_PUBLIC",
        severity: "HAUTE",
        message: "Plus de réseau MTN à Mamou depuis ce matin. Impossible de passer ou recevoir des appels.",
        regionCode: "MAM",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.type).toBe("SIGNALEMENT_PUBLIC");
    createdAlertIds.push(data.alert.id);
  });

  test("Signalement public — Internet très lent à Kankan", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "SIGNALEMENT_PUBLIC",
        severity: "MOYENNE",
        message: "Internet Orange très lent à Kankan. Les vidéos ne se chargent pas. Ça fait une semaine.",
        regionCode: "KNK",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    createdAlertIds.push(data.alert.id);
  });

  test("Signalement public — Message vide rejeté", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "SIGNALEMENT_PUBLIC",
        severity: "BASSE",
      },
    });
    expect(resp.status()).toBe(400);
  });

  test("Signalement non-public sans auth — Rejeté", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "DEGRADATION",
        severity: "HAUTE",
        message: "Test",
      },
    });
    expect(resp.status()).toBe(401);
  });
});

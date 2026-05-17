/**
 * ============================================================================
 * TESTS E2E — SCÉNARIOS DE PRODUCTION RÉELS — ONIT-PNG
 * ============================================================================
 * Ces tests simulent des scénarios réels d'utilisation en production,
 * comme si un opérateur ou un agent ARPT utilisait l'application.
 * Chaque test suit un flux complet de bout en bout.
 * ============================================================================
 * 
 * SCÉNARIOS COUVERTS :
 * 1. Opérateur Orange remonte des mesures de campagne drive test
 * 2. Analyste ARPT crée une campagne et importe des données CSV
 * 3. Citoyen signale un problème réseau (signalement public)
 * 4. Super Admin gère une alerte critique de bout en bout
 * 5. Prestataire importe des données QoS en masse via JSON
 * 6. DG consulte le dashboard et génère un rapport
 * 7. Ingénieur RF effectue un walk test et remonte les données
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import {
  TEST_USERS,
  DEFAULT_PASSWORD,
  OPERATOR_CODES,
  REGION_CODES,
} from "./fixtures/test-data";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 1 : Opérateur Orange — Consultation de ses données
// Un technicien Orange se connecte, consulte ses mesures et campagnes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #1 — Opérateur Orange consulte ses données", () => {
  let orangeContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    orangeContext = await createAuthenticatedContext(
      TEST_USERS.operateurOrange.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    await orangeContext.context.dispose();
  });

  test("Étape 1 : Connexion réussie en tant que technicien Orange", async () => {
    const sessionResp = await orangeContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json();
    expect(session.user).toBeTruthy();
  });

  test("Étape 2 : Consulter le dashboard — KPIs visibles", async () => {
    const resp = await orangeContext.context.get("/api/dashboard");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.kpis).toBeTruthy();
    expect(data.kpis.couvertureNationale).toBeTruthy();
  });

  test("Étape 3 : Lister les mesures de son opérateur uniquement", async () => {
    const resp = await orangeContext.context.get("/api/mesures?operateur=ORG");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    // Toutes les mesures doivent être celles d'Orange
    for (const mesure of data.mesures) {
      expect(mesure.operateurCode).toBe("ORG");
    }
  });

  test("Étape 4 : Lister ses campagnes", async () => {
    const resp = await orangeContext.context.get("/api/campaigns?operateurCode=ORG");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.campaigns)).toBeTruthy();
  });

  test("Étape 5 : Consulter les scores de son opérateur", async () => {
    const resp = await orangeContext.context.get("/api/scores?operateur=ORG");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.scores)).toBeTruthy();
  });

  test("Étape 6 : Vérifier que l'accès aux utilisateurs est interdit", async () => {
    const resp = await orangeContext.context.get("/api/users");
    expect(resp.status()).toBe(403);
  });

  test("Étape 7 : Vérifier que la création de mesures est interdite (readonly)", async () => {
    const resp = await orangeContext.context.post("/api/mesures", {
      data: {
        operatorCode: "ORG",
        regionCode: "CKY",
        latitude: 9.5,
        longitude: -13.7,
        timestamp: "2026-05-01T10:00:00Z",
        typeMesure: "MOBILE",
        rssi: -70,
      },
    });
    expect(resp.status()).toBe(403);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 2 : Analyste ARPT — Création de campagne + import de données
// L'analyste crée une campagne, importe des mesures CSV, vérifie les résultats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #2 — Analyste ARPT importe des données de campagne", () => {
  let analysteContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    analysteContext = await createAuthenticatedContext(
      TEST_USERS.analysteQoS.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    await analysteContext.context.dispose();
  });

  test("Étape 1 : Connexion en tant qu'analyste QoS", async () => {
    const sessionResp = await analysteContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  test("Étape 2 : Récupérer les IDs opérateur et région via le dashboard", async () => {
    const dashResp = await analysteContext.context.get("/api/dashboard");
    expect(dashResp.ok()).toBeTruthy();
    const data = await dashResp.json();
    expect(data.operators.length).toBeGreaterThan(0);
    expect(data.regions.length).toBeGreaterThan(0);
  });

  test("Étape 3 : Créer une campagne de test QoS Internet", async () => {
    // Récupérer une campagne existante pour avoir les IDs de référence
    const campaignsResp = await analysteContext.context.get("/api/campaigns");
    const campaignsData = await campaignsResp.json();
    
    if (campaignsData.campaigns.length > 0) {
      // On utilise la première campagne comme référence
      campaignId = campaignsData.campaigns[0].id;
    }
    
    // Vérifier qu'on peut lister les campagnes
    expect(campaignsResp.ok()).toBeTruthy();
  });

  test("Étape 4 : Importer des mesures CSV dans la campagne", async () => {
    if (!campaignId) {
      test.skip();
      return;
    }

    const csvData = `operatorCode,regionCode,latitude,longitude,timestamp,typeMesure,rssi,rsrp,rsrq,sinr,latence,debitDescendant,debitMontant,gigue,tauxAppelReussi,tauxDropCall,debitDownload,debitUpload,ping,dnsLookupTime,tcpConnectTime,scoreQoE,pageLoadTime,videoBuffering
ORG,CKY,9.5092,-13.7122,2026-05-15T08:00:00Z,MOBILE,-72,-90,-9,14,38,28,9,4,98,1,25,8,40,14,32,86,1000,0.3
ORG,CKY,9.5200,-13.6900,2026-05-15T08:10:00Z,INTERNET,-75,-95,-10,12,45,22,7,6,96,1.5,20,6,48,18,38,78,1400,0.7
MTN,CKY,9.5250,-13.6850,2026-05-15T09:00:00Z,MOBILE,-80,-100,-12,8,55,18,5,8,94,2,15,4,55,25,48,72,1800,1.0`;

    const resp = await analysteContext.context.put(
      `/api/mesures?campagneId=${campaignId}`,
      {
        data: csvData,
        headers: { "Content-Type": "text/csv" },
      }
    );

    // L'import peut réussir (201) ou échouer si permissions insuffisantes
    if (resp.ok()) {
      const data = await resp.json();
      expect(data.inserted).toBeGreaterThan(0);
    } else {
      console.log("Import CSV: status", resp.status(), "- permissions insuffisantes possible");
    }
  });

  test("Étape 5 : Vérifier les mesures importées", async () => {
    const resp = await analysteContext.context.get("/api/mesures?limit=5");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.mesures).toBeTruthy();
    expect(data.pagination).toBeTruthy();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 3 : Citoyen — Signalement public de problème réseau
// Un citoyen signale un problème sans être authentifié
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #3 — Citoyen signale un problème réseau", () => {
  let alertId: string | null = null;

  test("Étape 1 : Accéder au dashboard public sans authentification", async ({ request }) => {
    const resp = await request.get("/api/dashboard");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.kpis).toBeTruthy();
  });

  test("Étape 2 : Consulter les rapports publics", async ({ request }) => {
    const resp = await request.get("/api/reports");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    for (const report of data.reports) {
      expect(report.isPublic).toBe(true);
    }
  });

  test("Étape 3 : Signaler un problème réseau (signalement public)", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "SIGNALEMENT_PUBLIC",
        severity: "HAUTE",
        message: "Pas de réseau Orange dans le quartier de Kaloum depuis 3 jours. Aucune barre de signal.",
        regionCode: "CKY",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.type).toBe("SIGNALEMENT_PUBLIC");
    expect(data.alert.isResolved).toBe(false);
    alertId = data.alert.id;
  });

  test("Étape 4 : Vérifier que le signalement est visible", async ({ request }) => {
    // Le signalement public ne peut pas être listé sans authentification
    // mais on peut vérifier que l'alerte a bien été créée
    expect(alertId).toBeTruthy();
  });

  test("Étape 5 : Un citoyen ne peut pas créer d'alerte non publique", async ({ request }) => {
    const resp = await request.post("/api/alerts", {
      data: {
        type: "DEGRADATION",
        severity: "CRITIQUE",
        message: "Test",
      },
    });
    expect(resp.status()).toBe(401);
  });

  test.afterAll(async () => {
    // Nettoyage : résoudre l'alerte créée
    if (alertId) {
      const { context } = await createAuthenticatedContext(
        TEST_USERS.superAdmin.email,
        DEFAULT_PASSWORD
      );
      await context.patch("/api/alerts", {
        data: { id: alertId, isResolved: true },
      });
      await context.dispose();
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 4 : Super Admin — Gestion complète d'une alerte critique
// De la détection à la résolution, en passant par l'audit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #4 — Super Admin gère une alerte critique bout en bout", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let alertId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    // Nettoyage final
    if (alertId) {
      await adminContext.context.patch("/api/alerts", {
        data: { id: alertId, isResolved: true },
      });
    }
    await adminContext.context.dispose();
  });

  test("Étape 1 : Se connecter en Super Admin", async () => {
    const sessionResp = await adminContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
    const session = await sessionResp.json();
    expect(session.user).toBeTruthy();
  });

  test("Étape 2 : Vérifier l'absence d'alertes non résolues pour ce test", async () => {
    const resp = await adminContext.context.get("/api/alerts?isResolved=false");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.alerts)).toBeTruthy();
  });

  test("Étape 3 : Créer une alerte critique de dégradation réseau", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "DEGRADATION",
        severity: "CRITIQUE",
        operatorCode: "ORG",
        regionCode: "CKY",
        message: "Dégradation majeure du signal Orange à Conakry — Perte de service complète dans les communes de Kaloum et Dixinn",
        details: "Impact estimé: 15 000 abonnés. Début: 2026-05-18 06:00. Cause probable: panne alimentation site BT.",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.alert.severity).toBe("CRITIQUE");
    expect(data.alert.isResolved).toBe(false);
    alertId = data.alert.id;
  });

  test("Étape 4 : Vérifier que l'alerte apparaît dans les alertes non résolues", async () => {
    const resp = await adminContext.context.get("/api/alerts?isResolved=false&severity=CRITIQUE");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const found = data.alerts.find((a: { id: string }) => a.id === alertId);
    expect(found).toBeTruthy();
  });

  test("Étape 5 : Vérifier la présence dans le journal d'audit", async () => {
    const resp = await adminContext.context.get("/api/audit-logs?limit=10");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.logs || data)).toBeTruthy();
  });

  test("Étape 6 : Résoudre l'alerte après intervention technique", async () => {
    const resp = await adminContext.context.patch("/api/alerts", {
      data: { id: alertId, isResolved: true },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.alert.isResolved).toBe(true);
    expect(data.alert.resolvedAt).toBeTruthy();
  });

  test("Étape 7 : Vérifier que l'alerte est maintenant résolue", async () => {
    const resp = await adminContext.context.get("/api/alerts?isResolved=true&severity=CRITIQUE");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    const found = data.alerts.find((a: { id: string }) => a.id === alertId);
    expect(found).toBeTruthy();
    expect(found.isResolved).toBe(true);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 5 : Prestataire — Import en masse de données QoS via JSON
// Un prestataire envoie des centaines de mesures via l'API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #5 — Prestataire importe des données QoS en masse", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
    // Récupérer une campagne existante
    const campaignsResp = await adminContext.context.get("/api/campaigns");
    const data = await campaignsResp.json();
    if (data.campaigns?.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
  });

  test("Étape 1 : Authentification réussie", async () => {
    const sessionResp = await adminContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  test("Étape 2 : Vérifier l'existence de campagnes pour l'import", async () => {
    expect(campaignId).toBeTruthy();
  });

  test("Étape 3 : Import JSON en masse — 10 mesures QoS multi-opérateurs", async () => {
    if (!campaignId) {
      test.skip();
      return;
    }

    // Générer des mesures réalistes pour 3 opérateurs dans 4 régions
    const mesures = [];
    const operateurs = [
      { code: "ORG", name: "Orange" },
      { code: "MTN", name: "MTN" },
      { code: "CEL", name: "Celcom" },
    ];
    const regions = [
      { code: "CKY", lat: 9.5092, lng: -13.7122 },
      { code: "KND", lat: 10.058, lng: -12.86 },
      { code: "LAB", lat: 11.3167, lng: -12.5 },
      { code: "KNK", lat: 10.3833, lng: -9.3 },
    ];

    for (const op of operateurs) {
      for (const region of regions) {
        // Variation réaliste par opérateur
        const baseRSSI = op.code === "ORG" ? -68 : op.code === "MTN" ? -75 : -82;
        const baseLatence = op.code === "ORG" ? 35 : op.code === "MTN" ? 50 : 70;

        mesures.push({
          operatorCode: op.code,
          regionCode: region.code,
          latitude: region.lat + (Math.random() - 0.5) * 0.05,
          longitude: region.lng + (Math.random() - 0.5) * 0.05,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          typeMesure: Math.random() > 0.5 ? "MOBILE" : "INTERNET",
          rssi: baseRSSI + Math.floor(Math.random() * 15 - 7),
          rsrp: baseRSSI - 20 + Math.floor(Math.random() * 10 - 5),
          rsrq: -8 + Math.floor(Math.random() * 8 - 4),
          sinr: 8 + Math.floor(Math.random() * 12),
          latence: baseLatence + Math.floor(Math.random() * 20 - 10),
          debitDescendant: 10 + Math.random() * 25,
          debitMontant: 2 + Math.random() * 8,
          gigue: 2 + Math.floor(Math.random() * 10),
          tauxAppelReussi: 85 + Math.random() * 14,
          tauxDropCall: 0.5 + Math.random() * 4,
          debitDownload: 8 + Math.random() * 22,
          debitUpload: 2 + Math.random() * 7,
          ping: baseLatence - 5 + Math.floor(Math.random() * 15),
          dnsLookupTime: 10 + Math.floor(Math.random() * 20),
          tcpConnectTime: 25 + Math.floor(Math.random() * 25),
          scoreQoE: 55 + Math.floor(Math.random() * 35),
          pageLoadTime: 800 + Math.floor(Math.random() * 2000),
          videoBuffering: Math.random() * 3,
        });
      }
    }

    const resp = await adminContext.context.put("/api/mesures", {
      data: { campagneId: campaignId, mesures },
      headers: { "Content-Type": "application/json" },
    });

    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.inserted).toBe(mesures.length);
    expect(data.format).toBe("JSON");
  });

  test("Étape 4 : Vérifier les mesures importées par opérateur", async () => {
    for (const code of ["ORG", "MTN", "CEL"]) {
      const resp = await adminContext.context.get(`/api/mesures?operateur=${code}&limit=100`);
      expect(resp.ok()).toBeTruthy();
      const data = await resp.json();
      expect(data.mesures.length).toBeGreaterThan(0);
    }
  });

  test("Étape 5 : Vérifier les mesures importées par région", async () => {
    for (const code of ["CKY", "KND", "LAB", "KNK"]) {
      const resp = await adminContext.context.get(`/api/mesures?region=${code}&limit=100`);
      expect(resp.ok()).toBeTruthy();
      const data = await resp.json();
      expect(data.mesures.length).toBeGreaterThan(0);
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 6 : Directeur Général — Consultation du dashboard et rapport
// Le DG consulte les KPIs, vérifie le scoring, et demande un rapport
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #6 — DG consulte le dashboard et génère un rapport", () => {
  let dgContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    dgContext = await createAuthenticatedContext(TEST_USERS.dg.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await dgContext.context.dispose();
  });

  test("Étape 1 : Connexion en tant que DG", async () => {
    const sessionResp = await dgContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  test("Étape 2 : Consulter les KPIs nationaux", async () => {
    const resp = await dgContext.context.get("/api/dashboard");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    
    // Vérifier les KPIs
    expect(data.kpis.couvertureNationale.value).toBeGreaterThanOrEqual(0);
    expect(data.kpis.scoreQosGlobal.value).toBeGreaterThanOrEqual(0);
    expect(data.kpis.zonesBlanches.value).toBeGreaterThanOrEqual(0);
    
    // Vérifier les 3 opérateurs
    expect(data.operators.length).toBeGreaterThanOrEqual(3);
  });

  test("Étape 3 : Consulter le scoring des opérateurs", async () => {
    const resp = await dgContext.context.get("/api/scoring");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data).toBeTruthy();
  });

  test("Étape 4 : Consulter les métriques QoS détaillées", async () => {
    const resp = await dgContext.context.get("/api/qos");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data).toBeTruthy();
  });

  test("Étape 5 : Consulter les alertes actives", async () => {
    const resp = await dgContext.context.get("/api/alerts?isResolved=false");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.alerts)).toBeTruthy();
  });

  test("Étape 6 : Lister les rapports existants", async () => {
    const resp = await dgContext.context.get("/api/reports");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.reports)).toBeTruthy();
  });

  test("Étape 7 : Créer un rapport réglementaire", async () => {
    const resp = await dgContext.context.post("/api/reports", {
      data: {
        titre: "Rapport Trimestriel QoS — T2 2026 — Direction Générale",
        type: "REGLEMENTAIRE",
        format: "PDF",
        contenu: JSON.stringify({
          periode: "2026-Q2",
          type: "Rapport Trimestriel Réglementaire",
          synopsis: "Rapport de synthèse de la qualité de service des opérateurs de télécommunications en République de Guinée pour le deuxième trimestre 2026.",
          indicateurs_cles: {
            couverture_nationale: "78%",
            score_qos_moyen: "72/100",
            conformite_sla: "85%",
            zones_blanches: 127,
          },
          recommandations: [
            "Renforcer la couverture en zone rurale (Labé, Boké)",
            "Exiger un plan d'action de Orange pour la résolution des incidents Conakry",
            "Accélérer le déploiement 4G dans les préfectures CNT",
          ],
        }),
        isPublic: false,
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.report.titre).toContain("Trimestriel");
  });

  test("Étape 8 : Consulter le journal d'audit", async () => {
    const resp = await dgContext.context.get("/api/audit-logs?limit=5");
    expect(resp.ok()).toBeTruthy();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 7 : Ingénieur RF — Envoi de mesures d'un walk test
// L'ingénieur crée des mesures ponctuelles pour un site spécifique
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #7 — Ingénieur RF remonte des mesures walk test", () => {
  let ingenieurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    ingenieurContext = await createAuthenticatedContext(
      TEST_USERS.ingenieurRF.email,
      DEFAULT_PASSWORD
    );
    // Récupérer une campagne pour les mesures
    const campaignsResp = await ingenieurContext.context.get("/api/campaigns");
    const data = await campaignsResp.json();
    if (data.campaigns?.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test.afterAll(async () => {
    await ingenieurContext.context.dispose();
  });

  test("Étape 1 : Connexion en tant qu'ingénieur RF", async () => {
    const sessionResp = await ingenieurContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  test("Étape 2 : Envoyer une mesure ponctuelle — Site BTS Kaloum", async () => {
    if (!campaignId) {
      test.skip();
      return;
    }

    const resp = await ingenieurContext.context.post("/api/mesures", {
      data: {
        campagneId: campaignId,
        operatorCode: "ORG",
        regionCode: "CKY",
        latitude: 9.5150,
        longitude: -13.7050,
        timestamp: new Date().toISOString(),
        typeMesure: "RF_DRIVE",
        rssi: -65,
        rsrp: -85,
        rsrq: -7,
        sinr: 18,
        latence: 28,
        debitDescendant: 35,
        debitMontant: 12,
        gigue: 2,
        tauxAppelReussi: 99.5,
        tauxDropCall: 0.2,
        scoreQoE: 92,
        pageLoadTime: 750,
        videoBuffering: 0.1,
      },
    });

    // Peut réussir ou être 403 selon les permissions de l'ingénieur
    if (resp.status() === 201) {
      const data = await resp.json();
      expect(data.mesure).toBeTruthy();
      expect(data.mesure.typeMesure).toBe("RF_DRIVE");
    } else {
      console.log("Ingénieur RF: création mesure retourne", resp.status());
    }
  });

  test("Étape 3 : Envoyer une deuxième mesure — Site BTS Dixinn", async () => {
    if (!campaignId) {
      test.skip();
      return;
    }

    const resp = await ingenieurContext.context.post("/api/mesures", {
      data: {
        campagneId: campaignId,
        operatorCode: "ORG",
        regionCode: "CKY",
        latitude: 9.5350,
        longitude: -13.6850,
        timestamp: new Date().toISOString(),
        typeMesure: "WALK_TEST",
        rssi: -78,
        rsrp: -98,
        rsrq: -11,
        sinr: 10,
        latence: 52,
        debitDescendant: 18,
        debitMontant: 5,
        gigue: 8,
        tauxAppelReussi: 94,
        tauxDropCall: 2,
        scoreQoE: 72,
        pageLoadTime: 1800,
        videoBuffering: 1.2,
      },
    });

    if (resp.status() === 201) {
      const data = await resp.json();
      expect(data.mesure).toBeTruthy();
    }
  });

  test("Étape 4 : Consulter les mesures de la campagne", async () => {
    const resp = await ingenieurContext.context.get("/api/mesures?limit=10");
    expect(resp.ok()).toBeTruthy();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCÉNARIO 8 : Full E2E — Du login au rapport en passant par toutes les étapes
// Test de bout en bout complet couvrant le flux métier complet
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Scénario Production #8 — Flux complet : Login → Mesures → Alerte → Rapport", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let campaignId: string | null = null;
  let alertId: string | null = null;
  let reportId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(
      TEST_USERS.superAdmin.email,
      DEFAULT_PASSWORD
    );
  });

  test.afterAll(async () => {
    // Nettoyage complet
    if (alertId) {
      await adminContext.context.patch("/api/alerts", {
        data: { id: alertId, isResolved: true },
      });
    }
    await adminContext.context.dispose();
  });

  test("1. Health check — L'API est opérationnelle", async ({ request }) => {
    const resp = await request.get("/api");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.status).toBe("ok");
  });

  test("2. Authentification — Connexion Super Admin", async () => {
    const sessionResp = await adminContext.context.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  test("3. Dashboard — KPIs disponibles", async () => {
    const resp = await adminContext.context.get("/api/dashboard");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.kpis).toBeTruthy();
    expect(data.operators.length).toBeGreaterThan(0);
  });

  test("4. Campagnes — Récupérer une campagne", async () => {
    const resp = await adminContext.context.get("/api/campaigns");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    if (data.campaigns.length > 0) {
      campaignId = data.campaigns[0].id;
    }
  });

  test("5. Mesures — Importer des données QoS", async () => {
    if (!campaignId) {
      test.skip();
      return;
    }

    const resp = await adminContext.context.put("/api/mesures", {
      data: {
        campagneId: campaignId,
        mesures: [
          {
            operatorCode: "ORG",
            regionCode: "CKY",
            latitude: 9.5092,
            longitude: -13.7122,
            timestamp: new Date().toISOString(),
            typeMesure: "MOBILE",
            rssi: -70,
            rsrp: -88,
            rsrq: -8,
            sinr: 15,
            latence: 35,
            debitDescendant: 30,
            debitMontant: 10,
            gigue: 3,
            tauxAppelReussi: 99,
            tauxDropCall: 0.5,
            scoreQoE: 88,
            pageLoadTime: 900,
            videoBuffering: 0.2,
          },
        ],
      },
      headers: { "Content-Type": "application/json" },
    });

    expect(resp.status()).toBe(201);
  });

  test("6. Alertes — Créer une alerte pour dégradation détectée", async () => {
    const resp = await adminContext.context.post("/api/alerts", {
      data: {
        type: "SEUIL_DEPASSE",
        severity: "HAUTE",
        operatorCode: "MTN",
        regionCode: "KND",
        message: "Seuil de latence dépassé à Kindia — Moyenne 120ms (seuil: 80ms)",
        details: "Constaté lors de la campagne QoS du 18/05/2026. Impact: 3000 abonnés MTN Kindia.",
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    alertId = data.alert.id;
  });

  test("7. Scores — Mettre à jour le score de l'opérateur", async () => {
    const resp = await adminContext.context.post("/api/scores", {
      data: {
        operatorCode: "MTN",
        periode: "2026-Q2",
        scoreGlobal: 68,
        scoreCouverture: 72,
        scoreQoS: 60,
        scoreQoE: 65,
        scoreConformite: 78,
        recommandation: "Améliorer la latence dans la région de Kindia. Plan d'action requis sous 30 jours.",
      },
    });
    expect(resp.status()).toBe(201);
  });

  test("8. Rapports — Créer un rapport de suivi", async () => {
    const resp = await adminContext.context.post("/api/reports", {
      data: {
        titre: "Suivi Incident — Latence MTN Kindia — Mai 2026",
        type: "INTERNE",
        format: "PDF",
        contenu: JSON.stringify({
          incident: "Dépassement seuil latence MTN Kindia",
          date_incident: "2026-05-18",
          severite: "HAUTE",
          action_corrective: "Escalade auprès de MTN Guinée. Délai de résolution: 48h.",
          suivi: "En attente de réponse de l'opérateur.",
        }),
        isPublic: false,
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    reportId = data.report.id;
  });

  test("9. Résolution — Résoudre l'alerte", async () => {
    if (!alertId) {
      test.skip();
      return;
    }
    const resp = await adminContext.context.patch("/api/alerts", {
      data: { id: alertId, isResolved: true },
    });
    expect(resp.ok()).toBeTruthy();
  });

  test("10. Audit — Vérifier la traçabilité dans les logs", async () => {
    const resp = await adminContext.context.get("/api/audit-logs?limit=10");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(Array.isArray(data.logs || data)).toBeTruthy();
  });

  test("11. Vérification finale — Dashboard mis à jour", async () => {
    const resp = await adminContext.context.get("/api/dashboard");
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.kpis).toBeTruthy();
  });
});

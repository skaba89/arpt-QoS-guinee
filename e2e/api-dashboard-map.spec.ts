/**
 * ============================================================================
 * TESTS E2E — API DASHBOARD, MAP & QOS — ONIT-PNG
 * ============================================================================
 * Tests pour les APIs en lecture seule :
 * - /api/dashboard : KPIs, opérateurs, alertes, régions, SLA
 * - /api/map : Données cartographiques
 * - /api/qos : Métriques QoS agrégées
 * - /api/scoring : Scores radar
 * - /api/audit-logs : Journal d'audit
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import { TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/dashboard — Tableau de Bord", () => {
  test("GET /api/dashboard — retourne les KPIs et données du dashboard", async ({ request }) => {
    const response = await request.get("/api/dashboard");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Vérifier la structure des KPIs
    expect(data).toHaveProperty("kpis");
    expect(data.kpis).toHaveProperty("couvertureNationale");
    expect(data.kpis).toHaveProperty("scoreQosGlobal");
    expect(data.kpis).toHaveProperty("zonesBlanches");
    expect(data.kpis).toHaveProperty("populationCouverte");

    // Vérifier que chaque KPI a les bonnes propriétés
    for (const [, kpi] of Object.entries(data.kpis)) {
      const k = kpi as Record<string, unknown>;
      expect(k).toHaveProperty("value");
      expect(k).toHaveProperty("unit");
      expect(k).toHaveProperty("label");
    }

    // Vérifier les opérateurs
    expect(data).toHaveProperty("operators");
    expect(Array.isArray(data.operators)).toBeTruthy();

    // Vérifier les alertes
    expect(data).toHaveProperty("alerts");
    expect(Array.isArray(data.alerts)).toBeTruthy();

    // Vérifier les régions
    expect(data).toHaveProperty("regions");
    expect(Array.isArray(data.regions)).toBeTruthy();

    // Vérifier la conformité SLA
    expect(data).toHaveProperty("slaCompliance");
    expect(data.slaCompliance).toHaveProperty("global");
  });

  test("GET /api/dashboard — structure détaillée des opérateurs", async ({ request }) => {
    const response = await request.get("/api/dashboard");
    const data = await response.json();
    if (data.operators.length > 0) {
      const op = data.operators[0];
      expect(op).toHaveProperty("id");
      expect(op).toHaveProperty("name");
      expect(op).toHaveProperty("code");
      expect(op).toHaveProperty("score");
      expect(op).toHaveProperty("subscores");
      expect(op.subscores).toHaveProperty("couverture");
      expect(op.subscores).toHaveProperty("qos");
      expect(op.subscores).toHaveProperty("qoe");
      expect(op.subscores).toHaveProperty("conformite");
    }
  });

  test("GET /api/dashboard — structure des régions", async ({ request }) => {
    const response = await request.get("/api/dashboard");
    const data = await response.json();
    if (data.regions.length > 0) {
      const region = data.regions[0];
      expect(region).toHaveProperty("name");
      expect(region).toHaveProperty("code");
      expect(region).toHaveProperty("coverage");
      expect(region).toHaveProperty("qos");
      expect(region).toHaveProperty("population");
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/map
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/map — Cartographie", () => {
  test("GET /api/map — retourne les données cartographiques", async ({ request }) => {
    const response = await request.get("/api/map");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // The map API should return region overlays and measurement points
    expect(data).toBeTruthy();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/qos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/qos — Métriques QoS", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
  });

  test("GET /api/qos — authentifié, retourne les métriques QoS", async () => {
    const response = await adminContext.context.get("/api/qos");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("GET /api/qos — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/qos");
    expect(response.status()).toBe(401);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/scoring
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/scoring — Scoring Opérateurs", () => {
  test("GET /api/scoring — accessible publiquement", async ({ request }) => {
    const response = await request.get("/api/scoring");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/audit-logs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/audit-logs — Journal d'Audit", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let operateurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    operateurContext = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
    await operateurContext.context.dispose();
  });

  test("GET /api/audit-logs — admin peut voir les logs", async () => {
    const response = await adminContext.context.get("/api/audit-logs");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test("GET /api/audit-logs — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/audit-logs");
    expect(response.status()).toBe(401);
  });

  test("GET /api/audit-logs — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.get("/api/audit-logs");
    expect(response.status()).toBe(403);
  });
});

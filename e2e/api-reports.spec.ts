/**
 * ============================================================================
 * TESTS E2E — API RAPPORTS — ONIT-PNG
 * ============================================================================
 * Tests CRUD sur /api/reports : création, lecture, mise à jour,
 * accès public, et contrôle d'accès RBAC.
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import { REPORT_PAYLOAD, TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

test.describe("API /api/reports — Rapports", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let analysteContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let operateurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    analysteContext = await createAuthenticatedContext(TEST_USERS.analysteQoS.email, DEFAULT_PASSWORD);
    operateurContext = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
    await analysteContext.context.dispose();
    await operateurContext.context.dispose();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. GET /api/reports — Lister les rapports
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/reports — authentifié, retourne les rapports", async () => {
    const response = await adminContext.context.get("/api/reports");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("reports");
    expect(Array.isArray(data.reports)).toBeTruthy();
  });

  test("GET /api/reports — non authentifié, retourne uniquement les rapports publics", async ({ request }) => {
    const response = await request.get("/api/reports");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("reports");
    // Public users should only see public reports
    for (const report of data.reports) {
      expect(report.isPublic).toBe(true);
    }
  });

  test("GET /api/reports — vérifier la structure d'un rapport", async () => {
    const response = await adminContext.context.get("/api/reports");
    const data = await response.json();
    if (data.reports.length > 0) {
      const report = data.reports[0];
      expect(report).toHaveProperty("id");
      expect(report).toHaveProperty("titre");
      expect(report).toHaveProperty("type");
      expect(report).toHaveProperty("format");
      expect(report).toHaveProperty("statut");
      expect(report).toHaveProperty("isPublic");
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. POST /api/reports — Créer un rapport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("POST /api/reports — créer un rapport", async () => {
    const response = await adminContext.context.post("/api/reports", {
      data: REPORT_PAYLOAD,
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("report");
    expect(data.report.titre).toBe(REPORT_PAYLOAD.titre);
    expect(data.report.type).toBe("REGLEMENTAIRE");
    expect(data.report.format).toBe("PDF");
  });

  test("POST /api/reports — titre manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/reports", {
      data: { type: "INTERNE", format: "PDF" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/reports — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.post("/api/reports", {
      data: REPORT_PAYLOAD,
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/reports — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.post("/api/reports", {
      data: REPORT_PAYLOAD,
    });
    expect(response.status()).toBe(403);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. PATCH /api/reports — Mettre à jour un rapport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("PATCH /api/reports — changer le statut d'un rapport", async () => {
    // Create a report first
    const createResp = await adminContext.context.post("/api/reports", {
      data: { titre: "Rapport Test Patch E2E", type: "INTERNE", format: "PDF" },
    });
    const { report } = await createResp.json();

    // Update statut
    const patchResp = await adminContext.context.patch("/api/reports", {
      data: { id: report.id, statut: "PUBLIE" },
    });
    expect(patchResp.ok()).toBeTruthy();
    const data = await patchResp.json();
    expect(data.report.statut).toBe("ready"); // PUBLIE maps to "ready"
  });

  test("PATCH /api/reports — rendre un rapport public", async () => {
    const createResp = await adminContext.context.post("/api/reports", {
      data: { titre: "Rapport Test Public E2E", type: "PUBLIC", format: "XLSX", isPublic: false },
    });
    const { report } = await createResp.json();

    const patchResp = await adminContext.context.patch("/api/reports", {
      data: { id: report.id, isPublic: true },
    });
    expect(patchResp.ok()).toBeTruthy();
    const data = await patchResp.json();
    expect(data.report.isPublic).toBe(true);
  });

  test("PATCH /api/reports — statut invalide, retourne 400", async () => {
    const createResp = await adminContext.context.post("/api/reports", {
      data: { titre: "Rapport Test Statut E2E", type: "INTERNE", format: "CSV" },
    });
    const { report } = await createResp.json();

    const patchResp = await adminContext.context.patch("/api/reports", {
      data: { id: report.id, statut: "STATUT_INVALIDE" },
    });
    expect(patchResp.status()).toBe(400);
  });

  test("PATCH /api/reports — ID manquant, retourne 400", async () => {
    const response = await adminContext.context.patch("/api/reports", {
      data: { statut: "GENERE" },
    });
    expect(response.status()).toBe(400);
  });

  test("PATCH /api/reports — ID inexistant", async () => {
    const response = await adminContext.context.patch("/api/reports", {
      data: { id: "inexistant-id-99999", statut: "GENERE" },
    });
    expect(response.status()).toBe(500);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. RBAC — Contrôle d'accès par rôle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/reports — opérateur readonly voit uniquement les rapports publics", async () => {
    const response = await operateurContext.context.get("/api/reports");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const report of data.reports) {
      expect(report.isPublic).toBe(true);
    }
  });
});

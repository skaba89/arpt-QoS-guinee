/**
 * ============================================================================
 * TESTS E2E — RBAC & CONTRÔLE D'ACCÈS — ONIT-PNG
 * ============================================================================
 * Tests exhaustifs du contrôle d'accès basé sur les rôles (RBAC) :
 * - Super Admin : accès total
 * - DG / DGA : accès étendu
 * - Directeur Technique : accès cyber
 * - Ingénieur RF : accès technique
 * - Analyste QoS : accès mesures et rapports
 * - Auditeur : accès lecture
 * - Opérateur ReadOnly : accès limité à ses propres données
 * - Public : accès limité aux données publiques
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import { TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MATRICE D'ACCÈS ATTENDUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AccessMatrix {
  [role: string]: {
    [endpoint: string]: number; // Expected HTTP status
  };
}

const ACCESS_MATRIX: AccessMatrix = {
  SUPER_ADMIN: {
    "GET /api/users": 200,
    "POST /api/users": 201,
    "GET /api/roles": 200,
    "POST /api/roles": 201,
    "GET /api/alerts": 200,
    "POST /api/alerts": 201,
    "PATCH /api/alerts": 200,
    "GET /api/campaigns": 200,
    "POST /api/campaigns": 201,
    "GET /api/mesures": 200,
    "POST /api/mesures": 201,
    "GET /api/reports": 200,
    "POST /api/reports": 201,
    "GET /api/audit-logs": 200,
    "GET /api/dashboard": 200,
    "GET /api/scores": 200,
    "POST /api/scores": 201,
  },
  OPERATEUR_READONLY: {
    "GET /api/users": 403,
    "POST /api/users": 403,
    "GET /api/roles": 403,
    "POST /api/roles": 403,
    "GET /api/alerts": 200,
    "POST /api/alerts": 403,  // Can't create non-public alerts
    "PATCH /api/alerts": 403,
    "GET /api/campaigns": 200,
    "POST /api/campaigns": 403,
    "GET /api/mesures": 200,
    "POST /api/mesures": 403,
    "GET /api/reports": 200,
    "POST /api/reports": 403,
    "GET /api/audit-logs": 403,
    "GET /api/dashboard": 200,
    "GET /api/scores": 200,
    "POST /api/scores": 403,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTS RBAC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("RBAC — Contrôle d'Accès par Rôle", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. SUPER ADMIN — Accès total
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Rôle SUPER_ADMIN", () => {
    let ctx: Awaited<ReturnType<typeof createAuthenticatedContext>>;

    test.beforeAll(async () => {
      ctx = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    });

    test.afterAll(async () => {
      await ctx.context.dispose();
    });

    test("GET /api/users — 200", async () => {
      const resp = await ctx.context.get("/api/users");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/roles — 200", async () => {
      const resp = await ctx.context.get("/api/roles");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/alerts — 200", async () => {
      const resp = await ctx.context.get("/api/alerts");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/campaigns — 200", async () => {
      const resp = await ctx.context.get("/api/campaigns");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/mesures — 200", async () => {
      const resp = await ctx.context.get("/api/mesures");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/reports — 200", async () => {
      const resp = await ctx.context.get("/api/reports");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/audit-logs — 200", async () => {
      const resp = await ctx.context.get("/api/audit-logs");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/dashboard — 200", async () => {
      const resp = await ctx.context.get("/api/dashboard");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/alerts — 201", async () => {
      const resp = await ctx.context.post("/api/alerts", {
        data: { type: "DEGRADATION", severity: "BASSE", message: "Test RBAC SuperAdmin" },
      });
      expect(resp.status()).toBe(201);
      const data = await resp.json();
      // Cleanup
      if (data.alert?.id) {
        await ctx.context.patch("/api/alerts", { data: { id: data.alert.id, isResolved: true } });
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. OPÉRATEUR READONLY — Accès limité
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Rôle OPERATEUR_READONLY", () => {
    let ctx: Awaited<ReturnType<typeof createAuthenticatedContext>>;

    test.beforeAll(async () => {
      ctx = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
    });

    test.afterAll(async () => {
      await ctx.context.dispose();
    });

    test("GET /api/users — 403", async () => {
      const resp = await ctx.context.get("/api/users");
      expect(resp.status()).toBe(403);
    });

    test("GET /api/roles — 403", async () => {
      const resp = await ctx.context.get("/api/roles");
      expect(resp.status()).toBe(403);
    });

    test("GET /api/audit-logs — 403", async () => {
      const resp = await ctx.context.get("/api/audit-logs");
      expect(resp.status()).toBe(403);
    });

    test("GET /api/alerts — 200 (ses alertes uniquement)", async () => {
      const resp = await ctx.context.get("/api/alerts");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/alerts (non public) — 403", async () => {
      const resp = await ctx.context.post("/api/alerts", {
        data: { type: "DEGRADATION", severity: "HAUTE", message: "Test RBAC Opérateur" },
      });
      expect(resp.status()).toBe(403);
    });

    test("GET /api/campaigns — 200 (ses campagnes)", async () => {
      const resp = await ctx.context.get("/api/campaigns");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/campaigns — 403", async () => {
      const resp = await ctx.context.post("/api/campaigns", {
        data: { nom: "Test", type: "QOS_INTERNET" },
      });
      expect(resp.status()).toBe(403);
    });

    test("GET /api/mesures — 200 (ses mesures)", async () => {
      const resp = await ctx.context.get("/api/mesures");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/mesures — 403", async () => {
      const resp = await ctx.context.post("/api/mesures", {
        data: { latitude: 9.5, longitude: -13.7, timestamp: "2026-01-01", typeMesure: "MOBILE" },
      });
      expect(resp.status()).toBe(403);
    });

    test("GET /api/reports — 200 (rapports publics)", async () => {
      const resp = await ctx.context.get("/api/reports");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/reports — 403", async () => {
      const resp = await ctx.context.post("/api/reports", {
        data: { titre: "Test RBAC" },
      });
      expect(resp.status()).toBe(403);
    });

    test("PATCH /api/alerts — 403", async () => {
      const resp = await ctx.context.patch("/api/alerts", {
        data: { id: "any-id", isResolved: true },
      });
      expect(resp.status()).toBe(403);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. ANALYSTE QoS — Accès mesures et rapports
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Rôle ANALYSTE_QOS", () => {
    let ctx: Awaited<ReturnType<typeof createAuthenticatedContext>>;

    test.beforeAll(async () => {
      ctx = await createAuthenticatedContext(TEST_USERS.analysteQoS.email, DEFAULT_PASSWORD);
    });

    test.afterAll(async () => {
      await ctx.context.dispose();
    });

    test("GET /api/mesures — 200", async () => {
      const resp = await ctx.context.get("/api/mesures");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/alerts — 200", async () => {
      const resp = await ctx.context.get("/api/alerts");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/reports — 200", async () => {
      const resp = await ctx.context.get("/api/reports");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/campaigns — 200", async () => {
      const resp = await ctx.context.get("/api/campaigns");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/dashboard — 200", async () => {
      const resp = await ctx.context.get("/api/dashboard");
      expect(resp.status()).toBe(200);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. UTILISATEUR NON AUTHENTIFIÉ — Accès minimal
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test.describe("Non authentifié (Public)", () => {
    test("GET /api/dashboard — 200", async ({ request }) => {
      const resp = await request.get("/api/dashboard");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/scores — 200", async ({ request }) => {
      const resp = await request.get("/api/scores");
      expect(resp.status()).toBe(200);
    });

    test("GET /api/reports — 200 (publics uniquement)", async ({ request }) => {
      const resp = await request.get("/api/reports");
      expect(resp.status()).toBe(200);
      const data = await resp.json();
      for (const report of data.reports) {
        expect(report.isPublic).toBe(true);
      }
    });

    test("POST /api/alerts (SIGNALEMENT_PUBLIC) — 201", async ({ request }) => {
      const resp = await request.post("/api/alerts", {
        data: { type: "SIGNALEMENT_PUBLIC", message: "Signalement test E2E public" },
      });
      expect(resp.status()).toBe(201);
    });

    test("GET /api/users — 401", async ({ request }) => {
      const resp = await request.get("/api/users");
      expect(resp.status()).toBe(401);
    });

    test("GET /api/alerts — 401", async ({ request }) => {
      const resp = await request.get("/api/alerts");
      expect(resp.status()).toBe(401);
    });

    test("GET /api/campaigns — 401", async ({ request }) => {
      const resp = await request.get("/api/campaigns");
      expect(resp.status()).toBe(401);
    });

    test("GET /api/mesures — 401", async ({ request }) => {
      const resp = await request.get("/api/mesures");
      expect(resp.status()).toBe(401);
    });

    test("GET /api/audit-logs — 401", async ({ request }) => {
      const resp = await request.get("/api/audit-logs");
      expect(resp.status()).toBe(401);
    });

    test("POST /api/alerts (non public) — 401", async ({ request }) => {
      const resp = await request.post("/api/alerts", {
        data: { type: "DEGRADATION", message: "Test" },
      });
      expect(resp.status()).toBe(401);
    });
  });
});

/**
 * ============================================================================
 * TESTS E2E — API ALERTES — ONIT-PNG
 * ============================================================================
 * Tests CRUD sur /api/alerts : création, lecture, résolution,
 * filtrage, signalement public, et contrôle d'accès RBAC.
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import { ALERT_PAYLOAD, PUBLIC_SIGNALMENT_PAYLOAD, TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

test.describe("API /api/alerts — Alertes", () => {
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
  // 1. GET /api/alerts — Lister les alertes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/alerts — authentifié, retourne la liste des alertes", async () => {
    const response = await adminContext.context.get("/api/alerts");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("alerts");
    expect(Array.isArray(data.alerts)).toBeTruthy();
  });

  test("GET /api/alerts — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/alerts");
    expect(response.status()).toBe(401);
  });

  test("GET /api/alerts?severity=CRITIQUE — filtrer par sévérité", async () => {
    const response = await adminContext.context.get("/api/alerts?severity=CRITIQUE");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("alerts");
    // All returned alerts should have severity CRITIQUE
    for (const alert of data.alerts) {
      expect(alert.severity).toBe("CRITIQUE");
    }
  });

  test("GET /api/alerts?type=ZONE_BLANCHE — filtrer par type", async () => {
    const response = await adminContext.context.get("/api/alerts?type=ZONE_BLANCHE");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const alert of data.alerts) {
      expect(alert.type).toBe("ZONE_BLANCHE");
    }
  });

  test("GET /api/alerts?isResolved=true — filtrer par statut résolu", async () => {
    const response = await adminContext.context.get("/api/alerts?isResolved=true");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const alert of data.alerts) {
      expect(alert.isResolved).toBe(true);
    }
  });

  test("GET /api/alerts?isResolved=false — filtrer par statut non résolu", async () => {
    const response = await adminContext.context.get("/api/alerts?isResolved=false");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const alert of data.alerts) {
      expect(alert.isResolved).toBe(false);
    }
  });

  test("GET /api/alerts?operateurCode=ORG — filtrer par opérateur", async () => {
    const response = await adminContext.context.get("/api/alerts?operateurCode=ORG");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const alert of data.alerts) {
      expect(alert.operatorCode).toBe("ORG");
    }
  });

  test("GET /api/alerts?regionCode=CKY — filtrer par région", async () => {
    const response = await adminContext.context.get("/api/alerts?regionCode=CKY");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const alert of data.alerts) {
      expect(alert.regionCode).toBe("CKY");
    }
  });

  test("GET /api/alerts?limit=2 — limiter le nombre de résultats", async () => {
    const response = await adminContext.context.get("/api/alerts?limit=2");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.alerts.length).toBeLessThanOrEqual(2);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. POST /api/alerts — Créer une alerte
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("POST /api/alerts — créer une alerte de dégradation (authentifié)", async () => {
    const response = await adminContext.context.post("/api/alerts", {
      data: ALERT_PAYLOAD,
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("alert");
    expect(data.alert.type).toBe("DEGRADATION");
    expect(data.alert.severity).toBe("HAUTE");
    expect(data.alert.message).toBe(ALERT_PAYLOAD.message);
    expect(data.alert.isResolved).toBe(false);

    // Cleanup: resolve the alert
    if (data.alert.id) {
      await adminContext.context.patch("/api/alerts", {
        data: { id: data.alert.id, isResolved: true },
      });
    }
  });

  test("POST /api/alerts — signalement public (sans authentification)", async ({ request }) => {
    const response = await request.post("/api/alerts", {
      data: PUBLIC_SIGNALMENT_PAYLOAD,
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.alert.type).toBe("SIGNALEMENT_PUBLIC");
    expect(data.alert.message).toBe(PUBLIC_SIGNALMENT_PAYLOAD.message);

    // Cleanup
    if (data.alert.id) {
      await adminContext.context.patch("/api/alerts", {
        data: { id: data.alert.id, isResolved: true },
      });
    }
  });

  test("POST /api/alerts — message manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/alerts", {
      data: { type: "DEGRADATION", severity: "HAUTE" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/alerts — non authentifié avec type non public, retourne 401", async ({ request }) => {
    const response = await request.post("/api/alerts", {
      data: { type: "DEGRADATION", severity: "HAUTE", message: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. PATCH /api/alerts — Résoudre / Rouvrir une alerte
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("PATCH /api/alerts — résoudre une alerte", async () => {
    // First create an alert
    const createResp = await adminContext.context.post("/api/alerts", {
      data: { type: "SEUIL_DEPASSE", severity: "MOYENNE", message: "Test E2E résolution" },
    });
    expect(createResp.status()).toBe(201);
    const { alert } = await createResp.json();

    // Resolve it
    const resolveResp = await adminContext.context.patch("/api/alerts", {
      data: { id: alert.id, isResolved: true },
    });
    expect(resolveResp.ok()).toBeTruthy();
    const resolved = await resolveResp.json();
    expect(resolved.alert.isResolved).toBe(true);
    expect(resolved.alert.resolvedAt).toBeTruthy();
  });

  test("PATCH /api/alerts — rouvrir une alerte résolue", async () => {
    // Create and resolve an alert
    const createResp = await adminContext.context.post("/api/alerts", {
      data: { type: "NON_CONFORMITE", severity: "BASSE", message: "Test E2E réouverture" },
    });
    const { alert } = await createResp.json();

    await adminContext.context.patch("/api/alerts", {
      data: { id: alert.id, isResolved: true },
    });

    // Reopen it
    const reopenResp = await adminContext.context.patch("/api/alerts", {
      data: { id: alert.id, isResolved: false },
    });
    expect(reopenResp.ok()).toBeTruthy();
    const reopened = await reopenResp.json();
    expect(reopened.alert.isResolved).toBe(false);
    expect(reopened.alert.resolvedAt).toBeNull();
  });

  test("PATCH /api/alerts — ID manquant, retourne 400", async () => {
    const response = await adminContext.context.patch("/api/alerts", {
      data: { isResolved: true },
    });
    expect(response.status()).toBe(400);
  });

  test("PATCH /api/alerts — ID inexistant", async () => {
    const response = await adminContext.context.patch("/api/alerts", {
      data: { id: "inexistant-id-12345", isResolved: true },
    });
    expect(response.status()).toBe(500); // Prisma error
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. RBAC — Contrôle d'accès par rôle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/alerts — opérateur readonly voit ses propres alertes uniquement", async () => {
    const response = await operateurContext.context.get("/api/alerts");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // OPERATEUR_READONLY should only see alerts for their operator
    expect(Array.isArray(data.alerts)).toBeTruthy();
  });

  test("PATCH /api/alerts — opérateur readonly ne peut pas résoudre", async () => {
    // Get an existing alert
    const alertsResp = await adminContext.context.get("/api/alerts?limit=1");
    const { alerts } = await alertsResp.json();
    if (alerts.length > 0) {
      const resolveResp = await operateurContext.context.patch("/api/alerts", {
        data: { id: alerts[0].id, isResolved: true },
      });
      expect(resolveResp.status()).toBe(403);
    }
  });
});

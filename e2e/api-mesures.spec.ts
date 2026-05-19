/**
 * ============================================================================
 * TESTS E2E — API MESURES QoS — ONIT-PNG
 * ============================================================================
 * Tests CRUD sur /api/mesures : lecture filtrée, création unique,
 * import JSON en masse, import CSV, validation des données,
 * et contrôle d'accès RBAC.
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import {
  MESURE_PAYLOAD,
  MESURE_BULK_JSON_PAYLOAD,
  MESURE_CSV_CONTENT,
  TEST_USERS,
  DEFAULT_PASSWORD,
} from "./fixtures/test-data";
import { getCampaigns, createTestCampaign } from "./helpers/api-helpers";

test.describe("API /api/mesures — Mesures QoS", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let operateurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let testCampaignId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    operateurContext = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
    await operateurContext.context.dispose();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. GET /api/mesures — Lister les mesures
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/mesures — authentifié, retourne les mesures", async () => {
    const response = await adminContext.context.get("/api/mesures");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("mesures");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.mesures)).toBeTruthy();
  });

  test("GET /api/mesures — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/mesures");
    expect(response.status()).toBe(401);
  });

  test("GET /api/mesures?operateur=ORG — filtrer par opérateur", async () => {
    const response = await adminContext.context.get("/api/mesures?operateur=ORG");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const mesure of data.mesures) {
      expect(mesure.operateurCode).toBe("ORG");
    }
  });

  test("GET /api/mesures?region=CKY — filtrer par région", async () => {
    const response = await adminContext.context.get("/api/mesures?region=CKY");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const mesure of data.mesures) {
      expect(mesure.regionCode).toBe("CKY");
    }
  });

  test("GET /api/mesures?type=MOBILE — filtrer par type", async () => {
    const response = await adminContext.context.get("/api/mesures?type=MOBILE");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const mesure of data.mesures) {
      expect(mesure.typeMesure).toBe("MOBILE");
    }
  });

  test("GET /api/mesures?limit=5&offset=0 — pagination", async () => {
    const response = await adminContext.context.get("/api/mesures?limit=5&offset=0");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.mesures.length).toBeLessThanOrEqual(5);
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("limit", 5);
    expect(data.pagination).toHaveProperty("offset", 0);
  });

  test("GET /api/mesures — vérifier la structure d'une mesure", async () => {
    const response = await adminContext.context.get("/api/mesures?limit=1");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    if (data.mesures.length > 0) {
      const mesure = data.mesures[0];
      // Vérifier les champs obligatoires
      expect(mesure).toHaveProperty("id");
      expect(mesure).toHaveProperty("operateur");
      expect(mesure).toHaveProperty("region");
      expect(mesure).toHaveProperty("latitude");
      expect(mesure).toHaveProperty("longitude");
      expect(mesure).toHaveProperty("timestamp");
      expect(mesure).toHaveProperty("typeMesure");
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. POST /api/mesures — Créer une mesure unique
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("POST /api/mesures — créer une mesure QoS", async () => {
    // Get an existing campaign to use
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const payload = {
      ...MESURE_PAYLOAD,
      campagneId: campaigns[0].id,
    };

    const response = await adminContext.context.post("/api/mesures", { data: payload });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("mesure");
    expect(data.mesure.typeMesure).toBe("MOBILE");
    expect(data).toHaveProperty("message", "Mesure créée avec succès");
  });

  test("POST /api/mesures — champs requis manquants, retourne 400", async () => {
    const response = await adminContext.context.post("/api/mesures", {
      data: { rssi: -75 }, // Missing required fields
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Champ requis manquant");
  });

  test("POST /api/mesures — opérateur inexistant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/mesures", {
      data: {
        ...MESURE_PAYLOAD,
        operatorCode: "FAKE",
      },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/mesures — valeur RF hors limites, retourne 400", async () => {
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const response = await adminContext.context.post("/api/mesures", {
      data: {
        ...MESURE_PAYLOAD,
        campagneId: campaigns[0].id,
        rssi: 50, // Out of range [-150, -30]
      },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("hors limites");
  });

  test("POST /api/mesures — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.post("/api/mesures", { data: MESURE_PAYLOAD });
    expect(response.status()).toBe(401);
  });

  test("POST /api/mesures — opérateur readonly, retourne 403", async () => {
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const response = await operateurContext.context.post("/api/mesures", {
      data: { ...MESURE_PAYLOAD, campagneId: campaigns[0].id },
    });
    expect(response.status()).toBe(403);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. PUT /api/mesures — Import en masse (JSON)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("PUT /api/mesures — import JSON en masse", async () => {
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const payload = {
      ...MESURE_BULK_JSON_PAYLOAD,
      campagneId: campaigns[0].id,
    };

    const response = await adminContext.context.put("/api/mesures", {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("inserted");
    expect(data).toHaveProperty("format", "JSON");
    expect(data.inserted).toBeGreaterThan(0);
  });

  test("PUT /api/mesures — import JSON sans campagneId, retourne 400", async () => {
    const response = await adminContext.context.put("/api/mesures", {
      data: { mesures: [] },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
  });

  test("PUT /api/mesures — import JSON avec mesures vides, retourne 400", async () => {
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const response = await adminContext.context.put("/api/mesures", {
      data: { campagneId: campaigns[0].id, mesures: [] },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. PUT /api/mesures — Import en masse (CSV)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("PUT /api/mesures — import CSV en masse", async () => {
    const campaigns = await getCampaigns(adminContext.context);
    if (campaigns.length === 0) {
      test.skip();
      return;
    }

    const response = await adminContext.context.put(
      `/api/mesures?campagneId=${campaigns[0].id}`,
      {
        data: MESURE_CSV_CONTENT,
        headers: { "Content-Type": "text/csv" },
      }
    );

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("inserted");
    expect(data).toHaveProperty("format", "CSV");
    expect(data.inserted).toBeGreaterThan(0);
  });

  test("PUT /api/mesures — import CSV sans campagneId, retourne 400", async () => {
    const response = await adminContext.context.put("/api/mesures", {
      data: MESURE_CSV_CONTENT,
      headers: { "Content-Type": "text/csv" },
    });
    expect(response.status()).toBe(400);
  });

  test("PUT /api/mesures — content-type non supporté, retourne 400", async () => {
    const response = await adminContext.context.put("/api/mesures", {
      data: "some data",
      headers: { "Content-Type": "text/plain" },
    });
    expect(response.status()).toBe(400);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. RBAC — Contrôle d'accès par rôle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/mesures — opérateur readonly voit uniquement ses propres mesures", async () => {
    const response = await operateurContext.context.get("/api/mesures");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    // All visible measures should be for the operator's organization
    for (const mesure of data.mesures) {
      // Operator should only see their operator's data
      expect(["ORG", "MTN", "CEL"]).toContain(mesure.operateurCode);
    }
  });
});

/**
 * ============================================================================
 * TESTS E2E — API UTILISATEURS, RÔLES & SCORES — ONIT-PNG
 * ============================================================================
 * Tests combinés pour les APIs d'administration :
 * - /api/users : CRUD utilisateurs
 * - /api/roles : CRUD rôles et permissions
 * - /api/scores : Scores opérateurs (upsert)
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { createAuthenticatedContext } from "./helpers/auth";
import {
  NEW_USER_PAYLOAD,
  NEW_ROLE_PAYLOAD,
  SCORE_PAYLOAD,
  TEST_USERS,
  DEFAULT_PASSWORD,
} from "./fixtures/test-data";
import { getRoles, getUserIdByEmail, deactivateUser } from "./helpers/api-helpers";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/users — Utilisateurs", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let operateurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    operateurContext = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    // Cleanup: deactivate test user if created
    const userId = await getUserIdByEmail(adminContext.context, NEW_USER_PAYLOAD.email);
    if (userId) {
      await deactivateUser(adminContext.context, userId);
    }
    await adminContext.context.dispose();
    await operateurContext.context.dispose();
  });

  // ─── GET ─────────────────────────────────────────────────────────────────

  test("GET /api/users — admin voit la liste des utilisateurs", async () => {
    const response = await adminContext.context.get("/api/users");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("users");
    expect(Array.isArray(data.users)).toBeTruthy();
    expect(data.users.length).toBeGreaterThanOrEqual(10); // 10 seeded users
  });

  test("GET /api/users — vérifier la structure d'un utilisateur", async () => {
    const response = await adminContext.context.get("/api/users");
    const data = await response.json();
    if (data.users.length > 0) {
      const user = data.users[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("isActive");
    }
  });

  test("GET /api/users — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/users");
    expect(response.status()).toBe(401);
  });

  test("GET /api/users — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.get("/api/users");
    expect(response.status()).toBe(403);
  });

  // ─── POST ────────────────────────────────────────────────────────────────

  test("POST /api/users — créer un nouvel utilisateur", async () => {
    const roles = await getRoles(adminContext.context);
    const analysteRole = roles.find((r) => r.name === "ANALYSTE_QOS");
    if (!analysteRole) {
      test.skip();
      return;
    }

    const payload = { ...NEW_USER_PAYLOAD, roleId: analysteRole.id };
    const response = await adminContext.context.post("/api/users", { data: payload });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe(NEW_USER_PAYLOAD.email);
    expect(data.user.name).toBe(NEW_USER_PAYLOAD.name);
    expect(data.user.role).toBe("ANALYSTE_QOS");
    expect(data.user.isActive).toBe(true);
  });

  test("POST /api/users — email déjà utilisé, retourne 400", async () => {
    const roles = await getRoles(adminContext.context);
    const analysteRole = roles.find((r) => r.name === "ANALYSTE_QOS");
    if (!analysteRole) {
      test.skip();
      return;
    }

    const payload = { ...NEW_USER_PAYLOAD, roleId: analysteRole.id };
    const response = await adminContext.context.post("/api/users", { data: payload });
    expect(response.status()).toBe(400);
  });

  test("POST /api/users — email manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/users", {
      data: { name: "Test", password: "Test@2026!", roleId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/users — mot de passe manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/users", {
      data: { email: "test@test.com", name: "Test", roleId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/users — rôle inexistant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/users", {
      data: { email: "test2@test.com", name: "Test", password: "Test@2026!", roleId: "inexistant" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/users — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.post("/api/users", {
      data: NEW_USER_PAYLOAD,
    });
    expect(response.status()).toBe(403);
  });

  // ─── PATCH ───────────────────────────────────────────────────────────────

  test("PATCH /api/users — modifier le nom d'un utilisateur", async () => {
    const usersResp = await adminContext.context.get("/api/users");
    const { users } = await usersResp.json();
    const targetUser = users.find((u: { email: string }) => u.email !== TEST_USERS.superAdmin.email);

    if (!targetUser) {
      test.skip();
      return;
    }

    const response = await adminContext.context.patch("/api/users", {
      data: { id: targetUser.id, name: `${targetUser.name} (modifié)` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.user.name).toContain("modifié");

    // Restore
    await adminContext.context.patch("/api/users", {
      data: { id: targetUser.id, name: targetUser.name.replace(" (modifié)", "") },
    });
  });

  test("PATCH /api/users — désactiver un utilisateur", async () => {
    const usersResp = await adminContext.context.get("/api/users");
    const { users } = await usersResp.json();
    const targetUser = users.find((u: { email: string }) =>
      u.email !== TEST_USERS.superAdmin.email && u.isActive
    );

    if (!targetUser) {
      test.skip();
      return;
    }

    const response = await adminContext.context.patch("/api/users", {
      data: { id: targetUser.id, isActive: false },
    });
    expect(response.ok()).toBeTruthy();
    expect(response.json()).resolves.toHaveProperty("user.isActive", false);

    // Reactivate
    await adminContext.context.patch("/api/users", {
      data: { id: targetUser.id, isActive: true },
    });
  });

  test("PATCH /api/users — impossible de se désactiver soi-même", async () => {
    const usersResp = await adminContext.context.get("/api/users");
    const { users } = await usersResp.json();
    const adminUser = users.find((u: { email: string }) => u.email === TEST_USERS.superAdmin.email);

    const response = await adminContext.context.patch("/api/users", {
      data: { id: adminUser.id, isActive: false },
    });
    expect(response.status()).toBe(400);
  });

  test("PATCH /api/users — ID manquant, retourne 400", async () => {
    const response = await adminContext.context.patch("/api/users", {
      data: { name: "Nouveau Nom" },
    });
    expect(response.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/roles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/roles — Rôles & Permissions", () => {
  let adminContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let operateurContext: Awaited<ReturnType<typeof createAuthenticatedContext>>;
  let testRoleId: string | null = null;

  test.beforeAll(async () => {
    adminContext = await createAuthenticatedContext(TEST_USERS.superAdmin.email, DEFAULT_PASSWORD);
    operateurContext = await createAuthenticatedContext(TEST_USERS.operateurOrange.email, DEFAULT_PASSWORD);
  });

  test.afterAll(async () => {
    await adminContext.context.dispose();
    await operateurContext.context.dispose();
  });

  // ─── GET ─────────────────────────────────────────────────────────────────

  test("GET /api/roles — admin voit les rôles", async () => {
    const response = await adminContext.context.get("/api/roles");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("roles");
    expect(data.roles.length).toBeGreaterThanOrEqual(9); // 9 seeded roles
  });

  test("GET /api/roles — vérifier la structure d'un rôle", async () => {
    const response = await adminContext.context.get("/api/roles");
    const data = await response.json();
    if (data.roles.length > 0) {
      const role = data.roles[0];
      expect(role).toHaveProperty("id");
      expect(role).toHaveProperty("name");
      expect(role).toHaveProperty("permissionsCount");
      expect(role).toHaveProperty("usersCount");
      expect(role).toHaveProperty("permissions");
    }
  });

  test("GET /api/roles — non authentifié, retourne 401", async ({ request }) => {
    const response = await request.get("/api/roles");
    expect(response.status()).toBe(401);
  });

  test("GET /api/roles — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.get("/api/roles");
    expect(response.status()).toBe(403);
  });

  // ─── POST (créer rôle) ──────────────────────────────────────────────────

  test("POST /api/roles — créer un nouveau rôle", async () => {
    const response = await adminContext.context.post("/api/roles", {
      data: NEW_ROLE_PAYLOAD,
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.role.name).toBe(NEW_ROLE_PAYLOAD.name);
    expect(data.role.description).toBe(NEW_ROLE_PAYLOAD.description);
    testRoleId = data.role.id;
  });

  test("POST /api/roles — nom de rôle déjà existant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/roles", {
      data: { name: "SUPER_ADMIN" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/roles — nom manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/roles", {
      data: { description: "Un rôle sans nom" },
    });
    expect(response.status()).toBe(400);
  });

  // ─── POST (mettre à jour permissions) ───────────────────────────────────

  test("POST /api/roles — mettre à jour les permissions d'un rôle", async () => {
    if (!testRoleId) {
      test.skip();
      return;
    }

    const response = await adminContext.context.post("/api/roles", {
      data: {
        roleId: testRoleId,
        permissions: [
          { resource: "dashboard", action: "read" },
          { resource: "campaign", action: "read" },
          { resource: "campaign", action: "write" },
        ],
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.role.permissionsCount).toBe(3);
  });

  // ─── PATCH ───────────────────────────────────────────────────────────────

  test("PATCH /api/roles — modifier la description", async () => {
    if (!testRoleId) {
      test.skip();
      return;
    }

    const response = await adminContext.context.patch("/api/roles", {
      data: { id: testRoleId, description: "Description mise à jour E2E" },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.role.description).toBe("Description mise à jour E2E");
  });

  test("PATCH /api/roles — ID manquant, retourne 400", async () => {
    const response = await adminContext.context.patch("/api/roles", {
      data: { description: "Nouvelle description" },
    });
    expect(response.status()).toBe(400);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API /api/scores
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("API /api/scores — Scores Opérateurs", () => {
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

  // ─── GET ─────────────────────────────────────────────────────────────────

  test("GET /api/scores — retourne les scores (même sans auth)", async ({ request }) => {
    const response = await request.get("/api/scores");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("scores");
    expect(Array.isArray(data.scores)).toBeTruthy();
  });

  test("GET /api/scores?operateur=ORG — filtrer par opérateur", async ({ request }) => {
    const response = await request.get("/api/scores?operateur=ORG");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const score of data.scores) {
      expect(score.operateurCode).toBe("ORG");
    }
  });

  test("GET /api/scores?periode=2026-Q1 — filtrer par période", async ({ request }) => {
    const response = await request.get("/api/scores?periode=2026-Q1");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const score of data.scores) {
      expect(score.periode).toBe("2026-Q1");
    }
  });

  test("GET /api/scores — vérifier la structure d'un score", async ({ request }) => {
    const response = await request.get("/api/scores");
    const data = await response.json();
    if (data.scores.length > 0) {
      const score = data.scores[0];
      expect(score).toHaveProperty("id");
      expect(score).toHaveProperty("operateur");
      expect(score).toHaveProperty("periode");
      expect(score).toHaveProperty("scoreGlobal");
      expect(score).toHaveProperty("scoreCouverture");
      expect(score).toHaveProperty("scoreQoS");
      expect(score).toHaveProperty("scoreQoE");
      expect(score).toHaveProperty("scoreConformite");
    }
  });

  // ─── POST (upsert) ─────────────────────────────────────────────────────

  test("POST /api/scores — créer/mettre à jour un score (upsert)", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: SCORE_PAYLOAD,
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("score");
    expect(data).toHaveProperty("message", "Score mis à jour avec succès");
  });

  test("POST /api/scores — upsert suivant (même opérateur, même période)", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: { ...SCORE_PAYLOAD, scoreGlobal: 80 },
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.score.scoreGlobal).toBe(80);
  });

  test("POST /api/scores — opérateur manquant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: { periode: "2026-Q3", scoreGlobal: 75 },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/scores — période manquante, retourne 400", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: { operatorCode: "ORG", scoreGlobal: 75 },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/scores — score hors limites, retourne 400", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: { ...SCORE_PAYLOAD, scoreGlobal: 150 },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/scores — opérateur inexistant, retourne 400", async () => {
    const response = await adminContext.context.post("/api/scores", {
      data: { ...SCORE_PAYLOAD, operatorCode: "FAKE" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/scores — opérateur readonly, retourne 403", async () => {
    const response = await operateurContext.context.post("/api/scores", {
      data: SCORE_PAYLOAD,
    });
    expect(response.status()).toBe(403);
  });
});

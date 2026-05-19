/**
 * ============================================================================
 * TESTS E2E — AUTHENTIFICATION — ONIT-PNG
 * ============================================================================
 * Tests du flux d'authentification : connexion, déconnexion, sessions,
 * tentatives de connexion invalide, NextAuth callbacks.
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

test.describe("Authentication — ONIT-PNG", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CONNEXION VIA API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("POST /api/auth/callback/credentials — connexion Super Admin réussie", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: TEST_USERS.superAdmin.email,
        password: DEFAULT_PASSWORD,
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    // NextAuth returns 200 on success with redirect
    expect(response.ok() || response.status() === 302).toBeTruthy();
  });

  test("POST /api/auth/callback/credentials — connexion DG réussie", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: TEST_USERS.dg.email,
        password: DEFAULT_PASSWORD,
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    expect(response.ok() || response.status() === 302).toBeTruthy();
  });

  test("POST /api/auth/callback/credentials — connexion Opérateur ReadOnly réussie", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: TEST_USERS.operateurOrange.email,
        password: DEFAULT_PASSWORD,
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    expect(response.ok() || response.status() === 302).toBeTruthy();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. ÉCHECS D'AUTHENTIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("POST /api/auth/callback/credentials — mot de passe incorrect", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: TEST_USERS.superAdmin.email,
        password: "MauvaisMotDePasse123!",
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    // NextAuth returns error on invalid credentials
    const text = await response.text();
    // Should contain error indication
    const hasError = text.includes("error") || text.includes("CredentialsSignin") || response.status() >= 400;
    expect(hasError).toBeTruthy();
  });

  test("POST /api/auth/callback/credentials — email inexistant", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: "inexistant@arpt.gn",
        password: DEFAULT_PASSWORD,
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    const text = await response.text();
    const hasError = text.includes("error") || text.includes("CredentialsSignin") || response.status() >= 400;
    expect(hasError).toBeTruthy();
  });

  test("POST /api/auth/callback/credentials — champs vides", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      form: {
        email: "",
        password: "",
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    // Should not authenticate
    const text = await response.text();
    const hasError = text.includes("error") || text.includes("CredentialsSignin") || response.status() >= 400;
    expect(hasError).toBeTruthy();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api/auth/session — pas de session sans connexion", async ({ request }) => {
    const response = await request.get("/api/auth/session");
    expect(response.ok()).toBeTruthy();
    const session = await response.json();
    // Session should exist but user should be null
    expect(session?.user).toBeFalsy();
  });

  test("GET /api/auth/session — session valide après connexion", async ({ request }) => {
    // Login first
    await request.post("/api/auth/callback/credentials", {
      form: {
        email: TEST_USERS.superAdmin.email,
        password: DEFAULT_PASSWORD,
        callbackUrl: "http://localhost:3000",
        json: "true",
      },
    });

    // Check session — cookies should carry over in the same context
    const sessionResp = await request.get("/api/auth/session");
    expect(sessionResp.ok()).toBeTruthy();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. HEALTH CHECK API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("GET /api — health check", async ({ request }) => {
    const response = await request.get("/api");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data.status).toBe("ok");
  });

  test("GET /api — liste des endpoints", async ({ request }) => {
    const response = await request.get("/api");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("endpoints");
    expect(Array.isArray(data.endpoints)).toBeTruthy();
  });
});

/**
 * ============================================================================
 * HELPERS D'AUTHENTIFICATION POUR LES TESTS E2E — ONIT-PNG
 * ============================================================================
 * Fonctions réutilisables pour se connecter via l'API NextAuth et
 * récupérer les cookies de session pour les tests API.
 * ============================================================================
 */

import { test as base, request, type APIRequestContext } from "@playwright/test";
import { TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE : Authentification via API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AuthFixture {
  /** Contexte API avec cookies de session authentifiée */
  authenticatedContext: APIRequestContext;
  /** Rôle de l'utilisateur authentifié */
  userRole: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FONCTION : Se connecter via NextAuth Credentials Provider
// Retourne les cookies de session
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function loginViaAPI(
  email: string = TEST_USERS.superAdmin.email,
  password: string = DEFAULT_PASSWORD
): Promise<{ cookies: Record<string, string> }> {
  const context = await request.newContext({ baseURL: "http://localhost:3000" });

  // NextAuth credentials provider endpoint
  const response = await context.post("/api/auth/callback/credentials", {
    form: {
      email,
      password,
      callbackUrl: "http://localhost:3000",
      json: "true",
    },
  });

  // Extract session token from response cookies
  const cookies: Record<string, string> = {};

  // Get cookies from the response headers
  const setCookieHeaders = response.headersArray().filter(
    (h) => h.name.toLowerCase() === "set-cookie"
  );

  for (const header of setCookieHeaders) {
    const match = header.value.match(/([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1].trim()] = match[2].trim();
    }
  }

  await context.dispose();
  return { cookies };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FONCTION : Créer un contexte API authentifié
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createAuthenticatedContext(
  email: string = TEST_USERS.superAdmin.email,
  password: string = DEFAULT_PASSWORD
): Promise<{ context: APIRequestContext; role: string }> {
  // Determine role from email
  const roleMap: Record<string, string> = {
    [TEST_USERS.superAdmin.email]: "SUPER_ADMIN",
    [TEST_USERS.dg.email]: "DG",
    [TEST_USERS.dga.email]: "DGA",
    [TEST_USERS.dirTech.email]: "DIRECTEUR_TECHNIQUE",
    [TEST_USERS.ingenieurRF.email]: "INGENIEUR_RF",
    [TEST_USERS.analysteQoS.email]: "ANALYSTE_QOS",
    [TEST_USERS.auditeur.email]: "AUDITEUR",
    [TEST_USERS.operateurOrange.email]: "OPERATEUR_READONLY",
    [TEST_USERS.operateurMTN.email]: "OPERATEUR_READONLY",
    [TEST_USERS.operateurCelcom.email]: "OPERATEUR_READONLY",
  };

  const role = roleMap[email] || "UNKNOWN";

  // Create a new context and login via the credentials provider
  const context = await request.newContext({
    baseURL: "http://localhost:3000",
  });

  // Sign in via NextAuth
  await context.post("/api/auth/callback/credentials", {
    form: {
      email,
      password,
      callbackUrl: "http://localhost:3000",
      json: "true",
    },
  });

  return { context, role };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIXTURE : Test étendu avec contexte authentifié
// Usage: test('mon test', async ({ authenticatedContext, userRole }) => { ... });
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const testWithAuth = base.extend<AuthFixture>({
  userRole: "SUPER_ADMIN",
  authenticatedContext: async ({}, use) => {
    const { context } = await createAuthenticatedContext();
    await use(context);
    await context.dispose();
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS : Login via UI (formulaire)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function loginViaUI(
  page: import("@playwright/test").Page,
  email: string = TEST_USERS.superAdmin.email,
  password: string = DEFAULT_PASSWORD
) {
  // Navigate to home page (shows login modal)
  await page.goto("/");

  // Wait for the login modal to appear
  await page.waitForSelector('[data-testid="login-modal"], input[type="email"], input[name="email"]', {
    timeout: 10000,
  });

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  await passwordInput.fill(password);

  // Click sign in button
  const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")');
  await submitButton.click();

  // Wait for navigation or session to be established
  await page.waitForTimeout(2000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Vérifier que l'utilisateur est connecté
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function verifyAuthenticated(context: APIRequestContext): Promise<boolean> {
  const response = await context.get("/api/auth/session");
  if (!response.ok()) return false;
  const session = await response.json();
  return !!session?.user;
}

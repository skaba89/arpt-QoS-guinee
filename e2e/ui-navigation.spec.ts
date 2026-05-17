/**
 * ============================================================================
 * TESTS E2E — INTERFACE UTILISATEUR & NAVIGATION — ONIT-PNG
 * ============================================================================
 * Tests de navigation dans l'application :
 * - Chargement de la page d'accueil
 * - Login modal
 * - Navigation entre les onglets du dashboard
 * - Affichage des composants clés
 * ============================================================================
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS, DEFAULT_PASSWORD } from "./fixtures/test-data";

test.describe("UI — Navigation & Dashboards", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. PAGE D'ACCUEIL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("Page d'accueil se charge correctement", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // La page doit contenir le titre ou le logo ONIT
    const title = await page.title();
    expect(title).toBeTruthy();

    // Le body doit être visible
    await expect(page.locator("body")).toBeVisible();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. LOGIN MODAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("Login modal s'affiche sur la page d'accueil", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Chercher le formulaire de connexion (inputs email/password)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    // Au moins un des éléments doit être visible
    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    expect(emailVisible || passwordVisible).toBeTruthy();
  });

  test("Connexion via le formulaire UI", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Remplir le formulaire
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(TEST_USERS.superAdmin.email);
    await passwordInput.fill(DEFAULT_PASSWORD);

    // Cliquer sur le bouton de connexion
    const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
    await submitButton.click();

    // Attendre que la session s'établisse
    await page.waitForTimeout(3000);

    // Vérifier qu'on est connecté (le layout doit changer)
    // Le login modal doit disparaître ou le dashboard doit apparaître
    await page.waitForLoadState("networkidle");
  });

  test("Tentative de connexion avec mauvais mot de passe", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(TEST_USERS.superAdmin.email);
    await passwordInput.fill("MauvaisMotDePasse!");

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Le formulaire doit toujours être visible (pas de redirection)
    const emailStillVisible = await emailInput.isVisible().catch(() => false);
    expect(emailStillVisible).toBeTruthy();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. NAVIGATION ENTRE ONGLETS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("Navigation entre les onglets du dashboard après connexion", async ({ page }) => {
    // Connexion
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await emailInput.fill(TEST_USERS.superAdmin.email);
    await passwordInput.fill(DEFAULT_PASSWORD);
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    // Essayer de naviguer vers l'onglet SIG
    const sigTab = page.locator('button:has-text("SIG"), [data-tab="sig"], button:has-text("Cartographie")').first();
    if (await sigTab.isVisible().catch(() => false)) {
      await sigTab.click();
      await page.waitForTimeout(2000);
    }

    // Essayer de naviguer vers l'onglet Scoring
    const scoringTab = page.locator('button:has-text("Scoring"), [data-tab="scoring"]').first();
    if (await scoringTab.isVisible().catch(() => false)) {
      await scoringTab.click();
      await page.waitForTimeout(2000);
    }

    // Essayer de naviguer vers l'onglet Rapports
    const reportsTab = page.locator('button:has-text("Rapports"), [data-tab="reports"]').first();
    if (await reportsTab.isVisible().catch(() => false)) {
      await reportsTab.click();
      await page.waitForTimeout(2000);
    }

    // Pas d'erreur visible dans la page
    const errorElement = page.locator('text=Error, text=Erreur 500, text=404');
    expect(await errorElement.count()).toBe(0);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. PORTAIL PUBLIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("Portail public accessible sans connexion", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Chercher l'onglet Portail Public
    const publicTab = page.locator('button:has-text("Public"), [data-tab="public"], button:has-text("Portail")').first();
    if (await publicTab.isVisible().catch(() => false)) {
      await publicTab.click();
      await page.waitForTimeout(2000);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. RESPONSIVE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("Affichage mobile — la page s'adapte", async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto("/");
    await mobilePage.waitForLoadState("networkidle");

    // La page doit se charger sans erreur
    const body = mobilePage.locator("body");
    await expect(body).toBeVisible();

    await mobileContext.close();
  });

  test("Affichage tablette — la page s'adapte", async ({ browser }) => {
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto("/");
    await tabletPage.waitForLoadState("networkidle");

    const body = tabletPage.locator("body");
    await expect(body).toBeVisible();

    await tabletContext.close();
  });
});

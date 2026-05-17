/**
 * ============================================================================
 * HELPERS API POUR LES TESTS E2E — ONIT-PNG
 * ============================================================================
 * Fonctions utilitaires pour interagir avec les APIs ONIT-PNG
 * (créer des entités, nettoyer après les tests, etc.)
 * ============================================================================
 */

import { type APIRequestContext } from "@playwright/test";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Récupérer l'ID d'un opérateur par son code
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getOperatorId(context: APIRequestContext, code: string): Promise<string | null> {
  // Operators are seeded; we can get them from the dashboard API
  const resp = await context.get("/api/dashboard");
  if (!resp.ok()) return null;
  const data = await resp.json();
  const op = data.operators?.find((o: { code: string }) => o.code === code);
  return op?.id || null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Récupérer l'ID d'une région par son code
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getRegionId(context: APIRequestContext, code: string): Promise<string | null> {
  const resp = await context.get("/api/dashboard");
  if (!resp.ok()) return null;
  const data = await resp.json();
  const region = data.regions?.find((r: { code: string }) => r.code === code);
  // Dashboard doesn't return region IDs directly; we need a different approach
  // Use the map API or just use code-based references
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Récupérer les rôles disponibles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getRoles(context: APIRequestContext): Promise<Array<{ id: string; name: string }>> {
  const resp = await context.get("/api/roles");
  if (!resp.ok()) return [];
  const data = await resp.json();
  return data.roles || [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Récupérer les campagnes existantes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getCampaigns(context: APIRequestContext): Promise<Array<{ id: string; name: string; operatorCode: string; region: string }>> {
  const resp = await context.get("/api/campaigns");
  if (!resp.ok()) return [];
  const data = await resp.json();
  return data.campaigns || [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Créer une campagne de test
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createTestCampaign(
  context: APIRequestContext,
  operateurId: string,
  regionId: string
): Promise<string | null> {
  const resp = await context.post("/api/campaigns", {
    data: {
      nom: `Campagne Test E2E ${Date.now()}`,
      type: "QOS_INTERNET",
      operateurId,
      regionId,
      dateDebut: "2026-05-01T00:00:00Z",
      dateFin: "2026-05-31T23:59:59Z",
      responsable: "Test E2E Automatisé",
    },
  });

  if (!resp.ok()) {
    console.error("Failed to create test campaign:", resp.status(), await resp.text());
    return null;
  }

  const data = await resp.json();
  return data.campaign?.id || null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Supprimer une alerte de test (non implémenté dans l'API,
// on peut juste la résoudre)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function resolveAlert(context: APIRequestContext, alertId: string): Promise<boolean> {
  const resp = await context.patch("/api/alerts", {
    data: { id: alertId, isResolved: true },
  });
  return resp.ok();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Récupérer l'ID d'un utilisateur de test pour le nettoyage
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getUserIdByEmail(context: APIRequestContext, email: string): Promise<string | null> {
  const resp = await context.get("/api/users");
  if (!resp.ok()) return null;
  const data = await resp.json();
  const user = data.users?.find((u: { email: string }) => u.email === email);
  return user?.id || null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER : Désactiver un utilisateur de test
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function deactivateUser(context: APIRequestContext, userId: string): Promise<boolean> {
  const resp = await context.patch("/api/users", {
    data: { id: userId, isActive: false },
  });
  return resp.ok();
}

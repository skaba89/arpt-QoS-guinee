// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared API Utilities
// Centralized functions to eliminate code duplication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

// ── HTML Sanitization ──

export function stripHtml(val: string): string {
  return val.replace(/<[^>]*>/g, "");
}

// ── API Key Validation (Secure: validates against DB) ──

const API_KEY_REGEX = /^onit-([A-Z]+)-(.+)$/;

export interface ApiKeyValidationResult {
  valid: boolean;
  operatorCode?: string;
  operatorId?: string;
  error?: string;
}

/**
 * Validates an API key against the database.
 * The key format is: onit-{OPERATOR_CODE}-{secret}
 * The full key is hashed and compared against the stored hash in Operateur.cleApi.
 * Falls back to format-only validation if no cleApi is stored (backward compat).
 */
export async function validateApiKeySecure(
  apiKey: string | null
): Promise<ApiKeyValidationResult> {
  if (!apiKey) {
    return { valid: false, error: "X-API-Key header requis" };
  }

  const match = apiKey.match(API_KEY_REGEX);
  if (!match) {
    return {
      valid: false,
      error:
        "Format de clé API invalide. Format attendu: onit-{OPERATOR_CODE}-{secret}",
    };
  }

  const operatorCode = match[1];

  // Look up operator by code
  const operateur = await db.operateur.findFirst({
    where: { code: operatorCode.toUpperCase() },
    select: { id: true, cleApi: true },
  });

  if (!operateur) {
    return {
      valid: false,
      error: `Opérateur non trouvé: ${operatorCode}`,
    };
  }

  // If operator has a stored API key hash, validate against it
  if (operateur.cleApi) {
    const keyHash = hashApiKey(apiKey);
    if (keyHash !== operateur.cleApi) {
      return {
        valid: false,
        error: "Clé API invalide. Vérifiez vos identifiants prestataire.",
      };
    }
  } else {
    // Backward compatibility: if no cleApi stored, reject (force key rotation)
    return {
      valid: false,
      error: "Clé API non configurée pour cet opérateur. Contactez l'administrateur ARPT.",
    };
  }

  return { valid: true, operatorCode, operatorId: operateur.id };
}

/**
 * Hash an API key using SHA-256 for secure storage and comparison.
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate a secure API key for an operator.
 * Format: onit-{OPERATOR_CODE}-{random32chars}
 */
export function generateApiKey(operatorCode: string): string {
  // Use crypto.randomBytes for cryptographically secure randomness (fix: Math.random is not secure)
  const bytes = randomBytes(24); // 24 bytes = 32 base64 chars
  const secret = bytes.toString("base64url").slice(0, 32);
  return `onit-${operatorCode}-${secret}`;
}

// ── Prestataire Audit Logging ──

export async function logPrestataireAudit(
  action: string,
  resource: string,
  details: string,
  operatorCode: string,
  ipAddress?: string,
  userAgent?: string
) {
  const adminUser = await db.user.findFirst({
    where: { email: "admin@arpt.gn" },
    select: { id: true },
  });

  if (adminUser) {
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: `PRESTATAIRE_${action}`,
        resource,
        details: `operatorCode=${operatorCode} | ${details}`,
        ipAddress,
        userAgent,
      },
    });
  }
}

// ── Resolve Helpers ──

export async function resolveOperatorId(
  codeOrId: string
): Promise<string | null> {
  const byId = await db.operateur.findUnique({ where: { id: codeOrId } });
  if (byId) return byId.id;
  const byCode = await db.operateur.findUnique({
    where: { code: codeOrId.toUpperCase() },
  });
  if (byCode) return byCode.id;
  const byName = await db.operateur.findFirst({
    where: { nom: { contains: codeOrId } },
  });
  return byName?.id || null;
}

export async function resolveRegionId(
  codeOrId: string
): Promise<string | null> {
  const byId = await db.region.findUnique({ where: { id: codeOrId } });
  if (byId) return byId.id;
  const byCode = await db.region.findUnique({
    where: { code: codeOrId.toUpperCase() },
  });
  if (byCode) return byCode.id;
  const byName = await db.region.findFirst({
    where: { nom: { contains: codeOrId } },
  });
  return byName?.id || null;
}

// ── CSV Parsing ──

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function toFloat(val: number | string | null | undefined): number | null {
  if (val == null || val === "" || val === "-") return null;
  const n = typeof val === "number" ? val : parseFloat(val as string);
  return isNaN(n) ? null : n;
}

// ── Rate Limiting (simple in-memory) ──

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

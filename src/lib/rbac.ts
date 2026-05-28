import { db } from "@/lib/db";
import type { RoleType } from "@prisma/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Operator color mapping (presentation concern)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: "#FF7900",
  MTN: "#FFCC00",
  CELCOM: "#00B4D8",
  INTERCEL: "#8B5CF6",
};

export function getOperatorColor(code: string): string {
  return OPERATOR_COLORS[code] || "#6B7280";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Permission check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function checkPermission(
  roleType: RoleType | string,
  resource: string,
  action: string
): Promise<boolean> {
  const role = await db.role.findUnique({
    where: { name: roleType as RoleType },
    include: { permissions: true },
  });
  if (!role) return false;
  return role.permissions.some(
    (p) => p.resource === resource && (p.action === action || p.action === "admin")
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get regions accessible by a user based on RLS
// Returns DATABASE IDs (not codes)
// FIX: Returns region IDs (CUID) instead of region codes
// This fixes the critical RLS bug where regionId filters compared CODES to CUIDs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function getAccessibleRegions(
  roleType: RoleType | string,
  _userId?: string
): Promise<string[]> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource: "campaigns" },
  });

  if (!policy) {
    // SECURITY: Fail-closed — no policy means NO access, not ALL access
    // Previously returned all IDs which was a fail-open vulnerability
    return [];
  }

  if (policy.scope === "all" || policy.scope === "public_only") {
    // Return all region IDs for full access scopes
    const regions = await db.region.findMany({ select: { id: true } });
    return regions.map((r) => r.id);
  }

  if (policy.scope === "own_region" && policy.regions) {
    // Policy stores region CODES (e.g., ["CON", "KIN", "BOK"])
    // We need to resolve them to region IDs for Prisma queries
    try {
      const regionCodes: string[] = JSON.parse(policy.regions);
      // Determine if values are codes or IDs (cuids start with a letter and are ~25 chars)
      const looksLikeIds = regionCodes.length > 0 && regionCodes[0].length > 10;
      if (looksLikeIds) {
        return regionCodes;
      }
      // Resolve codes to IDs
      const regions = await db.region.findMany({
        where: { code: { in: regionCodes.map((v) => v.toUpperCase()) } },
        select: { id: true },
      });
      return regions.map((r) => r.id);
    } catch {
      return [];
    }
  }

  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get operators accessible by a user based on RLS
// Returns DATABASE IDs (not codes)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function getAccessibleOperators(
  roleType: RoleType | string,
  organization?: string
): Promise<string[]> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource: "campaigns" },
  });

  if (!policy) {
    // SECURITY: Fail-closed — no policy means NO access, not ALL access
    // Previously returned all IDs which was a fail-open vulnerability
    return [];
  }

  if (policy.scope === "all" || policy.scope === "public_only") {
    const operators = await db.operateur.findMany({ select: { id: true } });
    return operators.map((o) => o.id);
  }

  if (policy.scope === "own_org" && organization) {
    const op = await db.operateur.findFirst({
      where: { nom: { contains: organization.split(" ")[0] } },
    });
    return op ? [op.id] : [];
  }

  if (policy.operators) {
    try {
      const rawValues: string[] = JSON.parse(policy.operators);
      // Determine if values are codes or IDs
      const looksLikeIds = rawValues.length > 0 && rawValues[0].length > 10;
      if (looksLikeIds) {
        return rawValues;
      }
      // Resolve codes to IDs
      const operators = await db.operateur.findMany({
        where: { code: { in: rawValues.map((v) => v.toUpperCase()) } },
        select: { id: true },
      });
      return operators.map((o) => o.id);
    } catch {
      return [];
    }
  }

  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Filter data by RLS - generic function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function filterDataByRLS<T extends { operateurId?: string; regionId?: string }>(
  data: T[],
  accessibleOperatorIds: string[],
  accessibleRegionIds: string[],
  scope: string
): T[] {
  if (scope === "all") return data;

  return data.filter((item) => {
    const opOk = !item.operateurId || accessibleOperatorIds.includes(item.operateurId);
    const regOk = !item.regionId || accessibleRegionIds.includes(item.regionId);
    return opOk && regOk;
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Create audit log entry
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  details?: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    return await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get RLS scope for a role
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function getRLSScope(
  roleType: RoleType | string,
  resource: string = "campaigns"
): Promise<string> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource },
  });
  return policy?.scope || "public_only";
}

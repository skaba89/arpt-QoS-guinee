import { db } from "@/lib/db";
import type { RoleType } from "@prisma/client";

// Check if a role has permission for a resource+action
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

// Get regions accessible by a user based on RLS
// FIX: Returns region IDs (CUID) instead of region codes
// This fixes the critical RLS bug where regionId filters compared CODES to CUIDs
export async function getAccessibleRegions(
  roleType: RoleType | string,
  _userId?: string
): Promise<string[]> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource: "campaigns" },
  });

  if (!policy) {
    // If no policy, return all region IDs
    const regions = await db.region.findMany({ select: { id: true } });
    return regions.map((r) => r.id);
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
      const regions = await db.region.findMany({
        where: { code: { in: regionCodes } },
        select: { id: true },
      });
      return regions.map((r) => r.id);
    } catch {
      return [];
    }
  }

  return [];
}

// Get operators accessible by a user based on RLS
export async function getAccessibleOperators(
  roleType: RoleType | string,
  organization?: string
): Promise<string[]> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource: "campaigns" },
  });

  if (!policy) {
    // If no policy, return all operator IDs
    const operators = await db.operateur.findMany({ select: { id: true } });
    return operators.map((o) => o.id);
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
      // Operators are already stored as IDs in the policy
      return JSON.parse(policy.operators);
    } catch {
      return [];
    }
  }

  return [];
}

// Filter data by RLS - generic function
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

// Create audit log entry
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  details?: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  return db.auditLog.create({
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
}

// Get RLS scope for a role
export async function getRLSScope(
  roleType: RoleType | string,
  resource: string = "campaigns"
): Promise<string> {
  const policy = await db.dataAccessPolicy.findFirst({
    where: { roleType: roleType as RoleType, resource },
  });
  return policy?.scope || "public_only";
}

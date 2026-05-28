import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit } from "@/lib/rbac";
import { checkRateLimit, stripHtml } from "@/lib/utils-api";
import { z } from "zod";
import type { RoleType } from "@prisma/client";

// ── Zod Schemas ──

const createRoleSchema = z.object({
  name: z.string().min(1).max(50).transform(stripHtml),
  description: z.string().max(500).optional().transform(v => v ? stripHtml(v) : v),
  permissions: z.array(z.object({
    resource: z.string().min(1).max(50).transform(stripHtml),
    action: z.string().min(1).max(50).transform(stripHtml),
  })).optional(),
});

const updateRolePermissionsSchema = z.object({
  roleId: z.string().min(1).max(50).transform(stripHtml),
  permissions: z.array(z.object({
    resource: z.string().min(1).max(50).transform(stripHtml),
    action: z.string().min(1).max(50).transform(stripHtml),
  })).min(1),
});

const patchRoleSchema = z.object({
  id: z.string().min(1, "ID rôle requis").max(50).transform(stripHtml),
  name: z.string().min(1).max(50).transform(stripHtml).optional(),
  description: z.string().max(500).optional().transform(v => v ? stripHtml(v) : v),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/roles — List roles with permission counts
// Requires role:read or user:admin permission
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const canRead = await checkPermission(userRole, "role", "read") ||
                    await checkPermission(userRole, "user", "admin") ||
                    await checkPermission(userRole, "role", "admin");

    if (!canRead) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const roles = await db.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissionsCount: r.permissions.length,
      usersCount: r._count.users,
      permissions: r.permissions.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
      })),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ roles: result });
  } catch (error) {
    console.error("Roles API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/roles — Create a new role or update permissions
// Body (create role): { name, description? }
// Body (update permissions): { roleId, permissions: [{ resource, action }] }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`roles-post:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "role", "write") ||
                     await checkPermission(userRole, "role", "admin") ||
                     await checkPermission(userRole, "user", "admin");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const rawBody = await request.json();

    // Mode 1: Update permissions for an existing role
    if (rawBody.roleId && rawBody.permissions && Array.isArray(rawBody.permissions)) {
      const parsed = updateRolePermissionsSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const body = parsed.data;

      // Delete existing permissions and recreate
      await db.permission.deleteMany({ where: { roleId: body.roleId } });

      await db.permission.createMany({
        data: body.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
          roleId: body.roleId,
        })),
      });

      const updatedRole = await db.role.findUnique({
        where: { id: body.roleId },
        include: { permissions: true, _count: { select: { users: true } } },
      });

      await logAudit(userId, "UPDATE", "role_permissions", JSON.stringify({ roleId: body.roleId, count: body.permissions.length }), body.roleId);

      return NextResponse.json({
        role: {
          id: updatedRole!.id,
          name: updatedRole!.name,
          description: updatedRole!.description,
          permissionsCount: updatedRole!.permissions.length,
          usersCount: updatedRole!._count.users,
          permissions: updatedRole!.permissions.map((p) => ({ id: p.id, resource: p.resource, action: p.action })),
        },
      });
    }

    // Mode 2: Create a new role
    const parsed = createRoleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Check if role name already exists
    const existing = await db.role.findUnique({ where: { name: body.name as RoleType } });
    if (existing) {
      return NextResponse.json({ error: "Un rôle avec ce nom existe déjà" }, { status: 400 });
    }

    const role = await db.role.create({
      data: {
        name: body.name as RoleType,
        description: body.description,
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    // Create permissions if provided
    if (body.permissions && body.permissions.length > 0) {
      await db.permission.createMany({
        data: body.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
          roleId: role.id,
        })),
      });
    }

    await logAudit(userId, "CREATE", "role", JSON.stringify({ name: body.name }), role.id);

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissionsCount: role.permissions.length,
        usersCount: role._count.users,
        permissions: role.permissions.map((p) => ({ id: p.id, resource: p.resource, action: p.action })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Roles POST API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/roles — Update role description
// Body: { id, description? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`roles-post:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "role", "write") ||
                     await checkPermission(userRole, "role", "admin") ||
                     await checkPermission(userRole, "user", "admin");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = patchRoleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    const role = await db.role.update({
      where: { id: body.id },
      data: updateData,
      include: { permissions: true, _count: { select: { users: true } } },
    });

    await logAudit(userId, "UPDATE", "role", JSON.stringify(updateData), role.id);

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissionsCount: role.permissions.length,
        usersCount: role._count.users,
      },
    });
  } catch (error) {
    console.error("Roles PATCH API error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

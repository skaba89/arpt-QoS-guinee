import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getRLSScope } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/utils-api";
import { z } from "zod";

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

const updateUserSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200).transform(stripHtml).optional(),
  email: z.string().email("Email invalide").max(200).transform(stripHtml).optional(),
  roleId: z.string().max(50).transform(stripHtml).optional(),
  organization: z.string().max(200).transform(stripHtml).optional(),
  isActive: z.boolean().optional(),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/users/[id] — Get a single user by ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const canRead = await checkPermission(userRole, "user", "read");
    if (!canRead) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Strip password hash
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/users/[id] — Update a user by ID
// Protected against mass assignment (only specific fields allowed)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`users-id:${ip}`, 15, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const currentUserId = (session.user as Record<string, unknown>).id as string;

    const canAdmin = await checkPermission(userRole, "user", "admin");
    const canWrite = await checkPermission(userRole, "user", "write");

    if (!canAdmin && !canWrite) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — user:admin ou user:write requis" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Read body ONCE (fix: double body read bug)
    const rawBody = await request.json();

    // Prevent self-deactivation
    if (id === currentUserId) {
      if (rawBody.isActive === false) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas désactiver votre propre compte" },
          { status: 400 }
        );
      }
      if (rawBody.roleId) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas modifier votre propre rôle" },
          { status: 400 }
        );
      }
    }

    // Only SUPER_ADMIN can change roles
    if (rawBody.roleId && !canAdmin) {
      return NextResponse.json(
        { error: "Seul un SUPER_ADMIN peut modifier les rôles" },
        { status: 403 }
      );
    }

    const parsed = updateUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Check email uniqueness if changing
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({ where: { email: body.email } });
      if (emailExists) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Check role exists if changing
    if (body.roleId) {
      const roleExists = await db.role.findUnique({ where: { id: body.roleId } });
      if (!roleExists) {
        return NextResponse.json(
          { error: "Rôle non trouvé" },
          { status: 400 }
        );
      }
    }

    // Build update data (mass assignment protection — only validated fields)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.roleId !== undefined) updateData.roleId = body.roleId;
    if (body.organization !== undefined) updateData.organization = body.organization;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    await logAudit(
      currentUserId,
      "UPDATE",
      "user",
      JSON.stringify({ updatedFields: Object.keys(updateData), targetEmail: existingUser.email }),
      id,
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    // Strip password hash
    const { passwordHash: _, ...safeUser } = updatedUser;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/users/[id] — Deactivate a user (soft delete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`users-id:${ip}`, 15, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const currentUserId = (session.user as Record<string, unknown>).id as string;

    const canDelete = await checkPermission(userRole, "user", "delete");
    if (!canDelete) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — user:delete requis" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas désactiver votre propre compte" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Soft delete — deactivate instead of actual deletion
    const deactivatedUser = await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit(
      currentUserId,
      "DELETE",
      "user",
      `Désactivation du compte ${user.email}`,
      id,
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      message: `Utilisateur ${user.email} désactivé`,
      userId: id,
    });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

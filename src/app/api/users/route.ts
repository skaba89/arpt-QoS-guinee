import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit } from "@/lib/rbac";
import { z } from "zod";

// ── Zod Schemas ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

const createUserSchema = z.object({
  email: z.string().email("Email invalide").max(254).transform(stripHtml),
  name: z.string().min(1, "Nom requis").max(100).transform(stripHtml),
  password: z.string().min(8, "Mot de passe trop court (min 8)").max(128),
  roleId: z.string().min(1, "Rôle requis").max(50).transform(stripHtml),
  organization: z.string().max(100).optional().default("").transform(stripHtml),
});

const updateUserSchema = z.object({
  id: z.string().min(1, "ID utilisateur requis").max(50).transform(stripHtml),
  name: z.string().max(100).transform(stripHtml).optional(),
  roleId: z.string().max(50).transform(stripHtml).optional(),
  organization: z.string().max(100).transform(stripHtml).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/users — List users (admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const isAdmin = await checkPermission(userRole, "user", "admin") ||
                    await checkPermission(userRole, "user", "read");

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const users = await db.user.findMany({
      include: { role: { include: { permissions: true } } },
      orderBy: { createdAt: "desc" },
    });

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role.name,
      roleId: u.roleId,
      organization: u.organization,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/users — Create a new user
// Body: { email, name, password, roleId, organization? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const isAdmin = await checkPermission(userRole, "user", "admin");

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = createUserSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }

    // Validate role exists
    const role = await db.role.findUnique({ where: { id: body.roleId } });
    if (!role) {
      return NextResponse.json({ error: "Rôle non trouvé" }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(body.password, 12);

    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: hash,
        roleId: body.roleId,
        organization: body.organization,
      },
      include: { role: true },
    });

    await logAudit(userId, "CREATE", "user", JSON.stringify({ email: body.email, name: body.name, role: role.name }), user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        roleId: user.roleId,
        organization: user.organization,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/users — Update a user
// Body: { id, name?, roleId?, organization?, isActive?, password? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const adminUserId = (session.user as Record<string, unknown>).id as string;
    const isAdmin = await checkPermission(userRole, "user", "admin");

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = updateUserSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, name, roleId, organization, isActive, password } = parsed.data;

    // Prevent deactivating yourself
    if (id === adminUserId && isActive === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte" }, { status: 400 });
    }

    // Prevent removing your own admin role
    if (id === adminUserId && roleId) {
      const currentAdminRole = await db.role.findFirst({
        where: { id: (session.user as Record<string, unknown>).roleId as string },
      });
      if (currentAdminRole?.name === "SUPER_ADMIN" && roleId !== currentAdminRole.id) {
        return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, { status: 400 });
      }
    }

    // Validate role if changing
    if (roleId) {
      const role = await db.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json({ error: "Rôle non trouvé" }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (organization !== undefined) updateData.organization = organization;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle password change separately
    if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    const changesDesc = Object.keys(updateData)
      .filter((k) => k !== "passwordHash")
      .map((k) => `${k}=${updateData[k]}`)
      .join(", ");

    await logAudit(
      adminUserId,
      "UPDATE",
      "user",
      JSON.stringify({ action: changesDesc || "password_change", targetUserId: id }),
      id
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        roleId: user.roleId,
        organization: user.organization,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update user API error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

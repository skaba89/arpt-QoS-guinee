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

const toggleUserSchema = z.object({
  id: z.string().min(1, "ID utilisateur requis").max(50).transform(stripHtml),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const isAdmin = await checkPermission(userRole, "user", "admin");

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
    });

    await logAudit(userId, "CREATE", "user", JSON.stringify({ email: body.email, name: body.name, role: body.roleId }), user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        organization: user.organization,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
    const parsed = toggleUserSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, isActive } = parsed.data;

    // Prevent deactivating yourself
    if (id === adminUserId && isActive === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: isActive },
    });

    await logAudit(adminUserId, "UPDATE", "user", JSON.stringify({ action: isActive ? "activate" : "deactivate", targetUserId: id }), id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
      }
    });
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

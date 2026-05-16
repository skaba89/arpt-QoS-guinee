import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/rbac";

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
    const isAdmin = await checkPermission(userRole, "user", "admin");

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
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

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

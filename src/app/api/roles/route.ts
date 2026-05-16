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

    const roles = await db.role.findMany({
      include: { permissions: true },
      orderBy: { name: "asc" },
    });

    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissionsCount: r.permissions.length,
    }));

    return NextResponse.json({ roles: result });
  } catch (error) {
    console.error("Roles API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

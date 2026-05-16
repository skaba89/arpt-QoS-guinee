import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRLSScope, logAudit, checkPermission } from "@/lib/rbac";
import type { RoleType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const scope = await getRLSScope(userRole as RoleType, "reports");

    const reports = await db.rapport.findMany({
      where: scope === "public_only" ? { isPublic: true } : {},
      orderBy: { createdAt: "desc" },
    });

    const result = reports.map((r) => ({
      id: r.id,
      titre: r.titre,
      type: r.type,
      format: r.format,
      date: r.createdAt.toISOString().split("T")[0],
      size: r.format === "PDF" ? `${(Math.random() * 5 + 1).toFixed(1)} MB` : `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      statut: r.statut === "PUBLIE" ? "ready" : r.statut === "GENERE" ? "ready" : "generating",
      isPublic: r.isPublic,
    }));

    return NextResponse.json({ reports: result });
  } catch (error) {
    console.error("Reports API error:", error);
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

    const canWrite = await checkPermission(userRole, "rapport", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();
    const report = await db.rapport.create({
      data: {
        titre: body.titre,
        type: body.type || "INTERNE",
        format: body.format || "PDF",
        generePar: userId,
        statut: "GENERE",
        isPublic: body.isPublic || false,
      },
    });

    await logAudit(userId, "CREATE", "rapport", JSON.stringify({ titre: body.titre }), report.id);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Create report API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

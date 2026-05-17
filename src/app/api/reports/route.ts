import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRLSScope, logAudit, checkPermission } from "@/lib/rbac";
import type { RoleType } from "@prisma/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/reports — List reports (RLS-filtered)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user ? ((session.user as Record<string, unknown>).role as string) : "PUBLIC";
    const scope = await getRLSScope(userRole as RoleType, "reports");

    const reports = await db.rapport.findMany({
      where: scope === "public_only" ? { isPublic: true } : {},
      include: { campagne: true },
      orderBy: { createdAt: "desc" },
    });

    const result = reports.map((r) => {
      // Calculate size from contenu length instead of random values
      let size = "—";
      if (r.contenu) {
        const bytes = new TextEncoder().encode(r.contenu).length;
        if (bytes > 1048576) {
          size = `${(bytes / 1048576).toFixed(1)} MB`;
        } else if (bytes > 1024) {
          size = `${(bytes / 1024).toFixed(1)} KB`;
        } else {
          size = `${bytes} B`;
        }
      } else if (r.fichierUrl) {
        // Estimate size based on format if file exists but no content stored
        size = r.format === "PDF" ? "2.5 MB" : r.format === "XLSX" ? "1.2 MB" : "500 KB";
      }

      return {
        id: r.id,
        titre: r.titre,
        type: r.type,
        date: r.createdAt.toISOString().split("T")[0],
        format: r.format,
        size,
        statut: r.statut === "PUBLIE" || r.statut === "GENERE" ? "ready" : r.statut === "EN_COURS" ? "generating" : "scheduled",
        isPublic: r.isPublic,
        campagneId: r.campagneId,
        campagneNom: r.campagne?.nom,
      };
    });

    return NextResponse.json({ reports: result });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/reports — Create a report
// Body: { titre, type?, format?, campagneId?, isPublic?, contenu? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    // Validate required fields
    if (!body.titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const report = await db.rapport.create({
      data: {
        titre: body.titre,
        type: body.type || "INTERNE",
        format: body.format || "PDF",
        campagneId: body.campagneId || null,
        contenu: body.contenu || null,
        generePar: userId,
        statut: body.contenu ? "GENERE" : "PLANIFIE",
        isPublic: body.isPublic || false,
      },
      include: { campagne: true },
    });

    await logAudit(userId, "CREATE", "rapport", JSON.stringify({ titre: body.titre, type: body.type }), report.id);

    // Calculate size for response
    let size = "—";
    if (report.contenu) {
      const bytes = new TextEncoder().encode(report.contenu).length;
      if (bytes > 1048576) size = `${(bytes / 1048576).toFixed(1)} MB`;
      else if (bytes > 1024) size = `${(bytes / 1024).toFixed(1)} KB`;
      else size = `${bytes} B`;
    }

    return NextResponse.json({
      report: {
        id: report.id,
        titre: report.titre,
        type: report.type,
        date: report.createdAt.toISOString().split("T")[0],
        format: report.format,
        size,
        statut: report.statut === "GENERE" || report.statut === "PUBLIE" ? "ready" : "generating",
        isPublic: report.isPublic,
        campagneId: report.campagneId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create report API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/reports — Update report status or content
// Body: { id, statut?, contenu?, isPublic? }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function PATCH(request: Request) {
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
    if (!body.id) {
      return NextResponse.json({ error: "ID rapport requis" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.statut !== undefined) {
      const validStatuses = ["PLANIFIE", "EN_COURS", "GENERE", "PUBLIE", "ARCHIVE"];
      if (!validStatuses.includes(body.statut)) {
        return NextResponse.json({ error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(", ")}` }, { status: 400 });
      }
      updateData.statut = body.statut;
    }
    if (body.contenu !== undefined) {
      updateData.contenu = body.contenu;
    }
    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic;
    }
    if (body.titre !== undefined) {
      updateData.titre = body.titre;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    const report = await db.rapport.update({
      where: { id: body.id },
      data: updateData,
    });

    await logAudit(userId, "UPDATE", "rapport", JSON.stringify(updateData), report.id);

    // Calculate size for response
    let size = "—";
    if (report.contenu) {
      const bytes = new TextEncoder().encode(report.contenu).length;
      if (bytes > 1048576) size = `${(bytes / 1048576).toFixed(1)} MB`;
      else if (bytes > 1024) size = `${(bytes / 1024).toFixed(1)} KB`;
      else size = `${bytes} B`;
    }

    return NextResponse.json({
      report: {
        id: report.id,
        titre: report.titre,
        type: report.type,
        date: report.createdAt.toISOString().split("T")[0],
        format: report.format,
        size,
        statut: report.statut === "GENERE" || report.statut === "PUBLIE" ? "ready" : "generating",
        isPublic: report.isPublic,
      },
    });
  } catch (error) {
    console.error("Update report API error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Rapport non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

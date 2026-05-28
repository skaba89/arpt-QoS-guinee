import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";
import { stripHtml, checkRateLimit } from "@/lib/utils-api";
import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/measurements — List measurements with RLS filtering
// Alias of /api/mesures with campaign detail included
// Note: Does NOT log every READ (unlike previous version) to avoid audit noise
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;
    const scope = await getRLSScope(userRole);
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);

    const url = new URL(request.url);
    const operateurId = url.searchParams.get("operateurId");
    const regionId = url.searchParams.get("regionId");
    const campagneId = url.searchParams.get("campagneId");
    const typeMesure = url.searchParams.get("typeMesure");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

    const measurements = await db.mesureQoS.findMany({
      where: {
        ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
        ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
        ...(operateurId ? { operateurId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(campagneId ? { campagneId } : {}),
        ...(typeMesure ? { typeMesure } : {}),
      },
      include: { operateur: true, region: true, campagne: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const result = measurements.map((m) => ({
      id: m.id,
      campaign: m.campagne.nom,
      operator: m.operateur.nom,
      operatorCode: m.operateur.code,
      region: m.region.nom,
      regionCode: m.region.code,
      latitude: m.latitude,
      longitude: m.longitude,
      timestamp: m.timestamp,
      typeMesure: m.typeMesure,
      rssi: m.rssi,
      rsrp: m.rsrp,
      rsrq: m.rsrq,
      sinr: m.sinr,
      debitDescendant: m.debitDescendant,
      debitMontant: m.debitMontant,
      latence: m.latence,
      gigue: m.gigue,
      tauxAppelReussi: m.tauxAppelReussi,
      tauxDropCall: m.tauxDropCall,
      debitDownload: m.debitDownload,
      debitUpload: m.debitUpload,
      ping: m.ping,
      dnsLookupTime: m.dnsLookupTime,
      tcpConnectTime: m.tcpConnectTime,
      scoreQoE: m.scoreQoE,
      pageLoadTime: m.pageLoadTime,
      videoBuffering: m.videoBuffering,
    }));

    // Note: Removed per-READ audit logging to reduce noise and DB load
    // Only mutations (CREATE/UPDATE/DELETE) are audit-logged

    return NextResponse.json({ measurements: result, total: result.length });
  } catch (error) {
    console.error("Measurements API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/measurements — Create a single measurement with Zod validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const createMeasurementSchema = z.object({
  campagneId: z.string().min(1).max(50).transform(stripHtml),
  operateurId: z.string().min(1).max(50).transform(stripHtml),
  regionId: z.string().min(1).max(50).transform(stripHtml),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timestamp: z.string().max(50).optional(),
  typeMesure: z.string().min(1).max(50).transform(stripHtml),
  rssi: z.coerce.number().min(-150).max(-30).optional(),
  rsrp: z.coerce.number().min(-140).max(-44).optional(),
  rsrq: z.coerce.number().min(-20).max(-3).optional(),
  sinr: z.coerce.number().min(-20).max(30).optional(),
  debitDescendant: z.coerce.number().min(0).max(100000).optional(),
  debitMontant: z.coerce.number().min(0).max(100000).optional(),
  latence: z.coerce.number().min(0).max(5000).optional(),
  gigue: z.coerce.number().min(0).max(5000).optional(),
  tauxAppelReussi: z.coerce.number().min(0).max(100).optional(),
  tauxDropCall: z.coerce.number().min(0).max(100).optional(),
  debitDownload: z.coerce.number().min(0).max(100000).optional(),
  debitUpload: z.coerce.number().min(0).max(100000).optional(),
  ping: z.coerce.number().min(0).max(5000).optional(),
  dnsLookupTime: z.coerce.number().min(0).max(5000).optional(),
  tcpConnectTime: z.coerce.number().min(0).max(5000).optional(),
  scoreQoE: z.coerce.number().min(0).max(100).optional(),
  pageLoadTime: z.coerce.number().min(0).max(60000).optional(),
  videoBuffering: z.coerce.number().min(0).max(60000).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`measurements-post:${ip}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    // Use centralized permission check — no more hardcoded allowedRoles fallback
    const canWrite = await checkPermission(userRole, "campaign", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = createMeasurementSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const measurement = await db.mesureQoS.create({
      data: {
        campagneId: body.campagneId,
        operateurId: body.operateurId,
        regionId: body.regionId,
        latitude: body.latitude,
        longitude: body.longitude,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        typeMesure: body.typeMesure,
        rssi: body.rssi ?? null,
        rsrp: body.rsrp ?? null,
        rsrq: body.rsrq ?? null,
        sinr: body.sinr ?? null,
        debitDescendant: body.debitDescendant ?? null,
        debitMontant: body.debitMontant ?? null,
        latence: body.latence ?? null,
        gigue: body.gigue ?? null,
        tauxAppelReussi: body.tauxAppelReussi ?? null,
        tauxDropCall: body.tauxDropCall ?? null,
        debitDownload: body.debitDownload ?? null,
        debitUpload: body.debitUpload ?? null,
        ping: body.ping ?? null,
        dnsLookupTime: body.dnsLookupTime ?? null,
        tcpConnectTime: body.tcpConnectTime ?? null,
        scoreQoE: body.scoreQoE ?? null,
        pageLoadTime: body.pageLoadTime ?? null,
        videoBuffering: body.videoBuffering ?? null,
      },
    });

    await logAudit(userId, "CREATE", "measurement", JSON.stringify({ campagneId: body.campagneId, operateurId: body.operateurId }), measurement.id);

    return NextResponse.json({ measurement, success: true }, { status: 201 });
  } catch (error) {
    console.error("Create measurement API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

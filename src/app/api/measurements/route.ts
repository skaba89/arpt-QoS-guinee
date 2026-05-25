import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";

// GET /api/measurements — List measurements with RLS filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const scope = await getRLSScope(userRole);
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);

    const url = new URL(request.url);
    const operateurId = url.searchParams.get("operateurId");
    const regionId = url.searchParams.get("regionId");
    const campagneId = url.searchParams.get("campagneId");
    const typeMesure = url.searchParams.get("typeMesure");
    const limit = parseInt(url.searchParams.get("limit") || "100");

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

    await logAudit(userId, "READ", "measurements");

    return NextResponse.json({ measurements: result, total: result.length });
  } catch (error) {
    console.error("Measurements API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/measurements — Create a single measurement
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "measurement", "write");
    if (!canWrite) {
      // Also allow INGENIEUR_RF and ANALYSTE_QOS by default
      const allowedRoles = ["SUPER_ADMIN", "DG", "DIRECTEUR_TECHNIQUE", "INGENIEUR_RF", "ANALYSTE_QOS"];
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
      }
    }

    const body = await request.json();

    // Validate required fields
    if (!body.campagneId || !body.operateurId || !body.regionId || !body.latitude || !body.longitude || !body.typeMesure) {
      return NextResponse.json(
        { error: "Champs requis manquants: campagneId, operateurId, regionId, latitude, longitude, typeMesure" },
        { status: 400 }
      );
    }

    const measurement = await db.mesureQoS.create({
      data: {
        campagneId: body.campagneId,
        operateurId: body.operateurId,
        regionId: body.regionId,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        typeMesure: body.typeMesure,
        rssi: body.rssi != null ? parseFloat(body.rssi) : null,
        rsrp: body.rsrp != null ? parseFloat(body.rsrp) : null,
        rsrq: body.rsrq != null ? parseFloat(body.rsrq) : null,
        sinr: body.sinr != null ? parseFloat(body.sinr) : null,
        debitDescendant: body.debitDescendant != null ? parseFloat(body.debitDescendant) : null,
        debitMontant: body.debitMontant != null ? parseFloat(body.debitMontant) : null,
        latence: body.latence != null ? parseFloat(body.latence) : null,
        gigue: body.gigue != null ? parseFloat(body.gigue) : null,
        tauxAppelReussi: body.tauxAppelReussi != null ? parseFloat(body.tauxAppelReussi) : null,
        tauxDropCall: body.tauxDropCall != null ? parseFloat(body.tauxDropCall) : null,
        debitDownload: body.debitDownload != null ? parseFloat(body.debitDownload) : null,
        debitUpload: body.debitUpload != null ? parseFloat(body.debitUpload) : null,
        ping: body.ping != null ? parseFloat(body.ping) : null,
        dnsLookupTime: body.dnsLookupTime != null ? parseFloat(body.dnsLookupTime) : null,
        tcpConnectTime: body.tcpConnectTime != null ? parseFloat(body.tcpConnectTime) : null,
        scoreQoE: body.scoreQoE != null ? parseFloat(body.scoreQoE) : null,
        pageLoadTime: body.pageLoadTime != null ? parseFloat(body.pageLoadTime) : null,
        videoBuffering: body.videoBuffering != null ? parseFloat(body.videoBuffering) : null,
      },
    });

    await logAudit(userId, "CREATE", "measurement", JSON.stringify({ campagneId: body.campagneId, operateurId: body.operateurId }), measurement.id);

    return NextResponse.json({ measurement, success: true });
  } catch (error) {
    console.error("Create measurement API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

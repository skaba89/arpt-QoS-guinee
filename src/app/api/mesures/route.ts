import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/mesures — List QoS measurements (RLS-filtered)
// Query params: operateur, region, type, campagneId, limit, offset
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userOrg = (session.user as Record<string, unknown>).organization as string;

    const scope = await getRLSScope(userRole, "campaigns");
    const accessibleOpIds = await getAccessibleOperators(userRole, userOrg);
    const accessibleRegIds = await getAccessibleRegions(userRole);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const operateurCode = searchParams.get("operateur");
    const regionCode = searchParams.get("region");
    const type = searchParams.get("type");
    const campagneId = searchParams.get("campagneId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 5000);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, unknown> = {
      ...(scope !== "all" ? { operateurId: { in: accessibleOpIds } } : {}),
      ...(scope !== "all" ? { regionId: { in: accessibleRegIds } } : {}),
    };

    // Filter by operator code
    if (operateurCode) {
      const op = await db.operateur.findFirst({ where: { code: operateurCode.toUpperCase() } });
      if (op) where.operateurId = op.id;
    }

    // Filter by region code
    if (regionCode) {
      const reg = await db.region.findFirst({ where: { code: regionCode.toUpperCase() } });
      if (reg) where.regionId = reg.id;
    }

    // Filter by measurement type
    if (type) {
      where.typeMesure = type;
    }

    // Filter by campaign
    if (campagneId) {
      where.campagneId = campagneId;
    }

    const [mesures, total] = await Promise.all([
      db.mesureQoS.findMany({
        where,
        include: { operateur: true, region: true, campagne: true },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      db.mesureQoS.count({ where }),
    ]);

    const result = mesures.map((m) => ({
      id: m.id,
      // Identifiers
      operateur: m.operateur.nom,
      operateurCode: m.operateur.code,
      region: m.region.nom,
      regionCode: m.region.code,
      campagne: m.campagne?.nom,
      typeMesure: m.typeMesure,
      // GPS & Time
      latitude: m.latitude,
      longitude: m.longitude,
      timestamp: m.timestamp,
      // RF Metrics
      rssi: m.rssi,
      rsrp: m.rsrp,
      rsrq: m.rsrq,
      sinr: m.sinr,
      // Network Metrics
      latence: m.latence,
      debitDescendant: m.debitDescendant,
      debitMontant: m.debitMontant,
      gigue: m.gigue,
      tauxAppelReussi: m.tauxAppelReussi,
      tauxDropCall: m.tauxDropCall,
      // Internet Metrics
      debitDownload: m.debitDownload,
      debitUpload: m.debitUpload,
      ping: m.ping,
      dnsLookupTime: m.dnsLookupTime,
      tcpConnectTime: m.tcpConnectTime,
      // QoE Metrics
      scoreQoE: m.scoreQoE,
      pageLoadTime: m.pageLoadTime,
      videoBuffering: m.videoBuffering,
    }));

    return NextResponse.json({
      mesures: result,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error("Mesures GET API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/mesures — Create a single QoS measurement
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "campaign", "write");
    if (!canWrite) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — campagne:write requis" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["latitude", "longitude", "timestamp", "typeMesure"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Champ requis manquant: ${field}` },
          { status: 400 }
        );
      }
    }

    // Resolve operator ID
    let operateurId = body.operateurId;
    if (!operateurId && body.operatorCode) {
      const op = await db.operateur.findFirst({
        where: { code: body.operatorCode.toUpperCase() },
      });
      if (!op) {
        return NextResponse.json(
          { error: `Opérateur non trouvé: ${body.operatorCode}` },
          { status: 400 }
        );
      }
      operateurId = op.id;
    }
    if (!operateurId) {
      return NextResponse.json(
        { error: "operateurId ou operatorCode requis" },
        { status: 400 }
      );
    }

    // Resolve region ID
    let regionId = body.regionId;
    if (!regionId && body.regionCode) {
      const reg = await db.region.findFirst({
        where: { code: body.regionCode.toUpperCase() },
      });
      if (!reg) {
        return NextResponse.json(
          { error: `Région non trouvée: ${body.regionCode}` },
          { status: 400 }
        );
      }
      regionId = reg.id;
    }
    if (!regionId) {
      return NextResponse.json(
        { error: "regionId ou regionCode requis" },
        { status: 400 }
      );
    }

    // Resolve campaign ID
    let campagneId = body.campagneId;
    if (!campagneId && body.campagneNom) {
      const camp = await db.campagne.findFirst({
        where: { nom: body.campagneNom },
      });
      if (camp) campagneId = camp.id;
    }
    if (!campagneId) {
      return NextResponse.json(
        { error: "campagneId ou campagneNom requis" },
        { status: 400 }
      );
    }

    // Validate numeric ranges
    const validateRange = (value: number | undefined, min: number, max: number, name: string): number | undefined => {
      if (value === undefined || value === null) return undefined;
      if (value < min || value > max) {
        throw new Error(`${name} hors limites [${min}, ${max}]: ${value}`);
      }
      return value;
    };

    try {
      validateRange(body.rssi, -150, -30, "rssi");
      validateRange(body.rsrp, -140, -44, "rsrp");
      validateRange(body.rsrq, -20, -3, "rsrq");
      validateRange(body.sinr, -20, 30, "sinr");
      validateRange(body.latence, 0, 5000, "latence");
      validateRange(body.tauxAppelReussi, 0, 100, "tauxAppelReussi");
      validateRange(body.tauxDropCall, 0, 100, "tauxDropCall");
      validateRange(body.scoreQoE, 0, 100, "scoreQoE");
    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      );
    }

    // Build measurement data
    const mesureData = {
      operateurId,
      regionId,
      campagneId,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
      timestamp: new Date(body.timestamp),
      typeMesure: body.typeMesure,
      rssi: body.rssi !== undefined ? parseFloat(body.rssi) : undefined,
      rsrp: body.rsrp !== undefined ? parseFloat(body.rsrp) : undefined,
      rsrq: body.rsrq !== undefined ? parseFloat(body.rsrq) : undefined,
      sinr: body.sinr !== undefined ? parseFloat(body.sinr) : undefined,
      latence: body.latence !== undefined ? parseFloat(body.latence) : undefined,
      debitDescendant: body.debitDescendant !== undefined ? parseFloat(body.debitDescendant) : undefined,
      debitMontant: body.debitMontant !== undefined ? parseFloat(body.debitMontant) : undefined,
      gigue: body.gigue !== undefined ? parseFloat(body.gigue) : undefined,
      tauxAppelReussi: body.tauxAppelReussi !== undefined ? parseFloat(body.tauxAppelReussi) : undefined,
      tauxDropCall: body.tauxDropCall !== undefined ? parseFloat(body.tauxDropCall) : undefined,
      debitDownload: body.debitDownload !== undefined ? parseFloat(body.debitDownload) : undefined,
      debitUpload: body.debitUpload !== undefined ? parseFloat(body.debitUpload) : undefined,
      ping: body.ping !== undefined ? parseFloat(body.ping) : undefined,
      dnsLookupTime: body.dnsLookupTime !== undefined ? parseFloat(body.dnsLookupTime) : undefined,
      tcpConnectTime: body.tcpConnectTime !== undefined ? parseFloat(body.tcpConnectTime) : undefined,
      scoreQoE: body.scoreQoE !== undefined ? parseFloat(body.scoreQoE) : undefined,
      pageLoadTime: body.pageLoadTime !== undefined ? parseFloat(body.pageLoadTime) : undefined,
      videoBuffering: body.videoBuffering !== undefined ? parseFloat(body.videoBuffering) : undefined,
    };

    const mesure = await db.mesureQoS.create({ data: mesureData });

    await logAudit(
      userId,
      "CREATE",
      "mesure",
      JSON.stringify({ operateur: operateurId, region: regionId, type: body.typeMesure }),
      mesure.id
    );

    return NextResponse.json({ mesure, message: "Mesure créée avec succès" }, { status: 201 });
  } catch (error) {
    console.error("Mesures POST API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUT /api/mesures — Bulk import QoS measurements
// Supports JSON and CSV formats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CsvRow { [key: string]: string }

function parseCSV(csvText: string): CsvRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length !== headers.length) continue;
    const row: CsvRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });
    rows.push(row);
  }
  return rows;
}

const pf = (val: string | undefined): number | undefined => {
  if (!val || val === "" || val === "N/A" || val === "null") return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
};

const pfUnknown = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = parseFloat(String(v));
  return isNaN(n) ? undefined : n;
};

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;

    const canWrite = await checkPermission(userRole, "campaign", "write");
    if (!canWrite) {
      return NextResponse.json(
        { error: "Permissions insuffisantes — campagne:write requis" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let mesuresData: Record<string, unknown>[] = [];
    let campagneId = "";
    let format = "";

    // Format 1: JSON
    if (contentType.includes("application/json")) {
      format = "JSON";
      const body = await request.json();
      campagneId = body.campagneId;

      if (!campagneId) {
        return NextResponse.json({ error: "campagneId requis pour l'import en masse" }, { status: 400 });
      }
      if (!body.mesures || !Array.isArray(body.mesures)) {
        return NextResponse.json({ error: "Format invalide — attendu: { campagneId, mesures: [...] }" }, { status: 400 });
      }

      for (const m of body.mesures) {
        if (m.latitude === undefined || m.longitude === undefined || !m.timestamp || !m.typeMesure) continue;

        let operateurId = m.operateurId;
        if (!operateurId && m.operatorCode) {
          const op = await db.operateur.findFirst({ where: { code: (m.operatorCode as string).toUpperCase() } });
          if (op) operateurId = op.id;
        }
        if (!operateurId) continue;

        let regionId = m.regionId;
        if (!regionId && m.regionCode) {
          const reg = await db.region.findFirst({ where: { code: (m.regionCode as string).toUpperCase() } });
          if (reg) regionId = reg.id;
        }
        if (!regionId) continue;

        mesuresData.push({
          operateurId, regionId, campagneId,
          latitude: parseFloat(m.latitude), longitude: parseFloat(m.longitude),
          timestamp: new Date(m.timestamp), typeMesure: m.typeMesure,
          rssi: pfUnknown(m.rssi), rsrp: pfUnknown(m.rsrp), rsrq: pfUnknown(m.rsrq), sinr: pfUnknown(m.sinr),
          latence: pfUnknown(m.latence), debitDescendant: pfUnknown(m.debitDescendant), debitMontant: pfUnknown(m.debitMontant),
          gigue: pfUnknown(m.gigue), tauxAppelReussi: pfUnknown(m.tauxAppelReussi), tauxDropCall: pfUnknown(m.tauxDropCall),
          debitDownload: pfUnknown(m.debitDownload), debitUpload: pfUnknown(m.debitUpload), ping: pfUnknown(m.ping),
          dnsLookupTime: pfUnknown(m.dnsLookupTime), tcpConnectTime: pfUnknown(m.tcpConnectTime),
          scoreQoE: pfUnknown(m.scoreQoE), pageLoadTime: pfUnknown(m.pageLoadTime), videoBuffering: pfUnknown(m.videoBuffering),
        });
      }
    }
    // Format 2: CSV
    else if (contentType.includes("text/csv") || contentType.includes("application/octet-stream")) {
      format = "CSV";
      const csvText = await request.text();
      const { searchParams } = new URL(request.url);
      campagneId = searchParams.get("campagneId") || "";

      if (!campagneId) {
        return NextResponse.json({ error: "campagneId requis (query param: ?campagneId=xxx)" }, { status: 400 });
      }

      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        return NextResponse.json({ error: "CSV vide ou format invalide" }, { status: 400 });
      }

      for (const row of rows) {
        const operatorCode = row.operatorcode || row.operateurcode || row.operator_code;
        const regionCodeVal = row.regioncode || row.region_code;
        if (!operatorCode || !regionCodeVal) continue;

        const op = await db.operateur.findFirst({ where: { code: operatorCode.toUpperCase() } });
        if (!op) continue;
        const reg = await db.region.findFirst({ where: { code: regionCodeVal.toUpperCase() } });
        if (!reg) continue;

        mesuresData.push({
          operateurId: op.id, regionId: reg.id, campagneId,
          latitude: parseFloat(row.latitude), longitude: parseFloat(row.longitude),
          timestamp: new Date(row.timestamp),
          typeMesure: row.typemesure || row.type_mesure || row.type || "MOBILE",
          rssi: pf(row.rssi), rsrp: pf(row.rsrp), rsrq: pf(row.rsrq), sinr: pf(row.sinr),
          latence: pf(row.latence) || pf(row.latency),
          debitDescendant: pf(row.debitdescendant) || pf(row.download_throughput),
          debitMontant: pf(row.debitmontant) || pf(row.upload_throughput),
          gigue: pf(row.gigue) || pf(row.jitter),
          tauxAppelReussi: pf(row.tauxappelreussi) || pf(row.call_success_rate),
          tauxDropCall: pf(row.tauxdropcall) || pf(row.drop_call_rate),
          debitDownload: pf(row.debitdownload), debitUpload: pf(row.debitupload),
          ping: pf(row.ping), dnsLookupTime: pf(row.dnslookuptime) || pf(row.dns_lookup_time),
          tcpConnectTime: pf(row.tcpconnecttime) || pf(row.tcp_connect_time),
          scoreQoE: pf(row.scoreqoe) || pf(row.qoe_score),
          pageLoadTime: pf(row.pageloadtime) || pf(row.page_load_time),
          videoBuffering: pf(row.videobuffering) || pf(row.video_buffering),
        });
      }
    } else {
      return NextResponse.json({ error: "Content-Type non supporté — utilisez application/json ou text/csv" }, { status: 400 });
    }

    if (mesuresData.length === 0) {
      return NextResponse.json({ error: "Aucune mesure valide à insérer" }, { status: 400 });
    }

    // Batch insert in chunks of 100
    const CHUNK_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < mesuresData.length; i += CHUNK_SIZE) {
      const chunk = mesuresData.slice(i, i + CHUNK_SIZE);
      try {
        const result = await db.mesureQoS.createMany({ data: chunk as any });
        inserted += result.count;
      } catch (chunkError) {
        console.error("Bulk insert chunk error:", chunkError);
        errors += chunk.length;
      }
    }

    // Update campaign status
    if (campagneId && inserted > 0) {
      await db.campagne.updateMany({
        where: { id: campagneId, statut: "PLANIFIEE" },
        data: { statut: "EN_COURS" },
      });
    }

    await logAudit(userId, "CREATE", "mesures_bulk",
      JSON.stringify({ format, total: mesuresData.length, inserted, errors, campagneId }), campagneId);

    return NextResponse.json({
      message: `${inserted} mesures importées avec succès`,
      format, total: mesuresData.length, inserted, errors, campagneId,
    }, { status: 201 });
  } catch (error) {
    console.error("Mesures bulk PUT API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission, logAudit, getAccessibleOperators, getAccessibleRegions, getRLSScope } from "@/lib/rbac";
import { z } from "zod";
import { checkRateLimit } from "@/lib/utils-api";

// ── Zod Schemas ──

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "");

/** Shared schema for a single QoS measurement row (used in both POST and PUT) */
const mesureBaseSchema = z.object({
  // Identifiers — either ID or code
  operateurId: z.string().max(50).transform(stripHtml).optional(),
  operatorCode: z.string().max(20).transform(stripHtml).optional(),
  regionId: z.string().max(50).transform(stripHtml).optional(),
  regionCode: z.string().max(20).transform(stripHtml).optional(),
  campagneId: z.string().max(50).transform(stripHtml).optional(),
  campagneNom: z.string().max(200).transform(stripHtml).optional(),
  // Required fields
  latitude: z.coerce.number().min(-90, "Latitude min -90").max(90, "Latitude max 90"),
  longitude: z.coerce.number().min(-180, "Longitude min -180").max(180, "Longitude max 180"),
  timestamp: z.string().min(1, "Timestamp requis").max(50).transform(stripHtml),
  typeMesure: z.string().min(1, "typeMesure requis").max(50).transform(stripHtml),
  // RF Metrics
  rssi: z.coerce.number().min(-150).max(-30).optional(),
  rsrp: z.coerce.number().min(-140).max(-44).optional(),
  rsrq: z.coerce.number().min(-20).max(-3).optional(),
  sinr: z.coerce.number().min(-20).max(30).optional(),
  // Network Metrics
  latence: z.coerce.number().min(0).max(5000).optional(),
  debitDescendant: z.coerce.number().min(0).max(100000).optional(),
  debitMontant: z.coerce.number().min(0).max(100000).optional(),
  gigue: z.coerce.number().min(0).max(5000).optional(),
  tauxAppelReussi: z.coerce.number().min(0).max(100).optional(),
  tauxDropCall: z.coerce.number().min(0).max(100).optional(),
  // Internet Metrics
  debitDownload: z.coerce.number().min(0).max(100000).optional(),
  debitUpload: z.coerce.number().min(0).max(100000).optional(),
  ping: z.coerce.number().min(0).max(5000).optional(),
  dnsLookupTime: z.coerce.number().min(0).max(5000).optional(),
  tcpConnectTime: z.coerce.number().min(0).max(5000).optional(),
  // QoE Metrics
  scoreQoE: z.coerce.number().min(0).max(100).optional(),
  pageLoadTime: z.coerce.number().min(0).max(60000).optional(),
  videoBuffering: z.coerce.number().min(0).max(60000).optional(),
});

/** POST schema — requires operateurId|operatorCode, regionId|regionCode, campagneId|campagneNom */
const createMesureSchema = mesureBaseSchema.refine(
  (data) => data.operateurId || data.operatorCode,
  { message: "operateurId ou operatorCode requis", path: ["operateurId"] }
).refine(
  (data) => data.regionId || data.regionCode,
  { message: "regionId ou regionCode requis", path: ["regionId"] }
).refine(
  (data) => data.campagneId || data.campagneNom,
  { message: "campagneId ou campagneNom requis", path: ["campagneId"] }
);

/** PUT schema — JSON bulk import body */
const bulkImportSchema = z.object({
  campagneId: z.string().min(1, "campagneId requis pour l'import en masse").max(50).transform(stripHtml),
  mesures: z.array(mesureBaseSchema).min(1, "Au moins une mesure requise").max(10000, "Maximum 10 000 mesures par import"),
});

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
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`mesures-post:${ip}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

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

    const rawBody = await request.json();
    const parsed = createMesureSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // ── Resolve operator ID ──
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

    // ── Build measurement data (values already validated by Zod) ──
    const mesureData = {
      operateurId,
      regionId,
      campagneId,
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: new Date(body.timestamp),
      typeMesure: body.typeMesure,
      // RF Metrics
      rssi: body.rssi,
      rsrp: body.rsrp,
      rsrq: body.rsrq,
      sinr: body.sinr,
      // Network Metrics
      latence: body.latence,
      debitDescendant: body.debitDescendant,
      debitMontant: body.debitMontant,
      gigue: body.gigue,
      tauxAppelReussi: body.tauxAppelReussi,
      tauxDropCall: body.tauxDropCall,
      // Internet Metrics
      debitDownload: body.debitDownload,
      debitUpload: body.debitUpload,
      ping: body.ping,
      dnsLookupTime: body.dnsLookupTime,
      tcpConnectTime: body.tcpConnectTime,
      // QoE Metrics
      scoreQoE: body.scoreQoE,
      pageLoadTime: body.pageLoadTime,
      videoBuffering: body.videoBuffering,
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

export async function PUT(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`mesures-post:${ip}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte" }, { status: 429, headers: { "Retry-After": String(rl.resetIn) } });
    }

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
    let mesuresData: any[] = [];
    let campagneId = "";
    let format = "";

    // Format 1: JSON
    if (contentType.includes("application/json")) {
      format = "JSON";
      const rawBody = await request.json();

      // Zod validation for the bulk import body
      const parsed = bulkImportSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const body = parsed.data;
      campagneId = body.campagneId;

      for (const m of body.mesures) {
        // Additional Zod validation on each row (already parsed, but check IDs)
        let operateurId = m.operateurId;
        if (!operateurId && m.operatorCode) {
          const op = await db.operateur.findFirst({ where: { code: m.operatorCode.toUpperCase() } });
          if (op) operateurId = op.id;
        }
        if (!operateurId) continue;

        let regionId = m.regionId;
        if (!regionId && m.regionCode) {
          const reg = await db.region.findFirst({ where: { code: m.regionCode.toUpperCase() } });
          if (reg) regionId = reg.id;
        }
        if (!regionId) continue;

        mesuresData.push({
          operateurId, regionId, campagneId,
          latitude: m.latitude, longitude: m.longitude,
          timestamp: new Date(m.timestamp), typeMesure: m.typeMesure,
          rssi: m.rssi, rsrp: m.rsrp, rsrq: m.rsrq, sinr: m.sinr,
          latence: m.latence, debitDescendant: m.debitDescendant, debitMontant: m.debitMontant,
          gigue: m.gigue, tauxAppelReussi: m.tauxAppelReussi, tauxDropCall: m.tauxDropCall,
          debitDownload: m.debitDownload, debitUpload: m.debitUpload, ping: m.ping,
          dnsLookupTime: m.dnsLookupTime, tcpConnectTime: m.tcpConnectTime,
          scoreQoE: m.scoreQoE, pageLoadTime: m.pageLoadTime, videoBuffering: m.videoBuffering,
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

        // Zod validation on each CSV row converted to object
        const csvRowParsed = mesureBaseSchema.safeParse({
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp,
          typeMesure: row.typemesure || row.type_mesure || row.type || "MOBILE",
          rssi: pf(row.rssi),
          rsrp: pf(row.rsrp),
          rsrq: pf(row.rsrq),
          sinr: pf(row.sinr),
          latence: pf(row.latence) || pf(row.latency),
          debitDescendant: pf(row.debitdescendant) || pf(row.download_throughput),
          debitMontant: pf(row.debitmontant) || pf(row.upload_throughput),
          gigue: pf(row.gigue) || pf(row.jitter),
          tauxAppelReussi: pf(row.tauxappelreussi) || pf(row.call_success_rate),
          tauxDropCall: pf(row.tauxdropcall) || pf(row.drop_call_rate),
          debitDownload: pf(row.debitdownload),
          debitUpload: pf(row.debitupload),
          ping: pf(row.ping),
          dnsLookupTime: pf(row.dnslookuptime) || pf(row.dns_lookup_time),
          tcpConnectTime: pf(row.tcpconnecttime) || pf(row.tcp_connect_time),
          scoreQoE: pf(row.scoreqoe) || pf(row.qoe_score),
          pageLoadTime: pf(row.pageloadtime) || pf(row.page_load_time),
          videoBuffering: pf(row.videobuffering) || pf(row.video_buffering),
        });

        // Skip rows that fail Zod validation (don't fail the whole import)
        if (!csvRowParsed.success) continue;

        const validatedRow = csvRowParsed.data;
        mesuresData.push({
          operateurId: op.id, regionId: reg.id, campagneId,
          latitude: validatedRow.latitude, longitude: validatedRow.longitude,
          timestamp: new Date(validatedRow.timestamp),
          typeMesure: validatedRow.typeMesure,
          rssi: validatedRow.rssi, rsrp: validatedRow.rsrp, rsrq: validatedRow.rsrq, sinr: validatedRow.sinr,
          latence: validatedRow.latence, debitDescendant: validatedRow.debitDescendant, debitMontant: validatedRow.debitMontant,
          gigue: validatedRow.gigue, tauxAppelReussi: validatedRow.tauxAppelReussi, tauxDropCall: validatedRow.tauxDropCall,
          debitDownload: validatedRow.debitDownload, debitUpload: validatedRow.debitUpload, ping: validatedRow.ping,
          dnsLookupTime: validatedRow.dnsLookupTime, tcpConnectTime: validatedRow.tcpConnectTime,
          scoreQoE: validatedRow.scoreQoE, pageLoadTime: validatedRow.pageLoadTime, videoBuffering: validatedRow.videoBuffering,
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

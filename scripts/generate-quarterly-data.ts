/**
 * Generate Realistic Quarterly Operator Data for ARPT-QoS-Guinée
 * 
 * Produces data files for 4 operators × 4 quarters = 16 measurement files,
 * 16 score files, 16 campaign files, and alert files.
 * 
 * Data is organized in: /home/z/my-project/download/donnees-operateurs-2025/
 * 
 * Two formats per measurement file:
 *   - admin-*.csv   → For ARPT admin import (with operateur column)
 *   - prestataire-*.csv → For operator API import (no operateur column, uses API key)
 */

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const OUTPUT_DIR = '/home/z/my-project/download/donnees-operateurs-2025';

const REGIONS = [
  { code: 'CON', nom: 'Conakry', lat: 9.5092, lng: -13.7122, urban: true, pop: 2042000 },
  { code: 'CYA', nom: 'Coyah', lat: 9.7167, lng: -13.3833, urban: true, pop: 263000 },
  { code: 'KIN', nom: 'Kindia', lat: 10.0569, lng: -12.8605, urban: true, pop: 1836000 },
  { code: 'BOK', nom: 'Boké', lat: 11.1852, lng: -14.2941, urban: false, pop: 1143000 },
  { code: 'KDR', nom: 'Koundara', lat: 12.5000, lng: -13.3167, urban: false, pop: 358000 },
  { code: 'LAB', nom: 'Labé', lat: 11.3170, lng: -12.2832, urban: false, pop: 1242000 },
  { code: 'MLI', nom: 'Mali', lat: 11.9833, lng: -12.2833, urban: false, pop: 287000 },
  { code: 'DLB', nom: 'Dalaba', lat: 10.9833, lng: -12.2500, urban: false, pop: 187000 },
  { code: 'MAM', nom: 'Mamou', lat: 10.5167, lng: -12.0833, urban: true, pop: 932000 },
  { code: 'FAR', nom: 'Faranah', lat: 10.0333, lng: -10.7333, urban: false, pop: 942000 },
  { code: 'KDG', nom: 'Kissidougou', lat: 9.1833, lng: -10.1000, urban: false, pop: 312000 },
  { code: 'KAN', nom: 'Kankan', lat: 10.3833, lng: -9.3000, urban: true, pop: 1976000 },
  { code: 'SGR', nom: 'Siguiri', lat: 11.4167, lng: -9.1667, urban: false, pop: 842000 },
  { code: 'GKD', nom: 'Guéckédou', lat: 8.5667, lng: -10.1333, urban: false, pop: 367000 },
  { code: 'BLA', nom: 'Beyla', lat: 8.6833, lng: -8.6333, urban: false, pop: 326000 },
  { code: 'NZE', nom: "N'Zérékoré", lat: 7.7500, lng: -8.8167, urban: true, pop: 1715000 },
];

const QUARTERS = [
  { id: 'Q1', label: '2025-Q1', months: [1, 2, 3], start: '2025-01-01', end: '2025-03-31' },
  { id: 'Q2', label: '2025-Q2', months: [4, 5, 6], start: '2025-04-01', end: '2025-06-30' },
  { id: 'Q3', label: '2025-Q3', months: [7, 8, 9], start: '2025-07-01', end: '2025-09-30' },
  { id: 'Q4', label: '2025-Q4', months: [10, 11, 12], start: '2025-10-01', end: '2025-12-31' },
];

// Operator profiles with realistic Guinea data
const OPERATORS = [
  {
    code: 'ORANGE',
    nom: 'Orange Guinée',
    // Orange is market leader - best coverage and quality
    profile: {
      baseRssi: -65, baseRsrp: -78, baseRsrq: -7, baseSinr: 14,
      baseDebitDescendant: 18, baseDebitMontant: 10, baseLatence: 28, baseGigue: 4,
      baseTauxAppel: 96, baseDropCall: 2.5,
      baseDebitDownload: 22, baseDebitUpload: 12, basePing: 32,
      baseDns: 18, baseTcp: 120,
      baseQoE: 75, basePageLoad: 2.8, baseVideoBuffering: 1.2,
      coverageFactor: 0.92, // 92% of regions well covered
      urbanBoost: 1.15, ruralPenalty: 0.65,
    },
  },
  {
    code: 'MTN',
    nom: 'MTN Guinée',
    // MTN is strong competitor - good in urban areas
    profile: {
      baseRssi: -70, baseRsrp: -84, baseRsrq: -9, baseSinr: 11,
      baseDebitDescendant: 14, baseDebitMontant: 8, baseLatence: 38, baseGigue: 6,
      baseTauxAppel: 92, baseDropCall: 4.0,
      baseDebitDownload: 16, baseDebitUpload: 9, basePing: 42,
      baseDns: 25, baseTcp: 180,
      baseQoE: 65, basePageLoad: 3.5, baseVideoBuffering: 2.8,
      coverageFactor: 0.80,
      urbanBoost: 1.10, ruralPenalty: 0.55,
    },
  },
  {
    code: 'CELCOM',
    nom: 'Celcom Guinée',
    // Celcom - medium coverage, decent in some areas
    profile: {
      baseRssi: -78, baseRsrp: -92, baseRsrq: -12, baseSinr: 7,
      baseDebitDescendant: 8, baseDebitMontant: 4, baseLatence: 65, baseGigue: 12,
      baseTauxAppel: 82, baseDropCall: 7.5,
      baseDebitDownload: 8, baseDebitUpload: 4, basePing: 72,
      baseDns: 40, baseTcp: 320,
      baseQoE: 48, basePageLoad: 5.2, baseVideoBuffering: 6.5,
      coverageFactor: 0.55,
      urbanBoost: 1.05, ruralPenalty: 0.40,
    },
  },
  {
    code: 'INTERCEL',
    nom: 'Intercel Guinée',
    // Intercel - limited coverage, mostly urban
    profile: {
      baseRssi: -85, baseRsrp: -100, baseRsrq: -15, baseSinr: 3,
      baseDebitDescendant: 4, baseDebitMontant: 2, baseLatence: 120, baseGigue: 25,
      baseTauxAppel: 68, baseDropCall: 14,
      baseDebitDownload: 3, baseDebitUpload: 1.5, basePing: 130,
      baseDns: 65, baseTcp: 550,
      baseQoE: 30, basePageLoad: 8.5, baseVideoBuffering: 15,
      coverageFactor: 0.30,
      urbanBoost: 1.0, ruralPenalty: 0.25,
    },
  },
];

// API Keys for prestataire imports
const API_KEYS: Record<string, string> = {
  ORANGE: 'onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ',
  MTN: 'onit-MTN-f3Hb7nKcP5dAqW1xY8uE',
  CELCOM: 'onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH',
  INTERCEL: 'onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ',
};

// ═══════════════════════════════════════════
// Seeded random number generator
// ═══════════════════════════════════════════
class SeededRNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  normal(mean: number, stdDev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }
  bool(probability: number): boolean {
    return this.next() < probability;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ═══════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(d: Date): string {
  return d.toISOString().replace('Z', '000Z');
}

function randomDateInQuarter(rng: SeededRNG, quarter: typeof QUARTERS[0]): Date {
  const start = new Date(quarter.start + 'T06:00:00.000Z');
  const end = new Date(quarter.end + 'T20:00:00.000Z');
  const ts = start.getTime() + rng.next() * (end.getTime() - start.getTime());
  return new Date(ts);
}

// ═══════════════════════════════════════════
// Generate Measurements
// ═══════════════════════════════════════════

interface Measurement {
  operateur: string;
  region: string;
  regionNom: string;
  latitude: number;
  longitude: number;
  typeMesure: string;
  timestamp: string;
  rssi: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  debitDescendant: number | null;
  debitMontant: number | null;
  latence: number | null;
  gigue: number | null;
  tauxAppelReussi: number | null;
  tauxDropCall: number | null;
  debitDownload: number | null;
  debitUpload: number | null;
  ping: number | null;
  dnsLookupTime: number | null;
  tcpConnectTime: number | null;
  scoreQoE: number | null;
  pageLoadTime: number | null;
  videoBuffering: number | null;
  campagne: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function generateMeasurement(
  rng: SeededRNG,
  operator: typeof OPERATORS[0],
  region: typeof REGIONS[0],
  quarter: typeof QUARTERS[0],
  typeMesure: string
): Measurement {
  const p = operator.profile;
  const isUrban = region.urban;
  const isCovered = rng.bool(p.coverageFactor);

  // Quality factor: 0.0 (worst) to 1.5+ (best)
  // Higher = better coverage, better quality, lower latency
  let qFactor: number;
  if (!isCovered) {
    qFactor = 0.15 + rng.next() * 0.2; // Dead zone: very poor quality
  } else if (isUrban) {
    qFactor = p.urbanBoost + rng.range(-0.1, 0.15); // Urban boost
  } else {
    qFactor = p.ruralPenalty + rng.range(-0.05, 0.2); // Rural penalty
  }

  const isMobile = typeMesure === 'MOBILE' || typeMesure === 'DRIVE_TEST';
  const isInternet = typeMesure === 'INTERNET' || typeMesure === 'DRIVE_TEST';
  const isDriveTest = typeMesure === 'DRIVE_TEST';

  // Generate coordinates with slight jitter around region center
  const lat = round2(region.lat + rng.range(-0.15, 0.15));
  const lng = round2(region.lng + rng.range(-0.15, 0.15));
  const ts = randomDateInQuarter(rng, quarter);

  // RF metrics: more negative = worse signal
  // Good coverage → less negative (closer to base), Bad coverage → more negative
  // rssi: range [-150, -30], base around -65 to -85
  const rssi = isMobile ? clamp(round2(rng.normal(p.baseRssi - (1 - qFactor) * 30, 5)), -150, -30) : null;
  // rsrp: range [-140, -44], base around -78 to -100
  const rsrp = isMobile ? clamp(round2(rng.normal(p.baseRsrp - (1 - qFactor) * 25, 6)), -140, -44) : null;
  // rsrq: range [-20, -3], base around -7 to -15
  const rsrq = isMobile ? clamp(round2(rng.normal(p.baseRsrq - (1 - qFactor) * 5, 2)), -20, -3) : null;
  // sinr: range [-20, 30], base around 3 to 14
  const sinr = isMobile ? clamp(round2(rng.normal(p.baseSinr * qFactor, 3)), -20, 30) : null;

  // Mobile quality metrics: higher factor = better
  const debitDescendant = isMobile ? round2(Math.max(0, rng.normal(p.baseDebitDescendant * qFactor, 3))) : null;
  const debitMontant = isMobile ? round2(Math.max(0, rng.normal(p.baseDebitMontant * qFactor, 2))) : null;
  // Latency: higher factor = lower latency (better)
  const latence = isMobile ? round2(Math.max(0, rng.normal(p.baseLatence / qFactor, 10))) : null;
  const gigue = isMobile ? round2(Math.max(0, rng.normal(p.baseGigue / qFactor, 3))) : null;
  const tauxAppelReussi = isMobile ? clamp(round2(rng.normal(p.baseTauxAppel * qFactor, 5)), 0, 100) : null;
  const tauxDropCall = isMobile ? round2(Math.max(0, rng.normal(p.baseDropCall / qFactor, 2))) : null;

  // Internet metrics: higher factor = better
  const debitDownload = isInternet ? round2(Math.max(0.01, rng.normal(p.baseDebitDownload * qFactor, 4))) : null;
  const debitUpload = isInternet ? round2(Math.max(0.01, rng.normal(p.baseDebitUpload * qFactor, 2))) : null;
  const ping = isInternet ? round2(Math.max(1, rng.normal(p.basePing / qFactor, 10))) : null;
  const dnsLookupTime = isInternet ? round2(Math.max(1, rng.normal(p.baseDns / qFactor, 8))) : null;
  const tcpConnectTime = isInternet ? round2(Math.max(1, rng.normal(p.baseTcp / qFactor, 30))) : null;

  // QoE metrics: higher factor = better
  const scoreQoE = isDriveTest ? clamp(round2(rng.normal(p.baseQoE * qFactor, 10)), 0, 100) : null;
  const pageLoadTime = isDriveTest ? round2(Math.max(0.5, rng.normal(p.basePageLoad / qFactor, 1))) : null;
  const videoBuffering = isDriveTest ? round2(Math.max(0, rng.normal(p.baseVideoBuffering / qFactor, 2))) : null;

  return {
    operateur: operator.code,
    region: region.code,
    regionNom: region.nom,
    latitude: lat,
    longitude: lng,
    typeMesure,
    timestamp: formatDate(ts),
    rssi,
    rsrp,
    rsrq,
    sinr,
    debitDescendant,
    debitMontant,
    latence,
    gigue,
    tauxAppelReussi,
    tauxDropCall,
    debitDownload,
    debitUpload,
    ping,
    dnsLookupTime,
    tcpConnectTime,
    scoreQoE,
    pageLoadTime,
    videoBuffering,
    campagne: `Campagne ${operator.nom} ${region.nom} ${quarter.label}`,
  };
}

// ═══════════════════════════════════════════
// Generate Scores
// ═══════════════════════════════════════════

interface Score {
  operateur: string;
  periode: string;
  scoreGlobal: number;
  scoreCouverture: number;
  scoreQoS: number;
  scoreQoE: number;
  scoreConformite: number;
  recommandation: string;
}

function generateScore(
  rng: SeededRNG,
  operator: typeof OPERATORS[0],
  quarter: typeof QUARTERS[0],
  quarterIndex: number
): Score {
  const p = operator.profile;
  
  // Progressive improvement over quarters (operators invest in infrastructure)
  const improvementFactor = 1 + quarterIndex * 0.04; // 4% improvement per quarter
  const baseFactor = (p.coverageFactor + p.urbanBoost) / 2;
  
  const scoreCouverture = round2(Math.min(100, rng.normal(p.coverageFactor * 100 * improvementFactor, 5)));
  const scoreQoS = round2(Math.min(100, rng.normal(baseFactor * 85 * improvementFactor, 6)));
  const scoreQoE = round2(Math.min(100, rng.normal(p.baseQoE * improvementFactor, 5)));
  const scoreConformite = round2(Math.min(100, rng.normal(baseFactor * 75 * improvementFactor, 7)));
  const scoreGlobal = round2(
    scoreCouverture * 0.25 + scoreQoS * 0.30 + scoreQoE * 0.25 + scoreConformite * 0.20
  );

  let recommandation: string;
  if (scoreGlobal >= 75) {
    recommandation = 'Performances satisfaisantes. Maintenir le niveau de qualité de service.';
  } else if (scoreGlobal >= 60) {
    recommandation = 'Performances acceptables. Des améliorations sont recommandées sur la couverture rurale.';
  } else if (scoreGlobal >= 45) {
    recommandation = 'Performances insuffisantes. Plan d\'amélioration requis sous 90 jours.';
  } else {
    recommandation = 'Performances critiques. Mise en demeure recommandée. Plan d\'urgence requis sous 30 jours.';
  }

  return {
    operateur: operator.code,
    periode: quarter.label,
    scoreGlobal: round2(Math.max(0, scoreGlobal)),
    scoreCouverture: round2(Math.max(0, scoreCouverture)),
    scoreQoS: round2(Math.max(0, scoreQoS)),
    scoreQoE: round2(Math.max(0, scoreQoE)),
    scoreConformite: round2(Math.max(0, scoreConformite)),
    recommandation,
  };
}

// ═══════════════════════════════════════════
// Generate Campaigns
// ═══════════════════════════════════════════

interface Campaign {
  nom: string;
  type: string;
  operateur: string;
  region: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  responsable: string;
}

function generateCampaign(
  operator: typeof OPERATORS[0],
  region: typeof REGIONS[0],
  quarter: typeof QUARTERS[0],
  quarterIndex: number
): Campaign {
  const campaignTypes = ['DRIVE_TEST', 'STATIONNAIRE', 'QOS_INTERNET'];
  const type = campaignTypes[quarterIndex % 3]; // Rotate types
  
  const startDate = new Date(quarter.start);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14 + Math.floor(Math.random() * 21)); // 14-35 day campaigns
  
  // Q4 campaigns are always finished, Q3 might be in progress, etc.
  let statut: string;
  if (quarterIndex <= 2) statut = 'TERMINEE';
  else statut = 'TERMINEE';

  return {
    nom: `Campagne ${type === 'DRIVE_TEST' ? 'Drive Test' : type === 'STATIONNAIRE' ? 'Stationnaire' : 'QoS Internet'} ${operator.nom} ${region.nom} ${quarter.label}`,
    type,
    operateur: operator.code,
    region: region.code,
    dateDebut: quarter.start,
    dateFin: endDate > new Date(quarter.end) ? quarter.end : endDate.toISOString().split('T')[0],
    statut,
    responsable: `Equipe ${operator.nom}`,
  };
}

// ═══════════════════════════════════════════
// Generate Alerts
// ═══════════════════════════════════════════

interface Alert {
  type: string;
  severity: string;
  operateur: string;
  region: string;
  message: string;
  details: string;
  isResolved: boolean;
  timestamp: string;
}

function generateAlerts(
  rng: SeededRNG,
  operator: typeof OPERATORS[0],
  quarter: typeof QUARTERS[0],
  quarterIndex: number
): Alert[] {
  const p = operator.profile;
  const alerts: Alert[] = [];
  
  // Poor quality operators generate more alerts
  const alertCount = Math.floor((1 - p.coverageFactor) * 8) + rng.range(0, 3); // More alerts for worse operators
  const alertTypes = ['SEUIL_DEPASSE', 'COUVERTURE_INSUFFISANTE', 'QUALITE_DEGRADEE', 'INDISPONIBILITE'];
  const severities = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];
  
  // Pick regions that are more likely to have issues (rural for poor operators)
  const problemRegions = REGIONS.filter(r => {
    if (!r.urban && p.coverageFactor < 0.6) return true;
    if (rng.bool(0.3)) return true;
    return false;
  });
  
  for (let i = 0; i < alertCount && i < problemRegions.length; i++) {
    const region = problemRegions[i];
    const type = rng.pick(alertTypes);
    const severityIndex = Math.min(3, Math.floor((1 - p.coverageFactor) * 4));
    const severity = severities[Math.min(severityIndex + Math.floor(rng.next() * 2), 3)];
    
    const isResolved = quarterIndex < 3 ? rng.bool(0.8) : rng.bool(0.4);
    
    const messages: Record<string, string> = {
      SEUIL_DEPASSE: `Le seuil réglementaire de QoS est dépassé pour ${operator.nom} dans la région de ${region.nom}`,
      COUVERTURE_INSUFFISANTE: `Couverture insuffisante détectée pour ${operator.nom} dans la région de ${region.nom}`,
      QUALITE_DEGRADEE: `Dégradation significative de la qualité de service pour ${operator.nom} dans la région de ${region.nom}`,
      INDISPONIBILITE: `Indisponibilité prolongée du réseau ${operator.nom} dans la région de ${region.nom}`,
    };
    
    const ts = randomDateInQuarter(rng, quarter);
    
    alerts.push({
      type,
      severity,
      operateur: operator.code,
      region: region.code,
      message: messages[type],
      details: JSON.stringify({
        kpi: type === 'SEUIL_DEPASSE' ? 'latence' : type === 'COUVERTURE_INSUFFISANTE' ? 'rsrp' : 'scoreQoE',
        valeur: round2(rng.range(10, 200)),
        seuil: round2(rng.range(50, 100)),
        ecart: round2(rng.range(10, 50)),
      }),
      isResolved,
      timestamp: formatDate(ts),
    });
  }
  
  return alerts;
}

// ═══════════════════════════════════════════
// CSV Generation
// ═══════════════════════════════════════════

const ADMIN_CSV_HEADERS = [
  'operateur', 'region', 'regionNom', 'latitude', 'longitude', 'typeMesure', 'timestamp',
  'rssi', 'rsrp', 'rsrq', 'sinr', 'debitDescendant', 'debitMontant', 'latence', 'gigue',
  'tauxAppelReussi', 'tauxDropCall', 'debitDownload', 'debitUpload', 'ping',
  'dnsLookupTime', 'tcpConnectTime', 'scoreQoE', 'pageLoadTime', 'videoBuffering', 'campagne'
];

const PRESTATAIRE_CSV_HEADERS = [
  'regionCode', 'latitude', 'longitude', 'typeMesure', 'timestamp',
  'rssi', 'rsrp', 'rsrq', 'sinr', 'debitDescendant', 'debitMontant', 'latence', 'gigue',
  'tauxAppelReussi', 'tauxDropCall', 'debitDownload', 'debitUpload', 'ping',
  'dnsLookupTime', 'tcpConnectTime', 'scoreQoE', 'pageLoadTime', 'videoBuffering'
];

function measurementToAdminCSV(m: Measurement): string {
  return ADMIN_CSV_HEADERS.map(h => {
    const val = (m as any)[h];
    return val === null || val === undefined ? '' : String(val);
  }).join(',');
}

function measurementToPrestataireCSV(m: Measurement): string {
  return PRESTATAIRE_CSV_HEADERS.map(h => {
    let val: any;
    if (h === 'regionCode') val = m.region;
    else val = (m as any)[h];
    return val === null || val === undefined ? '' : String(val);
  }).join(',');
}

// ═══════════════════════════════════════════
// Main Generation
// ═══════════════════════════════════════════

function main() {
  console.log('📊 Génération des données trimestrielles ARPT-QoS-Guinée 2025\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allMeasurements: Record<string, Measurement[]> = {};
  const allScores: Record<string, Score[]> = {};
  const allCampaigns: Record<string, Campaign[]> = {};
  const allAlerts: Record<string, Alert[]> = {};
  
  let totalMeasurements = 0;
  let totalScores = 0;
  let totalCampaigns = 0;
  let totalAlerts = 0;
  
  for (const operator of OPERATORS) {
    for (let qi = 0; qi < QUARTERS.length; qi++) {
      const quarter = QUARTERS[qi];
      const key = `${operator.code}-${quarter.id}`;
      const seed = hashString(key);
      const rng = new SeededRNG(seed);
      
      console.log(`  🔄 ${operator.nom} - ${quarter.label}...`);
      
      // Generate measurements: 5-8 per region per quarter (varies by operator coverage)
      const measurementsPerRegion = operator.code === 'ORANGE' ? 7 :
                                     operator.code === 'MTN' ? 6 :
                                     operator.code === 'CELCOM' ? 5 : 4;
      
      const measurements: Measurement[] = [];
      for (const region of REGIONS) {
        // Some regions have no coverage for poor operators
        const hasCoverage = rng.bool(operator.profile.coverageFactor + 0.1);
        const count = hasCoverage ? measurementsPerRegion + Math.floor(rng.range(-1, 2)) : Math.floor(rng.range(1, 3));
        
        for (let i = 0; i < count; i++) {
          // Vary measurement type
          const typeMesure = rng.pick(['MOBILE', 'INTERNET', 'DRIVE_TEST']);
          measurements.push(generateMeasurement(rng, operator, region, quarter, typeMesure));
        }
      }
      
      allMeasurements[key] = measurements;
      totalMeasurements += measurements.length;
      
      // Generate campaigns (1 per region per operator per quarter)
      const campaigns: Campaign[] = [];
      // Not all regions get campaigns - major ones first
      const campaignRegions = REGIONS.filter(r => 
        r.urban || rng.bool(operator.profile.coverageFactor * 0.6)
      );
      for (const region of campaignRegions) {
        campaigns.push(generateCampaign(operator, region, quarter, qi));
      }
      allCampaigns[key] = campaigns;
      totalCampaigns += campaigns.length;
      
      // Generate score
      const scores = [generateScore(rng, operator, quarter, qi)];
      allScores[key] = scores;
      totalScores += scores.length;
      
      // Generate alerts
      const alerts = generateAlerts(rng, operator, quarter, qi);
      allAlerts[key] = alerts;
      totalAlerts += alerts.length;
    }
  }
  
  // ═══════════════════════════════════════════
  // Write files
  // ═══════════════════════════════════════════
  
  console.log('\n📁 Écriture des fichiers...\n');
  
  // Measurements - Admin format (with operateur column)
  for (const [key, measurements] of Object.entries(allMeasurements)) {
    const [opCode, qId] = key.split('-');
    const operator = OPERATORS.find(o => o.code === opCode)!;
    
    // Admin CSV
    const adminFile = path.join(OUTPUT_DIR, `admin-mesures-${operator.code.toLowerCase()}-2025-${qId}.csv`);
    const adminCsv = [ADMIN_CSV_HEADERS.join(','), ...measurements.map(measurementToAdminCSV)].join('\n');
    fs.writeFileSync(adminFile, adminCsv, 'utf-8');
    console.log(`  ✅ ${path.basename(adminFile)} (${measurements.length} mesures)`);
    
    // Prestataire CSV (without operateur column)
    const prestFile = path.join(OUTPUT_DIR, `prestataire-mesures-${operator.code.toLowerCase()}-2025-${qId}.csv`);
    const prestCsv = [PRESTATAIRE_CSV_HEADERS.join(','), ...measurements.map(measurementToPrestataireCSV)].join('\n');
    fs.writeFileSync(prestFile, prestCsv, 'utf-8');
    console.log(`  ✅ ${path.basename(prestFile)} (${measurements.length} mesures)`);
    
    // JSON batch format for API
    const jsonFile = path.join(OUTPUT_DIR, `api-mesures-${operator.code.toLowerCase()}-2025-${qId}.json`);
    const jsonData = measurements.map(m => ({
      regionCode: m.region,
      latitude: m.latitude,
      longitude: m.longitude,
      typeMesure: m.typeMesure,
      timestamp: m.timestamp,
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
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`  ✅ ${path.basename(jsonFile)} (${measurements.length} mesures)`);
  }
  
  // Scores
  for (const [key, scores] of Object.entries(allScores)) {
    const [opCode, qId] = key.split('-');
    const operator = OPERATORS.find(o => o.code === opCode)!;
    
    // JSON format
    const jsonFile = path.join(OUTPUT_DIR, `scores-${operator.code.toLowerCase()}-2025-${qId}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(scores, null, 2), 'utf-8');
    console.log(`  ✅ ${path.basename(jsonFile)}`);
  }
  
  // Combined scores file for all operators per quarter
  for (const quarter of QUARTERS) {
    const quarterScores: Score[] = [];
    for (const operator of OPERATORS) {
      const key = `${operator.code}-${quarter.id}`;
      quarterScores.push(...allScores[key]);
    }
    const jsonFile = path.join(OUTPUT_DIR, `scores-tous-operateurs-2025-${quarter.id}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(quarterScores, null, 2), 'utf-8');
    console.log(`  ✅ ${path.basename(jsonFile)} (4 opérateurs)`);
  }
  
  // Campaigns
  for (const [key, campaigns] of Object.entries(allCampaigns)) {
    const [opCode, qId] = key.split('-');
    const operator = OPERATORS.find(o => o.code === opCode)!;
    
    const jsonFile = path.join(OUTPUT_DIR, `campagnes-${operator.code.toLowerCase()}-2025-${qId}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(campaigns, null, 2), 'utf-8');
    console.log(`  ✅ ${path.basename(jsonFile)} (${campaigns.length} campagnes)`);
  }
  
  // Alerts
  for (const [key, alerts] of Object.entries(allAlerts)) {
    const [opCode, qId] = key.split('-');
    const operator = OPERATORS.find(o => o.code === opCode)!;
    
    if (alerts.length > 0) {
      const jsonFile = path.join(OUTPUT_DIR, `alertes-${operator.code.toLowerCase()}-2025-${qId}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(alerts, null, 2), 'utf-8');
      console.log(`  ✅ ${path.basename(jsonFile)} (${alerts.length} alertes)`);
    }
  }
  
  // Combined alerts per quarter
  for (const quarter of QUARTERS) {
    const quarterAlerts: Alert[] = [];
    for (const operator of OPERATORS) {
      const key = `${operator.code}-${quarter.id}`;
      quarterAlerts.push(...allAlerts[key]);
    }
    if (quarterAlerts.length > 0) {
      const jsonFile = path.join(OUTPUT_DIR, `alertes-tous-operateurs-2025-${quarter.id}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(quarterAlerts, null, 2), 'utf-8');
      console.log(`  ✅ ${path.basename(jsonFile)} (${quarterAlerts.length} alertes)`);
    }
  }
  
  // ═══════════════════════════════════════════
  // Generate Import Guide
  // ═══════════════════════════════════════════
  
  const guide = generateImportGuide();
  const guideFile = path.join(OUTPUT_DIR, 'GUIDE-IMPORT.md');
  fs.writeFileSync(guideFile, guide, 'utf-8');
  console.log(`\n  ✅ GUIDE-IMPORT.md (instructions complètes)`);
  
  // ═══════════════════════════════════════════
  // Generate Import Scripts
  // ═══════════════════════════════════════════
  
  generateImportScripts(allMeasurements, allScores, allCampaigns, allAlerts);
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ DE LA GÉNÉRATION');
  console.log('═'.repeat(60));
  console.log(`  Mesures:    ${totalMeasurements} (≈${Math.round(totalMeasurements/16)} par opérateur/trimestre)`);
  console.log(`  Scores:     ${totalScores} (1 par opérateur/trimestre)`);
  console.log(`  Campagnes:  ${totalCampaigns}`);
  console.log(`  Alertes:    ${totalAlerts}`);
  console.log(`  Fichiers:   ${fs.readdirSync(OUTPUT_DIR).length}`);
  console.log(`  Répertoire: ${OUTPUT_DIR}`);
  console.log('═'.repeat(60));
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ═══════════════════════════════════════════
// Import Guide Generator
// ═══════════════════════════════════════════

function generateImportGuide(): string {
  return `# 📋 Guide d'Import des Données Opérateurs - ARPT-QoS-Guinée 2025

## Vue d'ensemble

Ce répertoire contient les données de production simulées pour l'année 2025,
organisées par trimestre (Q1-Q4) et par opérateur (ORANGE, MTN, CELCOM, INTERCEL).

### Structure des fichiers

\`\`\`
donnees-operateurs-2025/
├── admin-mesures-{opérateur}-2025-{Q}.csv     # Format Admin ARPT (avec colonne opérateur)
├── prestataire-mesures-{opérateur}-2025-{Q}.csv # Format Prestataire (sans colonne opérateur)
├── api-mesures-{opérateur}-2025-{Q}.json       # Format JSON pour API prestataire
├── scores-{opérateur}-2025-{Q}.json            # Scores par opérateur/trimestre
├── scores-tous-operateurs-2025-{Q}.json        # Scores combinés tous opérateurs
├── campagnes-{opérateur}-2025-{Q}.json         # Campagnes par opérateur/trimestre
├── alertes-{opérateur}-2025-{Q}.json           # Alertes par opérateur/trimestre
├── alertes-tous-operateurs-2025-{Q}.json       # Alertes combinées
├── import-par-api.sh                           # Script d'import via API Prestataire
├── import-par-admin.sh                         # Script d'import via session Admin ARPT
└── GUIDE-IMPORT.md                             # Ce fichier
\`\`\`

---

## Méthode 1 : Import via API Prestataire (Opérateurs)

Chaque opérateur dispose d'une clé API pour envoyer ses données directement.
L'endpoint détecte automatiquement l'opérateur via la clé API.

### Clés API

| Opérateur | Clé API |
|-----------|---------|
| ORANGE | \`onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ\` |
| MTN | \`onit-MTN-f3Hb7nKcP5dAqW1xY8uE\` |
| CELCOM | \`onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH\` |
| INTERCEL | \`onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ\` |

### Import des mesures (CSV)

\`\`\`bash
# Exemple : Import mesures ORANGE Q1 2025
curl -X POST http://localhost:3000/api/prestataires/mesures \\
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \\
  -H "Content-Type: text/csv" \\
  --data-binary @prestataire-mesures-orange-2025-Q1.csv
\`\`\`

### Import des mesures (JSON)

\`\`\`bash
# Exemple : Import mesures ORANGE Q1 2025 en JSON
curl -X POST http://localhost:3000/api/prestataires/mesures \\
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \\
  -H "Content-Type: application/json" \\
  -d @api-mesures-orange-2025-Q1.json
\`\`\`

### Import des scores

\`\`\`bash
# Exemple : Import score ORANGE Q1 2025
curl -X POST http://localhost:3000/api/prestataires/scores \\
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \\
  -H "Content-Type: application/json" \\
  -d @scores-orange-2025-Q1.json
\`\`\`

### Script d'import complet (tous les opérateurs, tous les trimestres)

\`\`\`bash
chmod +x import-par-api.sh
./import-par-api.sh
\`\`\`

---

## Méthode 2 : Import via Interface Admin ARPT

Connectez-vous en tant qu'administrateur ARPT, puis utilisez l'interface d'import
ou les endpoints d'administration avec authentification de session.

### Connexion

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@arpt.gn | Admin@2026! | SUPER_ADMIN |
| dg@arpt.gn | Admin@2026! | DG |
| dir.tech@arpt.gn | Admin@2026! | DIRECTEUR_TECHNIQUE |

### Import via l'interface web

1. Connectez-vous sur http://localhost:3000 avec vos identifiants
2. Allez dans la section **Import de données**
3. Téléchargez le fichier CSV admin (avec colonne opérateur)
4. L'interface gère automatiquement la création des campagnes

### Import via curl (session admin)

\`\`\`bash
# 1. Se connecter et récupérer le cookie de session
COOKIE=$(curl -s -c - http://localhost:3000/api/auth/callback/credentials \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@arpt.gn","password":"Admin@2026!"}' | grep token | awk '{print $NF}')

# 2. Importer les mesures
curl -X POST http://localhost:3000/api/import \\
  -H "Content-Type: text/csv" \\
  -b "next-auth.session-token=$COOKIE" \\
  --data-binary @admin-mesures-orange-2025-Q1.csv

# 3. Importer les scores
curl -X POST http://localhost:3000/api/import-scoring \\
  -H "Content-Type: application/json" \\
  -b "next-auth.session-token=$COOKIE" \\
  -d @scores-tous-operateurs-2025-Q1.json
\`\`\`

---

## Méthode 3 : Import via les scripts fournis

### Script API Prestataire
\`\`\`bash
chmod +x import-par-api.sh
# Importer un opérateur spécifique
./import-par-api.sh orange
# Importer tous les opérateurs
./import-par-api.sh all
\`\`\`

### Script Admin ARPT
\`\`\`bash
chmod +x import-par-admin.sh
# Importer un trimestre spécifique
./import-par-admin.sh Q1
# Importer tous les trimestres
./import-par-admin.sh all
\`\`\`

---

## Détail des formats de fichiers

### Fichier mesures Admin (CSV)
Colonnes : \`operateur, region, regionNom, latitude, longitude, typeMesure, timestamp, rssi, rsrp, rsrq, sinr, debitDescendant, debitMontant, latence, gigue, tauxAppelReussi, tauxDropCall, debitDownload, debitUpload, ping, dnsLookupTime, tcpConnectTime, scoreQoE, pageLoadTime, videoBuffering, campagne\`

### Fichier mesures Prestataire (CSV)
Colonnes : \`regionCode, latitude, longitude, typeMesure, timestamp, rssi, rsrp, rsrq, sinr, debitDescendant, debitMontant, latence, gigue, tauxAppelReussi, tauxDropCall, debitDownload, debitUpload, ping, dnsLookupTime, tcpConnectTime, scoreQoE, pageLoadTime, videoBuffering\`

### Fichier scores (JSON)
\`\`\`json
[{
  "operateur": "ORANGE",
  "periode": "2025-Q1",
  "scoreGlobal": 78.5,
  "scoreCouverture": 92.0,
  "scoreQoS": 81.3,
  "scoreQoE": 75.2,
  "scoreConformite": 62.8,
  "recommandation": "Performances satisfaisantes..."
}]
\`\`\`

---

## Régions de Guinée (16 CNT)

| Code | Région | Type |
|------|--------|------|
| CON | Conakry | Urbain |
| CYA | Coyah | Urbain |
| KIN | Kindia | Urbain |
| MAM | Mamou | Urbain |
| KAN | Kankan | Urbain |
| NZE | N'Zérékoré | Urbain |
| BOK | Boké | Rural |
| KDR | Koundara | Rural |
| LAB | Labé | Rural |
| MLI | Mali | Rural |
| DLB | Dalaba | Rural |
| FAR | Faranah | Rural |
| KDG | Kissidougou | Rural |
| SGR | Siguiri | Rural |
| GKD | Guéckédou | Rural |
| BLA | Beyla | Rural |

---

## Ordre recommandé d'import

1. **Campagnes** d'abord (les mesures référencent les campagnes)
2. **Mesures** ensuite
3. **Scores** (calculés à partir des mesures)
4. **Alertes** en dernier

Ou simplement utiliser les scripts fournis qui gèrent l'ordre automatiquement.
`;
}

// ═══════════════════════════════════════════
// Import Script Generators
// ═══════════════════════════════════════════

function generateImportScripts(
  allMeasurements: Record<string, Measurement[]>,
  allScores: Record<string, Score[]>,
  allCampaigns: Record<string, Campaign[]>,
  allAlerts: Record<string, Alert[]>
) {
  const BASE_URL = 'http://localhost:3000';
  
  // ═══════════════════════════════════
  // Script 1: Import via API Prestataire
  // ═══════════════════════════════════
  
  let apiScript = `#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Import des données via API Prestataire
# Chaque opérateur envoie ses données avec sa clé API
# ═══════════════════════════════════════════════════════════

BASE_URL="${BASE_URL}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Clés API
API_KEY_ORANGE="onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ"
API_KEY_MTN="onit-MTN-f3Hb7nKcP5dAqW1xY8uE"
API_KEY_CELCOM="onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH"
API_KEY_INTERCEL="onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ"

COLOR_GREEN='\\033[0;32m'
COLOR_BLUE='\\033[0;34m'
COLOR_YELLOW='\\033[1;33m'
COLOR_RED='\\033[0;31m'
COLOR_RESET='\\033[0m'

log_info()  { echo -e "\${COLOR_BLUE}[INFO]\${COLOR_RESET} $1"; }
log_ok()    { echo -e "\${COLOR_GREEN}[OK]\${COLOR_RESET} $1"; }
log_warn()  { echo -e "\${COLOR_YELLOW}[WARN]\${COLOR_RESET} $1"; }
log_err()   { echo -e "\${COLOR_RED}[ERREUR]\${COLOR_RESET} $1"; }

import_mesures() {
  local operateur=$1
  local api_key=$2
  local quarter=$3
  local file="\${SCRIPT_DIR}/api-mesures-\${operateur}-2025-\${quarter}.json"
  
  if [ ! -f "\${file}" ]; then
    log_warn "Fichier non trouvé: \${file}"
    return 1
  fi
  
  log_info "Import mesures \${operateur} \${quarter}..."
  response=$(curl -s -w "\\n%{http_code}" -X POST "\${BASE_URL}/api/prestataires/mesures" \\
    -H "X-API-Key: \${api_key}" \\
    -H "Content-Type: application/json" \\
    -d @"\${file}")
  
  http_code=$(echo "\${response}" | tail -1)
  body=$(echo "\${response}" | head -n -1)
  
  if [ "\${http_code}" = "200" ] || [ "\${http_code}" = "201" ]; then
    log_ok "Mesures \${operateur} \${quarter} importées (\${http_code})"
  else
    log_err "Mesures \${operateur} \${quarter} - HTTP \${http_code}: \${body}"
  fi
}

import_scores() {
  local operateur=$1
  local api_key=$2
  local quarter=$3
  local file="\${SCRIPT_DIR}/scores-\${operateur}-2025-\${quarter}.json"
  
  if [ ! -f "\${file}" ]; then
    log_warn "Fichier non trouvé: \${file}"
    return 1
  fi
  
  log_info "Import scores \${operateur} \${quarter}..."
  response=$(curl -s -w "\\n%{http_code}" -X POST "\${BASE_URL}/api/prestataires/scores" \\
    -H "X-API-Key: \${api_key}" \\
    -H "Content-Type: application/json" \\
    -d @"\${file}")
  
  http_code=$(echo "\${response}" | tail -1)
  body=$(echo "\${response}" | head -n -1)
  
  if [ "\${http_code}" = "200" ] || [ "\${http_code}" = "201" ]; then
    log_ok "Scores \${operateur} \${quarter} importés (\${http_code})"
  else
    log_err "Scores \${operateur} \${quarter} - HTTP \${http_code}: \${body}"
  fi
}

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

OPERATEUR=\${1:-all}
QUARTERS="Q1 Q2 Q3 Q4"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import via API Prestataire - ARPT-QoS-Guinée 2025"
echo "════════════════════════════════════════════════════════"
echo ""

case "\${OPERATEUR}" in
  orange|ORANGE)
    for q in \${QUARTERS}; do
      import_mesures "orange" "\${API_KEY_ORANGE}" "\${q}"
      import_scores "orange" "\${API_KEY_ORANGE}" "\${q}"
      sleep 2
    done
    ;;
  mtn|MTN)
    for q in \${QUARTERS}; do
      import_mesures "mtn" "\${API_KEY_MTN}" "\${q}"
      import_scores "mtn" "\${API_KEY_MTN}" "\${q}"
      sleep 2
    done
    ;;
  celcom|CELCOM)
    for q in \${QUARTERS}; do
      import_mesures "celcom" "\${API_KEY_CELCOM}" "\${q}"
      import_scores "celcom" "\${API_KEY_CELCOM}" "\${q}"
      sleep 2
    done
    ;;
  intercel|INTERCEL)
    for q in \${QUARTERS}; do
      import_mesures "intercel" "\${API_KEY_INTERCEL}" "\${q}"
      import_scores "intercel" "\${API_KEY_INTERCEL}" "\${q}"
      sleep 2
    done
    ;;
  all)
    for q in \${QUARTERS}; do
      echo ""
      echo "── Trimestre \${q} ──"
      import_mesures "orange" "\${API_KEY_ORANGE}" "\${q}"
      import_mesures "mtn" "\${API_KEY_MTN}" "\${q}"
      import_mesures "celcom" "\${API_KEY_CELCOM}" "\${q}"
      import_mesures "intercel" "\${API_KEY_INTERCEL}" "\${q}"
      import_scores "orange" "\${API_KEY_ORANGE}" "\${q}"
      import_scores "mtn" "\${API_KEY_MTN}" "\${q}"
      import_scores "celcom" "\${API_KEY_CELCOM}" "\${q}"
      import_scores "intercel" "\${API_KEY_INTERCEL}" "\${q}"
      sleep 3
    done
    ;;
  *)
    echo "Usage: $0 {orange|mtn|celcom|intercel|all}"
    exit 1
    ;;
esac

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import terminé !"
echo "════════════════════════════════════════════════════════"
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'import-par-api.sh'), apiScript, 'utf-8');
  console.log('  ✅ import-par-api.sh');
  
  // ═══════════════════════════════════
  // Script 2: Import via Admin ARPT
  // ═══════════════════════════════════
  
  let adminScript = `#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Import des données via Admin ARPT (session auth)
# L'admin ARPT importe les données de tous les opérateurs
# ═══════════════════════════════════════════════════════════

BASE_URL="${BASE_URL}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

COLOR_GREEN='\\033[0;32m'
COLOR_BLUE='\\033[0;34m'
COLOR_YELLOW='\\033[1;33m'
COLOR_RED='\\033[0;31m'
COLOR_RESET='\\033[0m'

log_info()  { echo -e "\${COLOR_BLUE}[INFO]\${COLOR_RESET} $1"; }
log_ok()    { echo -e "\${COLOR_GREEN}[OK]\${COLOR_RESET} $1"; }
log_warn()  { echo -e "\${COLOR_YELLOW}[WARN]\${COLOR_RESET} $1"; }
log_err()   { echo -e "\${COLOR_RED}[ERREUR]\${COLOR_RESET} $1"; }

# 1. Authentification
log_info "Authentification admin@arpt.gn..."

# Obtenir le cookie CSRF
CSRF_RESPONSE=$(curl -s -c /tmp/arpt-cookies.txt "\${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo "\${CSRF_RESPONSE}" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Login
LOGIN_RESPONSE=$(curl -s -c /tmp/arpt-cookies.txt -b /tmp/arpt-cookies.txt \\
  -X POST "\${BASE_URL}/api/auth/callback/credentials" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email=admin@arpt.gn&password=Admin%402026!&csrfToken=\${CSRF_TOKEN}")

if [ -z "\${LOGIN_RESPONSE}" ]; then
  log_err "Échec d'authentification"
  exit 1
fi
log_ok "Authentifié avec succès"

# Import mesures via endpoint admin
import_mesures_admin() {
  local file=$1
  local label=$2
  
  if [ ! -f "\${file}" ]; then
    log_warn "Fichier non trouvé: \${file}"
    return 1
  fi
  
  log_info "Import mesures: \${label}..."
  response=$(curl -s -w "\\n%{http_code}" -X POST "\${BASE_URL}/api/import" \\
    -b /tmp/arpt-cookies.txt \\
    -H "Content-Type: text/csv" \\
    --data-binary @"\${file}")
  
  http_code=$(echo "\${response}" | tail -1)
  body=$(echo "\${response}" | head -n -1)
  
  if [ "\${http_code}" = "200" ] || [ "\${http_code}" = "201" ]; then
    log_ok "Mesures \${label} importées"
  else
    log_err "Mesures \${label} - HTTP \${http_code}"
    echo "\${body}" | head -c 200
    echo ""
  fi
}

# Import scores via endpoint admin
import_scores_admin() {
  local file=$1
  local label=$2
  
  if [ ! -f "\${file}" ]; then
    log_warn "Fichier non trouvé: \${file}"
    return 1
  fi
  
  log_info "Import scores: \${label}..."
  response=$(curl -s -w "\\n%{http_code}" -X POST "\${BASE_URL}/api/import-scoring" \\
    -b /tmp/arpt-cookies.txt \\
    -H "Content-Type: application/json" \\
    -d @"\${file}")
  
  http_code=$(echo "\${response}" | tail -1)
  body=$(echo "\${response}" | head -n -1)
  
  if [ "\${http_code}" = "200" ] || [ "\${http_code}" = "201" ]; then
    log_ok "Scores \${label} importés"
  else
    log_err "Scores \${label} - HTTP \${http_code}"
    echo "\${body}" | head -c 200
    echo ""
  fi
}

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

QUARTER=\${1:-all}
OPERATORS="orange mtn celcom intercel"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import via Admin ARPT - ARPT-QoS-Guinée 2025"
echo "════════════════════════════════════════════════════════"
echo ""

if [ "\${QUARTER}" = "all" ]; then
  QUARTERS="Q1 Q2 Q3 Q4"
else
  QUARTERS="\${QUARTER}"
fi

for q in \${QUARTERS}; do
  echo ""
  echo "── Trimestre \${q} ──"
  
  # Import mesures (format admin avec colonne opérateur)
  for op in \${OPERATORS}; do
    import_mesures_admin "\${SCRIPT_DIR}/admin-mesures-\${op}-2025-\${q}.csv" "\${op} \${q}"
    sleep 1
  done
  
  # Import scores (tous opérateurs combinés)
  import_scores_admin "\${SCRIPT_DIR}/scores-tous-operateurs-2025-\${q}.json" "tous \${q}"
  
  sleep 2
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import terminé !"
echo "════════════════════════════════════════════════════════"
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'import-par-admin.sh'), adminScript, 'utf-8');
  console.log('  ✅ import-par-admin.sh');
}

// Run
main();

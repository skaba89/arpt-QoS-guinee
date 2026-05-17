/**
 * ============================================================================
 * DONNÉES DE TEST E2E — ONIT-PNG
 * ============================================================================
 * Ce fichier contient toutes les données de test réutilisables pour les tests
 * end-to-end : identifiants de connexion, payloads API, données de référence.
 * ============================================================================
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IDENTIFIANTS DE CONNEXION (depuis prisma/seed.ts)
// Tous les utilisateurs partagent le mot de passe : Admin@2026!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEFAULT_PASSWORD = "Admin@2026!";

export const TEST_USERS = {
  superAdmin: {
    email: "admin@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "SUPER_ADMIN",
    organization: "ARPT",
    name: "Administrateur Système",
  },
  dg: {
    email: "dg@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "DG",
    organization: "ARPT",
    name: "Directeur Général",
  },
  dga: {
    email: "dga@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "DGA",
    organization: "ARPT",
    name: "Directeur Général Adjoint",
  },
  dirTech: {
    email: "dir.tech@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "DIRECTEUR_TECHNIQUE",
    organization: "ARPT",
    name: "Directeur Technique",
  },
  ingenieurRF: {
    email: "ing.rf@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "INGENIEUR_RF",
    organization: "ARPT",
    name: "Ingénieur RF",
  },
  analysteQoS: {
    email: "analyste@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "ANALYSTE_QOS",
    organization: "ARPT",
    name: "Analyste QoS",
  },
  auditeur: {
    email: "auditeur@arpt.gn",
    password: DEFAULT_PASSWORD,
    role: "AUDITEUR",
    organization: "ARPT",
    name: "Auditeur Terrain",
  },
  operateurOrange: {
    email: "tech@orange.gn",
    password: DEFAULT_PASSWORD,
    role: "OPERATEUR_READONLY",
    organization: "Orange Guinée",
    name: "Technicien Orange",
  },
  operateurMTN: {
    email: "tech@mtn.gn",
    password: DEFAULT_PASSWORD,
    role: "OPERATEUR_READONLY",
    organization: "MTN Guinée",
    name: "Technicien MTN",
  },
  operateurCelcom: {
    email: "tech@celcom.gn",
    password: DEFAULT_PASSWORD,
    role: "OPERATEUR_READONLY",
    organization: "Celcom Guinée",
    name: "Technicien Celcom",
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CODES OPÉRATEURS & RÉGIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const OPERATOR_CODES = {
  orange: "ORG",
  mtn: "MTN",
  celcom: "CEL",
} as const;

export const REGION_CODES = {
  conakry: "CKY",
  kindia: "KND",
  boke: "BOK",
  labe: "LAB",
  mamou: "MAM",
  faranah: "FRN",
  kankan: "KNK",
  nzerekore: "NZR",
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES DE MESURES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MESURE_TYPES = [
  "MOBILE",
  "INTERNET",
  "RF_DRIVE",
  "WALK_TEST",
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES DE CAMPAGNES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CAMPAIGN_TYPES = [
  "DRIVE_TEST",
  "WALK_TEST",
  "QOS_INTERNET",
  "QOS_MOBILE",
] as const;

export const CAMPAIGN_STATUSES = [
  "PLANIFIEE",
  "EN_COURS",
  "TERMINEE",
  "ANNULEE",
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES D'ALERTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ALERT_TYPES = [
  "DEGRADATION",
  "SEUIL_DEPASSE",
  "NON_CONFORMITE",
  "ZONE_BLANCHE",
  "SIGNALEMENT_PUBLIC",
] as const;

export const ALERT_SEVERITIES = [
  "CRITIQUE",
  "HAUTE",
  "MOYENNE",
  "BASSE",
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATUTS DE RAPPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const REPORT_STATUSES = [
  "PLANIFIE",
  "EN_COURS",
  "GENERE",
  "PUBLIE",
  "ARCHIVE",
] as const;

export const REPORT_TYPES = [
  "REGLEMENTAIRE",
  "OPERATEUR",
  "PUBLIC",
  "INTERNE",
  "BENCHMARK",
] as const;

export const REPORT_FORMATS = ["PDF", "XLSX", "CSV"] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYLOADS EXEMPLES POUR LES APIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Exemple de payload pour POST /api/mesures (création unique) */
export const MESURE_PAYLOAD = {
  operatorCode: "ORG",
  regionCode: "CKY",
  campagneNom: "Drive Test Conakry Q1 2026",  // Must match existing campaign
  latitude: 9.5092,
  longitude: -13.7122,
  timestamp: "2026-03-15T10:30:00Z",
  typeMesure: "MOBILE",
  // RF Metrics
  rssi: -75,
  rsrp: -95,
  rsrq: -10,
  sinr: 12,
  // Network Metrics
  latence: 45,
  debitDescendant: 25.5,
  debitMontant: 8.3,
  gigue: 5,
  tauxAppelReussi: 97,
  tauxDropCall: 1.5,
  // Internet Metrics
  debitDownload: 22.5,
  debitUpload: 7.8,
  ping: 42,
  dnsLookupTime: 15,
  tcpConnectTime: 35,
  // QoE Metrics
  scoreQoE: 82,
  pageLoadTime: 1200,
  videoBuffering: 0.5,
};

/** Exemple de payload pour POST /api/mesures — import JSON en masse (PUT) */
export const MESURE_BULK_JSON_PAYLOAD = {
  campagneId: "",  // Will be filled dynamically
  mesures: [
    {
      operatorCode: "ORG",
      regionCode: "CKY",
      latitude: 9.5092,
      longitude: -13.7122,
      timestamp: "2026-04-01T08:00:00Z",
      typeMesure: "MOBILE",
      rssi: -72, rsrp: -90, rsrq: -9, sinr: 14,
      latence: 40, debitDescendant: 28, debitMontant: 9, gigue: 4,
      tauxAppelReussi: 98, tauxDropCall: 1,
      scoreQoE: 85, pageLoadTime: 1100, videoBuffering: 0.3,
    },
    {
      operatorCode: "MTN",
      regionCode: "CKY",
      latitude: 9.5250,
      longitude: -13.6850,
      timestamp: "2026-04-01T08:05:00Z",
      typeMesure: "INTERNET",
      rssi: -78, rsrp: -98, rsrq: -11, sinr: 10,
      latence: 55, debitDescendant: 20, debitMontant: 6, gigue: 7,
      debitDownload: 18, debitUpload: 5, ping: 50,
      dnsLookupTime: 20, tcpConnectTime: 40,
      scoreQoE: 75, pageLoadTime: 1500, videoBuffering: 0.8,
    },
    {
      operatorCode: "CEL",
      regionCode: "KND",
      latitude: 10.0580,
      longitude: -12.8600,
      timestamp: "2026-04-01T09:00:00Z",
      typeMesure: "RF_DRIVE",
      rssi: -85, rsrp: -105, rsrq: -13, sinr: 6,
      latence: 80, debitDescendant: 12, debitMontant: 3, gigue: 12,
      tauxAppelReussi: 90, tauxDropCall: 5,
      scoreQoE: 60, pageLoadTime: 2500, videoBuffering: 2.1,
    },
  ],
};

/** Exemple de contenu CSV pour PUT /api/mesures (import CSV) */
export const MESURE_CSV_CONTENT = `operatorCode,regionCode,latitude,longitude,timestamp,typeMesure,rssi,rsrp,rsrq,sinr,latence,debitDescendant,debitMontant,gigue,tauxAppelReussi,tauxDropCall,debitDownload,debitUpload,ping,dnsLookupTime,tcpConnectTime,scoreQoE,pageLoadTime,videoBuffering
ORG,CKY,9.5092,-13.7122,2026-04-02T10:00:00Z,MOBILE,-70,-88,-8,16,35,30,10,3,99,0.5,26,9,38,12,30,88,950,0.2
MTN,CKY,9.5200,-13.6900,2026-04-02T10:05:00Z,MOBILE,-80,-100,-12,8,60,18,5,8,94,2,15,4,55,25,45,70,1800,1.0
CEL,KND,10.0600,-12.8700,2026-04-02T10:10:00Z,INTERNET,-88,-108,-14,5,90,10,2,15,88,4,8,2,80,30,55,55,3000,2.5`;

/** Exemple de payload pour POST /api/alerts */
export const ALERT_PAYLOAD = {
  type: "DEGRADATION",
  severity: "HAUTE",
  message: "Dégradation signal Orange à Conakry — RSSI moyen passé sous -100 dBm",
  details: "Zone concernée: Kaloum, Dixinn. Durée: depuis 2h. Impact: ~5000 abonnés.",
  operatorCode: "ORG",
  regionCode: "CKY",
};

/** Exemple de payload pour POST /api/alerts — signalement public */
export const PUBLIC_SIGNALMENT_PAYLOAD = {
  type: "SIGNALEMENT_PUBLIC",
  severity: "MOYENNE",
  message: "Pas de réseau MTN à Mamou depuis ce matin",
  regionCode: "MAM",
};

/** Exemple de payload pour POST /api/campaigns */
export const CAMPAIGN_PAYLOAD = {
  nom: "Campagne Test E2E Conakry Q2 2026",
  type: "QOS_INTERNET",
  operateurId: "",  // Will be filled dynamically
  regionId: "",     // Will be filled dynamically
  dateDebut: "2026-04-01T00:00:00Z",
  dateFin: "2026-04-30T23:59:59Z",
  responsable: "Ibrahim Diallo",
};

/** Exemple de payload pour POST /api/reports */
export const REPORT_PAYLOAD = {
  titre: "Rapport QoS Conakry Q1 2026",
  type: "REGLEMENTAIRE",
  format: "PDF",
  contenu: JSON.stringify({
    periode: "2026-Q1",
    region: "Conakry",
    operateurs: ["Orange", "MTN", "Celcom"],
    resume: "Rapport de qualité de service pour la région de Conakry au T1 2026.",
    indicateurs: {
      couverture: 78,
      scoreQoS: 72,
      conformite: 85,
    },
  }),
  isPublic: false,
};

/** Exemple de payload pour POST /api/scores */
export const SCORE_PAYLOAD = {
  operatorCode: "ORG",
  periode: "2026-Q2",
  scoreGlobal: 76,
  scoreCouverture: 80,
  scoreQoS: 72,
  scoreQoE: 75,
  scoreConformite: 88,
  recommandation: "Maintenir les investissements en couverture rurale.",
};

/** Exemple de payload pour POST /api/users */
export const NEW_USER_PAYLOAD = {
  email: "test.e2e@arpt.gn",
  name: "Utilisateur Test E2E",
  password: "Test@2026!E2E",
  roleId: "",  // Will be filled dynamically (ANALYSTE_QOS)
  organization: "ARPT",
};

/** Exemple de payload pour POST /api/roles — nouveau rôle */
export const NEW_ROLE_PAYLOAD = {
  name: "TEST_E2E_ROLE",
  description: "Rôle créé par les tests E2E — à nettoyer après les tests",
  permissions: [
    { resource: "dashboard", action: "read" },
    { resource: "campaign", action: "read" },
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COORDONNÉES GPS DE RÉFÉRENCE (Guinée)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GUINEA_COORDS = {
  conakryCenter: { lat: 9.5092, lng: -13.7122 },
  kindiaCenter: { lat: 10.0580, lng: -12.8600 },
  bokeCenter: { lat: 10.9333, lng: -14.3000 },
  labeCenter: { lat: 11.3167, lng: -12.5000 },
  mamouCenter: { lat: 10.5000, lng: -12.0833 },
  faranahCenter: { lat: 10.0333, lng: -10.7333 },
  kankanCenter: { lat: 10.3833, lng: -9.3000 },
  nzerekoreCenter: { lat: 7.7500, lng: -8.8167 },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RÉGIONS CNT (16 régions)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CNT_REGIONS = [
  "Conakry", "Coyah", "Dubréka", "Forécariah", "Kindia",
  "Boké", "Gaoual", "Koundara", "Labé", "Lélouma",
  "Mamou", "Dalaba", "Faranah", "Dabola", "Kankan", "N'Zérékoré",
] as const;

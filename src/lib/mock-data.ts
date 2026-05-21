// ONIT-PNG Mock Data - All data for the national telecom supervision platform

export type OperatorId = 'orange' | 'mtn' | 'celcom' | 'intercel';

export interface Operator {
  id: OperatorId;
  name: string;
  color: string;
  score: number;
  trend: number;
  subscores: {
    couverture: number;
    qos: number;
    qoe: number;
    conformite: number;
    innovation: number;
    investissement: number;
  };
  historicalScores: number[];
}

export interface Region {
  name: string;
  coverage: number;
  qos: number;
  population: number;
  whiteZones: number;
  color: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  operator: string;
  region: string;
  message: string;
  time: string;
}

export interface Campaign {
  id: string;
  name: string;
  date: string;
  type: string;
  operator: string;
  region: string;
  status: 'completed' | 'in_progress' | 'planned';
}

export interface AuditResult {
  id: string;
  metric: string;
  operator: string;
  value: string;
  threshold: string;
  status: 'pass' | 'fail';
}

export interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  format: string;
  size: string;
  status: 'ready' | 'generating' | 'scheduled';
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  ip: string;
}

// Operators
export const operators: Operator[] = [
  {
    id: 'orange',
    name: 'Orange Guinée',
    color: '#FF7900',
    score: 78,
    trend: 2.1,
    subscores: {
      couverture: 82,
      qos: 76,
      qoe: 79,
      conformite: 85,
      innovation: 71,
      investissement: 75,
    },
    historicalScores: [70, 71, 73, 72, 74, 75, 73, 76, 75, 77, 76, 78],
  },
  {
    id: 'mtn',
    name: 'MTN Guinée',
    color: '#FFCC00',
    score: 74,
    trend: -0.8,
    subscores: {
      couverture: 76,
      qos: 72,
      qoe: 74,
      conformite: 78,
      innovation: 68,
      investissement: 72,
    },
    historicalScores: [68, 70, 71, 73, 72, 74, 73, 75, 74, 73, 74, 74],
  },
  {
    id: 'celcom',
    name: 'Celcom Guinée',
    color: '#00B4D8',
    score: 65,
    trend: 1.5,
    subscores: {
      couverture: 58,
      qos: 62,
      qoe: 64,
      conformite: 70,
      innovation: 60,
      investissement: 65,
    },
    historicalScores: [55, 56, 58, 59, 60, 61, 59, 62, 63, 62, 64, 65],
  },
  {
    id: 'intercel',
    name: 'Intercel Guinée',
    color: '#8B5CF6',
    score: 48,
    trend: -1.2,
    subscores: {
      couverture: 38,
      qos: 44,
      qoe: 46,
      conformite: 55,
      innovation: 35,
      investissement: 42,
    },
    historicalScores: [52, 51, 50, 49, 50, 48, 49, 47, 48, 47, 48, 48],
  },
];

// Regions of Guinea (Ancien découpage - 8 régions)
export const regions: Region[] = [
  { name: 'Conakry', coverage: 92, qos: 85, population: 2042000, whiteZones: 3, color: '#10B981' },
  { name: 'Kindia', coverage: 71, qos: 68, population: 1836000, whiteZones: 28, color: '#3B82F6' },
  { name: 'Boké', coverage: 55, qos: 52, population: 1143000, whiteZones: 42, color: '#F59E0B' },
  { name: 'Labé', coverage: 63, qos: 60, population: 1242000, whiteZones: 35, color: '#F59E0B' },
  { name: 'Mamou', coverage: 68, qos: 65, population: 932000, whiteZones: 25, color: '#3B82F6' },
  { name: 'Faranah', coverage: 48, qos: 45, population: 942000, whiteZones: 48, color: '#EF4444' },
  { name: 'Kankan', coverage: 61, qos: 58, population: 1976000, whiteZones: 32, color: '#F59E0B' },
  { name: "N'Zérékoré", coverage: 52, qos: 49, population: 1715000, whiteZones: 21, color: '#EF4444' },
];

// Nouveau découpage CNT - 16 régions
export const cntRegions: Region[] = [
  { name: 'Conakry', coverage: 92, qos: 85, population: 2042000, whiteZones: 3, color: '#10B981' },
  { name: 'Kindia', coverage: 71, qos: 68, population: 825000, whiteZones: 18, color: '#3B82F6' },
  { name: 'Coyah', coverage: 76, qos: 72, population: 411000, whiteZones: 10, color: '#3B82F6' },
  { name: 'Boké', coverage: 55, qos: 52, population: 543000, whiteZones: 22, color: '#F59E0B' },
  { name: 'Koundara', coverage: 42, qos: 38, population: 600000, whiteZones: 32, color: '#EF4444' },
  { name: 'Labé', coverage: 63, qos: 60, population: 650000, whiteZones: 18, color: '#F59E0B' },
  { name: 'Mali', coverage: 48, qos: 44, population: 592000, whiteZones: 28, color: '#EF4444' },
  { name: 'Mamou', coverage: 68, qos: 65, population: 532000, whiteZones: 12, color: '#3B82F6' },
  { name: 'Dalaba', coverage: 58, qos: 55, population: 400000, whiteZones: 15, color: '#F59E0B' },
  { name: 'Faranah', coverage: 48, qos: 45, population: 510000, whiteZones: 25, color: '#EF4444' },
  { name: 'Kissidougou', coverage: 44, qos: 41, population: 432000, whiteZones: 30, color: '#EF4444' },
  { name: 'Kankan', coverage: 61, qos: 58, population: 1050000, whiteZones: 16, color: '#F59E0B' },
  { name: 'Siguiri', coverage: 53, qos: 50, population: 926000, whiteZones: 22, color: '#F59E0B' },
  { name: "N'Zérékoré", coverage: 52, qos: 49, population: 756000, whiteZones: 8, color: '#EF4444' },
  { name: 'Guéckédou', coverage: 46, qos: 43, population: 545000, whiteZones: 14, color: '#EF4444' },
  { name: 'Beyla', coverage: 50, qos: 47, population: 414000, whiteZones: 11, color: '#F59E0B' },
];

// KPI Data — defaults set to 0; real data comes from /api/dashboard
export const kpiData = {
  couvertureNationale: { value: 0, unit: '%', trend: 0, label: 'Couverture Nationale' },
  scoreQosGlobal: { value: 0, unit: '/100', trend: 0, label: 'Score QoS Global' },
  zonesBlanches: { value: 0, unit: '', trend: 0, label: 'Zones Blanches' },
  populationCouverte: { value: 0, unit: 'M', trend: 0, trendUnit: 'K', label: 'Population Couverte' },
};

// QoS Metrics
export const qosMetrics = {
  latency: { value: 42, unit: 'ms', label: 'Latence Moyenne', trend: -3 },
  debit: { value: 18.5, unit: 'Mbps', label: 'Débit Moyen', trend: 1.2 },
  tauxAppel: { value: 94.2, unit: '%', label: 'Taux Appel Réussi', trend: 0.5 },
  jitter: { value: 8, unit: 'ms', label: 'Jitter', trend: -1 },
};

// QoS Trend data (6 months)
export const qosTrendData = {
  months: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
  orange: [75, 76, 74, 77, 76, 78],
  mtn: [72, 73, 71, 74, 73, 74],
  celcom: [60, 62, 61, 63, 64, 65],
  intercel: [50, 49, 48, 49, 47, 48],
};

// Benchmark data
export const benchmarkData = [
  { metric: 'Latence (ms)', orange: 38, mtn: 45, celcom: 55, intercel: 78, threshold: 50 },
  { metric: 'Débit (Mbps)', orange: 22, mtn: 18, celcom: 12, intercel: 6, threshold: 15 },
  { metric: 'Taux Appel (%)', orange: 96, mtn: 93, celcom: 89, intercel: 78, threshold: 90 },
  { metric: 'Jitter (ms)', orange: 6, mtn: 9, celcom: 14, intercel: 22, threshold: 10 },
  { metric: 'Disponibilité (%)', orange: 99.2, mtn: 98.5, celcom: 97.1, intercel: 93.5, threshold: 98 },
];

// Alerts
export const alerts: Alert[] = [
  { id: '1', type: 'critical', operator: 'Celcom', region: 'Faranah', message: 'Dégradation critique QoS - Latence > 100ms', time: 'Il y a 12 min' },
  { id: '2', type: 'warning', operator: 'MTN', region: 'Boké', message: 'Chute débit mobile en zone rurale (-35%)', time: 'Il y a 45 min' },
  { id: '3', type: 'critical', operator: 'Celcom', region: "N'Zérékoré", message: 'Taux d\'appel réussi < 85% - Seuil réglementaire', time: 'Il y a 1h' },
  { id: '4', type: 'warning', operator: 'Orange', region: 'Labé', message: 'Couverture 4G en baisse - Incident signalé', time: 'Il y a 2h' },
  { id: '5', type: 'info', operator: 'MTN', region: 'Conakry', message: 'Maintenance planifiée - 22h00-04h00', time: 'Il y a 3h' },
  { id: '6', type: 'critical', operator: 'Intercel', region: 'Faranah', message: 'Zone blanche étendue - Aucun signal détecté', time: 'Il y a 20 min' },
  { id: '7', type: 'warning', operator: 'Intercel', region: 'Kankan', message: 'Couverture 2G en dessous du seuil réglementaire', time: 'Il y a 1h30' },
];

// Campaigns
export const campaigns: Campaign[] = [
  { id: '1', name: 'Campagne QoS Q1 2026', date: '2026-01-15', type: 'Drive Test', operator: 'Orange', region: 'Conakry', status: 'completed' },
  { id: '2', name: 'Audit Couverture Rural', date: '2026-02-20', type: 'Walk Test', operator: 'MTN', region: 'Kindia', status: 'completed' },
  { id: '3', name: 'Test FAI Conakry', date: '2026-03-10', type: 'FAI Test', operator: 'Orange', region: 'Conakry', status: 'in_progress' },
  { id: '4', name: 'Benchmark National', date: '2026-04-01', type: 'Drive Test', operator: 'Multi', region: 'National', status: 'in_progress' },
  { id: '5', name: 'Audit Zone Blanche', date: '2026-04-15', type: 'Walk Test', operator: 'Celcom', region: 'Faranah', status: 'planned' },
  { id: '6', name: 'Test 4G Kankan', date: '2026-05-01', type: 'Drive Test', operator: 'MTN', region: 'Kankan', status: 'planned' },
];

// Audit results
export const auditResults: AuditResult[] = [
  { id: '1', metric: 'Latence', operator: 'Orange', value: '38ms', threshold: '<50ms', status: 'pass' },
  { id: '2', metric: 'Latence', operator: 'MTN', value: '45ms', threshold: '<50ms', status: 'pass' },
  { id: '3', metric: 'Latence', operator: 'Celcom', value: '55ms', threshold: '<50ms', status: 'fail' },
  { id: '4', metric: 'Latence', operator: 'Intercel', value: '78ms', threshold: '<50ms', status: 'fail' },
  { id: '5', metric: 'Débit', operator: 'Orange', value: '22Mbps', threshold: '>15Mbps', status: 'pass' },
  { id: '6', metric: 'Débit', operator: 'MTN', value: '18Mbps', threshold: '>15Mbps', status: 'pass' },
  { id: '7', metric: 'Débit', operator: 'Celcom', value: '12Mbps', threshold: '>15Mbps', status: 'fail' },
  { id: '8', metric: 'Débit', operator: 'Intercel', value: '6Mbps', threshold: '>15Mbps', status: 'fail' },
  { id: '9', metric: 'Taux Appel', operator: 'Orange', value: '96%', threshold: '>90%', status: 'pass' },
  { id: '10', metric: 'Taux Appel', operator: 'MTN', value: '93%', threshold: '>90%', status: 'pass' },
  { id: '11', metric: 'Taux Appel', operator: 'Celcom', value: '89%', threshold: '>90%', status: 'fail' },
  { id: '12', metric: 'Taux Appel', operator: 'Intercel', value: '78%', threshold: '>90%', status: 'fail' },
];

// Reports
export const reports: Report[] = [
  { id: '1', title: 'Rapport QoS Trimestriel T1 2026', type: 'Réglementaire', date: '2026-03-31', format: 'PDF', size: '4.2 MB', status: 'ready' },
  { id: '2', title: 'Benchmark Opérateurs - Mars 2026', type: 'Opérateur', date: '2026-03-28', format: 'PDF', size: '3.8 MB', status: 'ready' },
  { id: '3', title: 'Couverture Nationale - Rapport Annuel', type: 'Public', date: '2026-03-15', format: 'PDF', size: '8.1 MB', status: 'ready' },
  { id: '4', title: 'Audit Terrain - Zone Faranah', type: 'Audit', date: '2026-04-05', format: 'XLSX', size: '2.3 MB', status: 'ready' },
  { id: '5', title: 'Score Card Opérateurs Q1', type: 'Opérateur', date: '2026-04-10', format: 'PDF', size: '1.9 MB', status: 'generating' },
  { id: '6', title: 'Rapport Cybersécurité Mensuel', type: 'Réglementaire', date: '2026-04-15', format: 'PDF', size: '-', status: 'scheduled' },
];

// Security data
export const securityData = {
  overallScore: 92,
  rbacStatus: 'Actif',
  encryptionStatus: 'Chiffrement AES-256 actif',
  complianceScore: 88,
  activeThreats: 1,
  lastAudit: '2026-04-01',
  twoFactorEnabled: true,
  dataResidency: 'Guinée - Conformité SOA',
};

// Audit log
export const auditLog: AuditLogEntry[] = [
  { id: '1', user: 'admin@arpt.gn', action: 'Connexion', target: 'Système', time: '14:32', ip: '196.128.xx.xx' },
  { id: '2', user: 'analyst@arpt.gn', action: 'Export rapport', target: 'Rapport QoS T1', time: '14:15', ip: '196.128.xx.xx' },
  { id: '3', user: 'admin@arpt.gn', action: 'Modification', target: 'Seuils QoS', time: '13:45', ip: '196.128.xx.xx' },
  { id: '4', user: 'inspecteur@arpt.gn', action: 'Création campagne', target: 'Audit Faranah', time: '12:30', ip: '196.129.xx.xx' },
  { id: '5', user: 'system', action: 'Alerte auto', target: 'Seuil dépassé Celcom', time: '11:00', ip: 'localhost' },
  { id: '6', user: 'dg@arpt.gn', action: 'Visualisation', target: 'Tableau de Bord', time: '10:15', ip: '196.128.xx.xx' },
];

// Report templates
export const reportTemplates = [
  { name: 'Rapport QoS Trimestriel', type: 'Réglementaire', icon: 'FileText' },
  { name: 'Benchmark Opérateurs', type: 'Comparatif', icon: 'BarChart3' },
  { name: 'Score Card Mensuel', type: 'Opérateur', icon: 'Award' },
  { name: 'Rapport Public Annuel', type: 'Public', icon: 'Globe' },
  { name: 'Export Données Brutes', type: 'Excel', icon: 'FileSpreadsheet' },
  { name: 'Rapport Cybersécurité', type: 'Sécurité', icon: 'Shield' },
];

// Public FAQ
export const faqData = [
  { q: 'Comment la qualité du réseau est-elle mesurée ?', a: 'La QoS est mesurée via des tests automatisés (drive tests, walk tests) et des données collectées en temps réel auprès des opérateurs, conformément aux standards de l\'UIT.' },
  { q: 'Qu\'est-ce qu\'une zone blanche ?', a: 'Une zone blanche est une zone géographique sans couverture mobile ou internet d\'aucun opérateur. L\'ARPT travaille à réduire ces zones.' },
  { q: 'Comment signaler un problème de réseau ?', a: 'Vous pouvez utiliser le formulaire "Signaler un problème" sur ce portail, ou contacter l\'ARPT par téléphone au +224 xxx xxxx.' },
  { q: 'À quelle fréquence les données sont-elles mises à jour ?', a: 'Les indicateurs de QoS sont mis à jour en temps réel. Les rapports détaillés sont publiés trimestriellement.' },
  { q: 'Quels sont les seuils réglementaires ?', a: 'Les seuils sont définis par les spécifications techniques de l\'ARPT : latence <50ms, débit >15Mbps, taux d\'appel réussi >90%.' },
];

// Navigation tabs
export const navTabs = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard' },
  { id: 'qos', label: 'Monitoring QoS', icon: 'Activity' },
  { id: 'sig', label: 'Cartographie SIG', icon: 'Map' },
  { id: 'scoring', label: 'Scoring Opérateurs', icon: 'Award' },
  { id: 'audit', label: 'Audit Terrain', icon: 'ClipboardCheck' },
  { id: 'reports', label: 'Rapports', icon: 'FileText' },
  { id: 'public', label: 'Portail Public', icon: 'Globe' },
  { id: 'cyber', label: 'Cybersécurité', icon: 'Shield' },
];

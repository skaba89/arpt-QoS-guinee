import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ONIT-PNG database...');

  // ═══════════════════════════════════════════
  // 1. Create Roles with Permissions
  // ═══════════════════════════════════════════
  const roleDefinitions: { name: RoleType; description: string; permissions: { resource: string; action: string }[] }[] = [
    {
      name: 'SUPER_ADMIN',
      description: 'Super Administrateur - Accès complet au système',
      permissions: [
        { resource: 'dashboard', action: 'admin' }, { resource: 'dashboard', action: 'read' }, { resource: 'dashboard', action: 'export' },
        { resource: 'audit', action: 'admin' }, { resource: 'audit', action: 'read' }, { resource: 'audit', action: 'write' },
        { resource: 'rapport', action: 'admin' }, { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'write' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'admin' }, { resource: 'scoring', action: 'read' }, { resource: 'scoring', action: 'export' },
        { resource: 'sig', action: 'admin' }, { resource: 'sig', action: 'read' },
        { resource: 'user', action: 'admin' }, { resource: 'user', action: 'read' }, { resource: 'user', action: 'write' }, { resource: 'user', action: 'delete' },
        { resource: 'campaign', action: 'admin' }, { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'admin' }, { resource: 'alert', action: 'read' }, { resource: 'alert', action: 'write' },
      ],
    },
    {
      name: 'DG',
      description: 'Directeur Général - Vue stratégique complète',
      permissions: [
        { resource: 'dashboard', action: 'read' }, { resource: 'dashboard', action: 'export' },
        { resource: 'audit', action: 'read' }, { resource: 'audit', action: 'write' },
        { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'write' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'read' }, { resource: 'scoring', action: 'export' },
        { resource: 'sig', action: 'read' },
        { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'read' },
      ],
    },
    {
      name: 'DGA',
      description: 'Directeur Général Adjoint',
      permissions: [
        { resource: 'dashboard', action: 'read' }, { resource: 'dashboard', action: 'export' },
        { resource: 'audit', action: 'read' }, { resource: 'audit', action: 'write' },
        { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'read' }, { resource: 'scoring', action: 'export' },
        { resource: 'sig', action: 'read' },
        { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'read' },
      ],
    },
    {
      name: 'DIRECTEUR_TECHNIQUE',
      description: 'Directeur Technique - Gestion technique complète',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'audit', action: 'read' }, { resource: 'audit', action: 'write' },
        { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'write' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'read' },
        { resource: 'sig', action: 'read' },
        { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'read' }, { resource: 'alert', action: 'write' },
      ],
    },
    {
      name: 'INGENIEUR_RF',
      description: 'Ingénieur RF - Mesures terrain',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'audit', action: 'read' }, { resource: 'audit', action: 'write' },
        { resource: 'rapport', action: 'read' },
        { resource: 'scoring', action: 'read' },
        { resource: 'sig', action: 'read' },
        { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'read' },
      ],
    },
    {
      name: 'ANALYSTE_QOS',
      description: 'Analyste QoS - Analyse et export',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'audit', action: 'read' },
        { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'read' }, { resource: 'scoring', action: 'export' },
        { resource: 'sig', action: 'read' },
        { resource: 'campaign', action: 'read' },
        { resource: 'alert', action: 'read' },
      ],
    },
    {
      name: 'AUDITEUR',
      description: 'Auditeur - Audit et rapports réglementaires',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'audit', action: 'read' },
        { resource: 'rapport', action: 'read' }, { resource: 'rapport', action: 'write' }, { resource: 'rapport', action: 'export' },
        { resource: 'scoring', action: 'read' },
        { resource: 'campaign', action: 'read' },
        { resource: 'alert', action: 'read' },
      ],
    },
    {
      name: 'OPERATEUR_READONLY',
      description: 'Opérateur - Lecture données propres uniquement',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'rapport', action: 'read' },
        { resource: 'scoring', action: 'read' },
        { resource: 'sig', action: 'read' },
      ],
    },
    {
      name: 'PUBLIC',
      description: 'Public - Données publiques uniquement',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'rapport', action: 'read' },
      ],
    },
  ];

  const roleMap: Record<string, string> = {};
  for (const rd of roleDefinitions) {
    const role = await prisma.role.create({
      data: {
        name: rd.name,
        description: rd.description,
        permissions: { create: rd.permissions },
      },
    });
    roleMap[rd.name] = role.id;
    console.log(`  ✅ Role: ${rd.name}`);
  }

  // ═══════════════════════════════════════════
  // 2. Create Data Access Policies (RLS)
  // ═══════════════════════════════════════════
  const policies = [
    { roleType: 'SUPER_ADMIN' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'DG' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'DGA' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'DIRECTEUR_TECHNIQUE' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'INGENIEUR_RF' as RoleType, resource: 'campaigns', scope: 'own_region', regions: '["CON","KIN","BOK"]', operators: null },
    { roleType: 'ANALYSTE_QOS' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'AUDITEUR' as RoleType, resource: 'campaigns', scope: 'all', regions: null, operators: null },
    { roleType: 'OPERATEUR_READONLY' as RoleType, resource: 'campaigns', scope: 'own_org', regions: null, operators: null },
    { roleType: 'PUBLIC' as RoleType, resource: 'campaigns', scope: 'public_only', regions: null, operators: null },
    { roleType: 'SUPER_ADMIN' as RoleType, resource: 'reports', scope: 'all', regions: null, operators: null },
    { roleType: 'DG' as RoleType, resource: 'reports', scope: 'all', regions: null, operators: null },
    { roleType: 'OPERATEUR_READONLY' as RoleType, resource: 'reports', scope: 'own_org', regions: null, operators: null },
    { roleType: 'PUBLIC' as RoleType, resource: 'reports', scope: 'public_only', regions: null, operators: null },
    { roleType: 'SUPER_ADMIN' as RoleType, resource: 'scores', scope: 'all', regions: null, operators: null },
    { roleType: 'OPERATEUR_READONLY' as RoleType, resource: 'scores', scope: 'own_org', regions: null, operators: null },
    { roleType: 'PUBLIC' as RoleType, resource: 'scores', scope: 'public_only', regions: null, operators: null },
    { roleType: 'SUPER_ADMIN' as RoleType, resource: 'alerts', scope: 'all', regions: null, operators: null },
    { roleType: 'OPERATEUR_READONLY' as RoleType, resource: 'alerts', scope: 'own_org', regions: null, operators: null },
  ];

  for (const p of policies) {
    await prisma.dataAccessPolicy.create({ data: p });
  }
  console.log('  ✅ Data Access Policies');

  // ═══════════════════════════════════════════
  // 3. Create Users
  // ═══════════════════════════════════════════
  const adminHash = await bcrypt.hash('Admin@2026!', 12);
  const users = [
    { email: 'admin@arpt.gn', name: 'Administrateur Système', passwordHash: adminHash, roleId: roleMap['SUPER_ADMIN']!, organization: 'ARPT' },
    { email: 'dg@arpt.gn', name: 'Directeur Général', passwordHash: adminHash, roleId: roleMap['DG']!, organization: 'ARPT' },
    { email: 'dga@arpt.gn', name: 'Directeur Général Adjoint', passwordHash: adminHash, roleId: roleMap['DGA']!, organization: 'ARPT' },
    { email: 'dir.tech@arpt.gn', name: 'Directeur Technique', passwordHash: adminHash, roleId: roleMap['DIRECTEUR_TECHNIQUE']!, organization: 'ARPT' },
    { email: 'ing.rf@arpt.gn', name: 'Ingénieur RF Diallo', passwordHash: adminHash, roleId: roleMap['INGENIEUR_RF']!, organization: 'ARPT' },
    { email: 'analyste@arpt.gn', name: 'Analyste QoS Touré', passwordHash: adminHash, roleId: roleMap['ANALYSTE_QOS']!, organization: 'ARPT' },
    { email: 'auditeur@arpt.gn', name: 'Auditeur Condé', passwordHash: adminHash, roleId: roleMap['AUDITEUR']!, organization: 'ARPT' },
    { email: 'tech@orange.gn', name: 'Responsable Technique Orange', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Orange Guinée' },
    { email: 'tech@mtn.gn', name: 'Responsable Technique MTN', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'MTN Guinée' },
    { email: 'tech@celcom.gn', name: 'Responsable Technique Celcom', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Celcom Guinée' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('  ✅ Users (10)');

  // ═══════════════════════════════════════════
  // 4. Create Regions
  // ═══════════════════════════════════════════
  const regionData = [
    { code: 'CON', nom: 'Conakry', population: 2042000, superficie: 450, centreLat: 9.5092, centreLng: -13.7122 },
    { code: 'KIN', nom: 'Kindia', population: 1836000, superficie: 28600, centreLat: 10.0569, centreLng: -12.8605 },
    { code: 'BOK', nom: 'Boké', population: 1143000, superficie: 31100, centreLat: 11.1852, centreLng: -14.2941 },
    { code: 'LAB', nom: 'Labé', population: 1242000, superficie: 22900, centreLat: 11.3170, centreLng: -12.2832 },
    { code: 'MAM', nom: 'Mamou', population: 932000, superficie: 17900, centreLat: 10.5167, centreLng: -12.0833 },
    { code: 'FAR', nom: 'Faranah', population: 942000, superficie: 35600, centreLat: 10.0333, centreLng: -10.7333 },
    { code: 'KAN', nom: 'Kankan', population: 1976000, superficie: 72100, centreLat: 10.3833, centreLng: -9.3000 },
    { code: 'NZE', nom: "N'Zérékoré", population: 1715000, superficie: 37600, centreLat: 7.7500, centreLng: -8.8167 },
  ];

  const regionMap: Record<string, string> = {};
  for (const r of regionData) {
    const region = await prisma.region.create({ data: r });
    regionMap[r.code] = region.id;
  }
  console.log('  ✅ Regions (8)');

  // ═══════════════════════════════════════════
  // 5. Create Operators
  // ═══════════════════════════════════════════
  const operateurData = [
    { nom: 'Orange Guinée', code: 'ORANGE', type: 'MOBILE', licence: 'LIC-ORANGE-2016' },
    { nom: 'MTN Guinée', code: 'MTN', type: 'MOBILE', licence: 'LIC-MTN-2016' },
    { nom: 'Celcom Guinée', code: 'CELCOM', type: 'MOBILE', licence: 'LIC-CELCOM-2018' },
  ];

  const operateurMap: Record<string, string> = {};
  for (const o of operateurData) {
    const op = await prisma.operateur.create({ data: o });
    operateurMap[o.code] = op.id;
  }
  console.log('  ✅ Operators (3)');

  // ═══════════════════════════════════════════
  // 6. Create Campaigns
  // ═══════════════════════════════════════════
  const campaignData = [
    { nom: 'Campagne QoS Q1 2026 - Orange Conakry', type: 'DRIVE_TEST', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-01-15'), dateFin: new Date('2026-01-25'), statut: 'TERMINEE', responsable: 'Ing. Diallo' },
    { nom: 'Audit Couverture MTN Kindia', type: 'WALK_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['KIN']!, dateDebut: new Date('2026-02-20'), dateFin: new Date('2026-03-01'), statut: 'TERMINEE', responsable: 'Ing. Touré' },
    { nom: 'Test FAI Orange Conakry', type: 'QOS_INTERNET', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-03-10'), statut: 'EN_COURS', responsable: 'Ing. Camara' },
    { nom: 'Benchmark National Q1', type: 'QOS_MOBILE', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-04-01'), statut: 'EN_COURS', responsable: 'Dir. Technique' },
    { nom: 'Audit Zone Blanche Celcom Faranah', type: 'WALK_TEST', operateurId: operateurMap['CELCOM']!, regionId: regionMap['FAR']!, dateDebut: new Date('2026-04-15'), statut: 'PLANIFIEE', responsable: 'Ing. Condé' },
    { nom: 'Test 4G MTN Kankan', type: 'DRIVE_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['KAN']!, dateDebut: new Date('2026-05-01'), statut: 'PLANIFIEE', responsable: 'Ing. Bah' },
    { nom: 'Campagne QoS Q1 2026 - MTN Boké', type: 'DRIVE_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['BOK']!, dateDebut: new Date('2026-01-20'), dateFin: new Date('2026-01-30'), statut: 'TERMINEE', responsable: 'Ing. Sangaré' },
    { nom: 'Campagne QoS Q1 2026 - Celcom Labé', type: 'WALK_TEST', operateurId: operateurMap['CELCOM']!, regionId: regionMap['LAB']!, dateDebut: new Date('2026-01-25'), dateFin: new Date('2026-02-05'), statut: 'TERMINEE', responsable: 'Ing. Dioubaté' },
  ];

  const campaignMap: Record<string, string> = {};
  for (const c of campaignData) {
    const camp = await prisma.campagne.create({ data: c });
    campaignMap[c.nom] = camp.id;
  }
  console.log('  ✅ Campaigns (8)');

  // ═══════════════════════════════════════════
  // 7. Create QoS Measurements (realistic coverage)
  // ═══════════════════════════════════════════
  const opCodes = ['ORANGE', 'MTN', 'CELCOM'];
  const regionCodes = ['CON', 'KIN', 'BOK', 'LAB', 'MAM', 'FAR', 'KAN', 'NZE'];
  const campaignIds = Object.values(campaignMap);
  const regionIds = Object.values(regionMap);
  const operateurIds = Object.values(operateurMap);

  // QoS baselines per operator
  const qosBase: Record<string, { latence: number; debit: number; tauxAppel: number; jitter: number; debitDown: number; debitUp: number; ping: number; rssi: number; rsrp: number; rsrq: number; sinr: number; scoreQoE: number }> = {
    ORANGE: { latence: 38, debit: 22, tauxAppel: 96, jitter: 6, debitDown: 24, debitUp: 12, ping: 35, rssi: -70, rsrp: -85, rsrq: -8, sinr: 15, scoreQoE: 79 },
    MTN: { latence: 45, debit: 18, tauxAppel: 93, jitter: 9, debitDown: 20, debitUp: 10, ping: 42, rssi: -75, rsrp: -90, rsrq: -10, sinr: 12, scoreQoE: 74 },
    CELCOM: { latence: 55, debit: 12, tauxAppel: 89, jitter: 14, debitDown: 14, debitUp: 7, ping: 52, rssi: -80, rsrp: -95, rsrq: -13, sinr: 8, scoreQoE: 64 },
  };

  // Region degradation factor (1.0 = good, higher = more degraded)
  const regionFactor: Record<string, number> = {
    CON: 1.0, KIN: 1.1, BOK: 1.35, LAB: 1.25, MAM: 1.15, FAR: 1.45, KAN: 1.3, NZE: 1.4,
  };

  // Target coverage probability per region (fraction of measurements with RSSI > -100)
  // This produces realistic varied coverage across regions
  const regionCoverage: Record<string, number> = {
    CON: 0.92,   // Conakry: ~92% coverage (urban, well covered)
    KIN: 0.71,   // Kindia: ~71% coverage
    BOK: 0.55,   // Boké: ~55% coverage (rural, many dead zones)
    LAB: 0.63,   // Labé: ~63% coverage
    MAM: 0.68,   // Mamou: ~68% coverage
    FAR: 0.48,   // Faranah: ~48% coverage (worst coverage)
    KAN: 0.61,   // Kankan: ~61% coverage
    NZE: 0.52,   // N'Zérékoré: ~52% coverage (forest region, poor coverage)
  };

  // Number of measurements per operator-region combo
  const regionMeasureCount: Record<string, number> = {
    CON: 12, KIN: 9, BOK: 9, LAB: 9, MAM: 9, FAR: 9, KAN: 9, NZE: 9,
  };

  // Center coords with small random offsets for measurements
  const regionCenters: Record<string, { lat: number; lng: number }> = {
    CON: { lat: 9.5092, lng: -13.7122 },
    KIN: { lat: 10.0569, lng: -12.8605 },
    BOK: { lat: 11.1852, lng: -14.2941 },
    LAB: { lat: 11.3170, lng: -12.2832 },
    MAM: { lat: 10.5167, lng: -12.0833 },
    FAR: { lat: 10.0333, lng: -10.7333 },
    KAN: { lat: 10.3833, lng: -9.3000 },
    NZE: { lat: 7.7500, lng: -8.8167 },
  };

  const measurementTypes = ['MOBILE', 'INTERNET'];

  // Pre-compute deterministic coverage patterns per region
  // This ensures exact coverage percentages instead of relying on random chance with small N
  const regionCoveragePattern: Record<string, boolean[]> = {};
  for (const rCode of regionCodes) {
    const totalForRegion = regionMeasureCount[rCode] * 3; // 3 operators
    const coveredCount = Math.round(totalForRegion * regionCoverage[rCode]);
    const deadZoneCount = totalForRegion - coveredCount;
    // Create pattern: first 'coveredCount' are true, rest are false
    const pattern: boolean[] = [];
    for (let i = 0; i < coveredCount; i++) pattern.push(true);
    for (let i = 0; i < deadZoneCount; i++) pattern.push(false);
    // Shuffle deterministically (Fisher-Yates with simple seeded approach)
    let seed = rCode.charCodeAt(0) * 1000 + rCode.charCodeAt(1) * 100 + (rCode.length > 2 ? rCode.charCodeAt(2) : 0);
    for (let i = pattern.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const j = seed % (i + 1);
      [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
    }
    regionCoveragePattern[rCode] = pattern;
  }

  let totalMeasures = 0;
  for (let oi = 0; oi < opCodes.length; oi++) {
    const opCode = opCodes[oi];
    const opId = operateurIds[oi];
    const base = qosBase[opCode];

    for (let ri = 0; ri < regionCodes.length; ri++) {
      const rCode = regionCodes[ri];
      const rId = regionIds[ri];
      const factor = regionFactor[rCode];
      const center = regionCenters[rCode];
      const numMeasures = regionMeasureCount[rCode];
      const campIdx = (oi * 8 + ri) % campaignIds.length;
      const typeMesure = measurementTypes[oi % 2];
      const pattern = regionCoveragePattern[rCode];

      for (let m = 0; m < numMeasures; m++) {
        const latJitter = (Math.random() - 0.5) * 0.5;
        const lngJitter = (Math.random() - 0.5) * 0.5;

        // Use deterministic pattern to decide if this measurement is covered
        const globalIdx = oi * numMeasures + m;
        const isCovered = pattern[globalIdx % pattern.length];

        let rssi: number;
        let rsrp: number;
        let rsrq: number;
        let sinr: number;
        let latence: number;
        let debitDescendant: number;
        let debitMontant: number;
        let gigue: number;
        let tauxAppelReussi: number;
        let tauxDropCall: number;
        let debitDownload: number;
        let debitUpload: number;
        let ping: number;
        let dnsLookupTime: number;
        let tcpConnectTime: number;
        let scoreQoE: number;
        let pageLoadTime: number;
        let videoBuffering: number;

        if (isCovered) {
          // Good signal area: RSSI between -55 and -95
          // Operator quality affects the range
          const rssiBase = base.rssi; // ORANGE: -70, MTN: -75, CELCOM: -80
          rssi = Math.round((rssiBase + (Math.random() - 0.5) * 20) * 10) / 10;
          // Clamp to ensure it's above -95 for covered points
          rssi = Math.max(-95, Math.min(-50, rssi));

          rsrp = Math.round((base.rsrp + (Math.random() - 0.5) * 10) * 10) / 10;
          rsrq = Math.round((base.rsrq + (Math.random() - 0.5) * 4) * 10) / 10;
          sinr = Math.round((base.sinr / factor + (Math.random() - 0.5) * 3) * 10) / 10;

          latence = Math.round(base.latence * factor * (0.9 + Math.random() * 0.2) * 10) / 10;
          debitDescendant = Math.round(base.debit / factor * (0.85 + Math.random() * 0.3) * 10) / 10;
          debitMontant = Math.round(base.debit * 0.5 / factor * (0.85 + Math.random() * 0.3) * 10) / 10;
          gigue = Math.round(base.jitter * factor * (0.8 + Math.random() * 0.4) * 10) / 10;
          tauxAppelReussi = Math.min(100, Math.round(base.tauxAppel / (factor * 0.9 + Math.random() * 0.2) * 10) / 10);
          tauxDropCall = Math.round((100 - base.tauxAppel) * factor * (0.8 + Math.random() * 0.4) * 10) / 10;
          debitDownload = Math.round(base.debitDown / factor * (0.85 + Math.random() * 0.3) * 10) / 10;
          debitUpload = Math.round(base.debitUp / factor * (0.85 + Math.random() * 0.3) * 10) / 10;
          ping = Math.round(base.ping * factor * (0.9 + Math.random() * 0.2) * 10) / 10;
          dnsLookupTime = Math.round(15 * factor * (0.8 + Math.random() * 0.4) * 10) / 10;
          tcpConnectTime = Math.round(25 * factor * (0.8 + Math.random() * 0.4) * 10) / 10;
          scoreQoE = Math.min(100, Math.round(base.scoreQoE / factor * (0.9 + Math.random() * 0.2) * 10) / 10);
          pageLoadTime = Math.round(2.5 * factor * (0.8 + Math.random() * 0.4) * 100) / 100;
          videoBuffering = Math.round(0.5 * factor * (0.8 + Math.random() * 0.4) * 100) / 100;
        } else {
          // Dead zone / very poor signal: RSSI < -100
          // Mix of measurable weak signals and complete dead zones
          const isCompleteDeadZone = Math.random() < 0.4; // 40% chance of very deep dead zone
          if (isCompleteDeadZone) {
            rssi = Math.round((-110 - Math.random() * 15) * 10) / 10; // -110 to -125
          } else {
            rssi = Math.round((-101 - Math.random() * 8) * 10) / 10; // -101 to -109
          }

          // Degraded signal metrics for dead zones
          rsrp = Math.round((-105 - Math.random() * 20) * 10) / 10;
          rsrq = Math.round((-18 - Math.random() * 8) * 10) / 10;
          sinr = Math.round((-5 - Math.random() * 10) * 10) / 10;

          // Severely degraded QoS metrics
          latence = Math.round((base.latence * factor * 2.5 + Math.random() * 50) * 10) / 10;
          debitDescendant = Math.round(Math.max(0.1, base.debit / factor * 0.1 + Math.random() * 2) * 10) / 10;
          debitMontant = Math.round(Math.max(0.05, base.debit * 0.5 / factor * 0.1 + Math.random()) * 10) / 10;
          gigue = Math.round(base.jitter * factor * 3 * (0.8 + Math.random() * 0.6) * 10) / 10;
          tauxAppelReussi = Math.round(Math.max(0, 30 + Math.random() * 40) * 10) / 10;
          tauxDropCall = Math.round(Math.min(100, (100 - base.tauxAppel) * factor * 3 + Math.random() * 20) * 10) / 10;
          debitDownload = Math.round(Math.max(0.1, base.debitDown / factor * 0.08 + Math.random() * 1.5) * 10) / 10;
          debitUpload = Math.round(Math.max(0.05, base.debitUp / factor * 0.08 + Math.random() * 0.5) * 10) / 10;
          ping = Math.round((base.ping * factor * 3 + Math.random() * 100) * 10) / 10;
          dnsLookupTime = Math.round((40 + Math.random() * 60) * 10) / 10;
          tcpConnectTime = Math.round((60 + Math.random() * 80) * 10) / 10;
          scoreQoE = Math.round(Math.max(5, base.scoreQoE / factor * 0.15 + Math.random() * 8) * 10) / 10;
          pageLoadTime = Math.round((8 + Math.random() * 15) * 100) / 100;
          videoBuffering = Math.round((3 + Math.random() * 8) * 100) / 100;
        }

        await prisma.mesureQoS.create({
          data: {
            campagneId: campaignIds[campIdx],
            operateurId: opId,
            regionId: rId,
            latitude: center.lat + latJitter,
            longitude: center.lng + lngJitter,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            latence,
            debitDescendant,
            debitMontant,
            gigue,
            tauxAppelReussi,
            tauxDropCall,
            rssi,
            rsrp,
            rsrq,
            sinr,
            debitDownload,
            debitUpload,
            ping,
            dnsLookupTime,
            tcpConnectTime,
            scoreQoE,
            pageLoadTime,
            videoBuffering,
            typeMesure,
          },
        });
        totalMeasures++;
      }
    }
  }
  console.log(`  ✅ QoS Measurements (${totalMeasures})`);

  // ═══════════════════════════════════════════
  // 8. Create Operator Scores (4 quarters)
  // ═══════════════════════════════════════════
  const scoreData: Record<string, { base: number[]; couverture: number[]; qos: number[]; qoe: number[]; conformite: number[]; recos: string[] }> = {
    ORANGE: {
      base: [70, 73, 75, 78],
      couverture: [75, 78, 80, 82],
      qos: [68, 72, 74, 76],
      qoe: [72, 75, 77, 79],
      conformite: [78, 81, 83, 85],
      recos: ['Maintenir la qualité en zone urbaine', 'Étendre la 4G en zone rurale'],
    },
    MTN: {
      base: [68, 71, 73, 74],
      couverture: [70, 73, 75, 76],
      qos: [66, 70, 71, 72],
      qoe: [69, 72, 73, 74],
      conformite: [72, 75, 77, 78],
      recos: ['Améliorer la latence dans la région de Boké', 'Renforcer l\'infrastructure backhaul'],
    },
    CELCOM: {
      base: [55, 59, 62, 65],
      couverture: [48, 52, 55, 58],
      qos: [52, 56, 59, 62],
      qoe: [54, 58, 61, 64],
      conformite: [62, 66, 68, 70],
      recos: ['Améliorer la couverture en zone rurale - objectif +15%', 'Investir dans l\'infrastructure 4G'],
    },
  };

  const periods = ['2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1'];
  for (const opCode of opCodes) {
    const opId = operateurMap[opCode];
    const sd = scoreData[opCode];
    for (let qi = 0; qi < periods.length; qi++) {
      await prisma.scoreOperateur.create({
        data: {
          operateurId: opId,
          periode: periods[qi],
          scoreGlobal: sd.base[qi],
          scoreCouverture: sd.couverture[qi],
          scoreQoS: sd.qos[qi],
          scoreQoE: sd.qoe[qi],
          scoreConformite: sd.conformite[qi],
          recommandation: qi === periods.length - 1 ? sd.recos[0] : null,
        },
      });
    }
  }
  console.log('  ✅ Operator Scores (4 quarters × 3)');

  // ═══════════════════════════════════════════
  // 9. Create Alerts
  // ═══════════════════════════════════════════
  const alertData = [
    { type: 'DEGRADATION', severity: 'CRITIQUE', operateurId: operateurMap['CELCOM'], regionId: regionMap['FAR'], message: 'Dégradation critique QoS - Latence > 100ms dans la région de Faranah', details: '{"latence": 108, "seuil": 50}' },
    { type: 'SEUIL_DEPASSE', severity: 'HAUTE', operateurId: operateurMap['MTN'], regionId: regionMap['BOK'], message: 'Chute débit mobile en zone rurale de Boké (-35%)', details: '{"debit": 8.2, "seuil": 15}' },
    { type: 'NON_CONFORMITE', severity: 'CRITIQUE', operateurId: operateurMap['CELCOM'], regionId: regionMap['NZE'], message: "Taux d'appel réussi < 85% - Seuil réglementaire N'Zérékoré", details: '{"tauxAppel": 82.3, "seuil": 90}' },
    { type: 'DEGRADATION', severity: 'MOYENNE', operateurId: operateurMap['ORANGE'], regionId: regionMap['LAB'], message: 'Couverture 4G en baisse dans la région de Labé - Incident signalé', details: '{"couverture4G": 45, "precedent": 58}' },
    { type: 'ZONE_BLANCHE', severity: 'HAUTE', operateurId: null, regionId: regionMap['FAR'], message: '23 nouvelles zones blanches identifiées dans la région de Faranah', details: '{"count": 23}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['MTN'], regionId: regionMap['CON'], message: 'Maintenance planifiée MTN Conakry - 22h00-04h00', details: '{"maintenance": true}' },
    { type: 'SEUIL_DEPASSE', severity: 'HAUTE', operateurId: operateurMap['CELCOM'], regionId: regionMap['KAN'], message: 'Jitter > 20ms dans la région de Kankan', details: '{"jitter": 22, "seuil": 10}' },
    { type: 'ZONE_BLANCHE', severity: 'MOYENNE', operateurId: null, regionId: regionMap['NZE'], message: "Extension zone blanche confirmée N'Zérékoré sud", details: '{"count": 8}' },
  ];

  for (const a of alertData) {
    await prisma.alerte.create({ data: a });
  }
  console.log('  ✅ Alerts (8)');

  // ═══════════════════════════════════════════
  // 10. Create Reports
  // ═══════════════════════════════════════════
  const reportData = [
    { titre: 'Rapport QoS Trimestriel T1 2026', type: 'REGLEMENTAIRE', format: 'PDF', campagneId: campaignIds[0], generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Benchmark Opérateurs - Mars 2026', type: 'OPERATEUR', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: false },
    { titre: 'Couverture Nationale - Rapport Annuel 2025', type: 'PUBLIC', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Audit Terrain - Zone Faranah', type: 'INTERNE', format: 'EXCEL', campagneId: campaignIds[4], generePar: 'system', statut: 'GENERE', isPublic: false },
    { titre: 'Score Card Opérateurs Q1 2026', type: 'OPERATEUR', format: 'PDF', campagneId: null, generePar: 'system', statut: 'GENERE', isPublic: false },
    { titre: 'Rapport Cybersécurité Mensuel - Avril 2026', type: 'REGLEMENTAIRE', format: 'PDF', campagneId: null, generePar: 'system', statut: 'GENERE', isPublic: false },
    { titre: 'Benchmark International 2025', type: 'BENCHMARK', format: 'PPT', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Rapport Zones Blanches National', type: 'PUBLIC', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
  ];

  for (const r of reportData) {
    await prisma.rapport.create({ data: r });
  }
  console.log('  ✅ Reports (8)');

  // ═══════════════════════════════════════════
  // 11. Create Audit Log entries
  // ═══════════════════════════════════════════
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@arpt.gn' } });
  if (adminUser) {
    const auditEntries = [
      { action: 'LOGIN', resource: 'system', details: '{"method": "credentials"}' },
      { action: 'READ', resource: 'dashboard', details: '{"tab": "dashboard-dg"}' },
      { action: 'EXPORT', resource: 'rapport', resourceId: '1', details: '{"format": "PDF"}' },
      { action: 'CREATE', resource: 'campaign', details: '{"name": "Audit Zone Blanche Celcom Faranah"}' },
      { action: 'READ', resource: 'scoring', details: '{"periode": "2026-Q1"}' },
      { action: 'UPDATE', resource: 'user', details: '{"action": "update_role"}' },
    ];

    for (const ae of auditEntries) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          ...ae,
          ipAddress: '196.128.1.1',
          userAgent: 'Mozilla/5.0 ONIT-PNG',
        },
      });
    }
    console.log('  ✅ Audit Log (6)');
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Default login credentials:');
  console.log('  Email: admin@arpt.gn');
  console.log('  Password: Admin@2026!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
    { email: 'tech@intercel.gn', name: 'Responsable Technique Intercel', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Intercel Guinée' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('  ✅ Users (11)');

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
    { nom: 'Intercel Guinée', code: 'INTERCEL', type: 'MOBILE', licence: 'LIC-INTERCEL-2017' },
  ];

  const operateurMap: Record<string, string> = {};
  for (const o of operateurData) {
    const op = await prisma.operateur.create({ data: o });
    operateurMap[o.code] = op.id;
  }
  console.log('  ✅ Operators (4)');

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
    { nom: 'Recensement Zones Blanches Intercel Faranah', type: 'WALK_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['FAR']!, dateDebut: new Date('2026-02-10'), dateFin: new Date('2026-02-28'), statut: 'TERMINEE', responsable: 'Ing. Soumah' },
    { nom: 'Test Couverture 2G Intercel Nzérékoré', type: 'DRIVE_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['NZE']!, dateDebut: new Date('2026-03-15'), dateFin: new Date('2026-03-25'), statut: 'TERMINEE', responsable: 'Ing. Loua' },
    { nom: 'Audit QoS Intercel Kankan', type: 'WALK_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['KAN']!, dateDebut: new Date('2026-04-05'), statut: 'EN_COURS', responsable: 'Ing. Camara' },
  ];

  const campaignMap: Record<string, string> = {};
  for (const c of campaignData) {
    const camp = await prisma.campagne.create({ data: c });
    campaignMap[c.nom] = camp.id;
  }
  console.log('  ✅ Campaigns (11)');

  // ═══════════════════════════════════════════
  // 7. Create QoS Measurements (realistic coverage)
  // ═══════════════════════════════════════════
  const opCodes = ['ORANGE', 'MTN', 'CELCOM', 'INTERCEL'];
  const regionCodes = ['CON', 'KIN', 'BOK', 'LAB', 'MAM', 'FAR', 'KAN', 'NZE'];
  const campaignIds = Object.values(campaignMap);
  const regionIds = Object.values(regionMap);
  const operateurIds = Object.values(operateurMap);

  // QoS baselines per operator — ALL PERFECT (100/100)
  const qosBase: Record<string, { latence: number; debit: number; tauxAppel: number; jitter: number; debitDown: number; debitUp: number; ping: number; rssi: number; rsrp: number; rsrq: number; sinr: number; scoreQoE: number }> = {
    ORANGE: { latence: 15, debit: 50, tauxAppel: 100, jitter: 1, debitDown: 55, debitUp: 28, ping: 12, rssi: -55, rsrp: -70, rsrq: -3, sinr: 25, scoreQoE: 100 },
    MTN: { latence: 15, debit: 50, tauxAppel: 100, jitter: 1, debitDown: 55, debitUp: 28, ping: 12, rssi: -55, rsrp: -70, rsrq: -3, sinr: 25, scoreQoE: 100 },
    CELCOM: { latence: 15, debit: 50, tauxAppel: 100, jitter: 1, debitDown: 55, debitUp: 28, ping: 12, rssi: -55, rsrp: -70, rsrq: -3, sinr: 25, scoreQoE: 100 },
    INTERCEL: { latence: 15, debit: 50, tauxAppel: 100, jitter: 1, debitDown: 55, debitUp: 28, ping: 12, rssi: -55, rsrp: -70, rsrq: -3, sinr: 25, scoreQoE: 100 },
  };

  // Region degradation factor — ALL 1.0 (no degradation, perfect everywhere)
  const regionFactor: Record<string, number> = {
    CON: 1.0, KIN: 1.0, BOK: 1.0, LAB: 1.0, MAM: 1.0, FAR: 1.0, KAN: 1.0, NZE: 1.0,
  };

  // Target coverage probability — ALL 100% (every measurement has good signal)
  const regionCoverage: Record<string, Record<string, number>> = {
    CON:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    KIN:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    BOK:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    LAB:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    MAM:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    FAR:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    KAN:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
    NZE:   { ORANGE: 1.0, MTN: 1.0, CELCOM: 1.0, INTERCEL: 1.0 },
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

  // Pre-compute deterministic coverage patterns per region-operator combo
  const regionCoveragePattern: Record<string, Record<string, boolean[]>> = {};
  for (const rCode of regionCodes) {
    regionCoveragePattern[rCode] = {};
    for (const opCode of opCodes) {
      const totalForCombo = regionMeasureCount[rCode]; // measures per operator-region
      const coverageFraction = regionCoverage[rCode]?.[opCode] ?? 0.5;
      const coveredCount = Math.round(totalForCombo * coverageFraction);
      const deadZoneCount = totalForCombo - coveredCount;
      // Create pattern: first 'coveredCount' are true, rest are false
      const pattern: boolean[] = [];
      for (let i = 0; i < coveredCount; i++) pattern.push(true);
      for (let i = 0; i < deadZoneCount; i++) pattern.push(false);
      // Shuffle deterministically
      let seed = rCode.charCodeAt(0) * 1000 + opCode.charCodeAt(0) * 100 + rCode.charCodeAt(1);
      for (let i = pattern.length - 1; i > 0; i--) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const j = seed % (i + 1);
        [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
      }
      regionCoveragePattern[rCode][opCode] = pattern;
    }
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
      const pattern = regionCoveragePattern[rCode][opCode];

      for (let m = 0; m < numMeasures; m++) {
        const latJitter = (Math.random() - 0.5) * 0.5;
        const lngJitter = (Math.random() - 0.5) * 0.5;

        // All measurements are perfect (100/100) — no dead zones

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

        // ALL measurements are perfect (100/100) — no dead zones, no degradation
        // Small random variation for realism, but scores are always 100
        rssi = Math.round((base.rssi + (Math.random() - 0.5) * 6) * 10) / 10;
        rssi = Math.max(-65, Math.min(-45, rssi));

        rsrp = Math.round((base.rsrp + (Math.random() - 0.5) * 4) * 10) / 10;
        rsrq = Math.round((base.rsrq + (Math.random() - 0.5) * 2) * 10) / 10;
        sinr = Math.round((base.sinr + (Math.random() - 0.5) * 2) * 10) / 10;

        latence = Math.round(base.latence * (0.95 + Math.random() * 0.1) * 10) / 10;
        debitDescendant = Math.round(base.debit * (0.95 + Math.random() * 0.1) * 10) / 10;
        debitMontant = Math.round(base.debit * 0.5 * (0.95 + Math.random() * 0.1) * 10) / 10;
        gigue = Math.round(base.jitter * (0.9 + Math.random() * 0.2) * 10) / 10;
        tauxAppelReussi = 100;
        tauxDropCall = 0;
        debitDownload = Math.round(base.debitDown * (0.95 + Math.random() * 0.1) * 10) / 10;
        debitUpload = Math.round(base.debitUp * (0.95 + Math.random() * 0.1) * 10) / 10;
        ping = Math.round(base.ping * (0.95 + Math.random() * 0.1) * 10) / 10;
        dnsLookupTime = Math.round(5 * (0.9 + Math.random() * 0.2) * 10) / 10;
        tcpConnectTime = Math.round(8 * (0.9 + Math.random() * 0.2) * 10) / 10;
        scoreQoE = 100;
        pageLoadTime = Math.round(0.8 * (0.9 + Math.random() * 0.2) * 100) / 100;
        videoBuffering = Math.round(0.1 * (0.9 + Math.random() * 0.2) * 100) / 100;

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
  // Operator Scores — ALL 100/100 (perfect scores across all quarters)
  const scoreData: Record<string, { base: number[]; couverture: number[]; qos: number[]; qoe: number[]; conformite: number[]; recos: string[] }> = {
    ORANGE: {
      base: [100, 100, 100, 100],
      couverture: [100, 100, 100, 100],
      qos: [100, 100, 100, 100],
      qoe: [100, 100, 100, 100],
      conformite: [100, 100, 100, 100],
      recos: ['Excellence maintenue - continuer sur cette lancée', 'Maintenir les investissements en infrastructure'],
    },
    MTN: {
      base: [100, 100, 100, 100],
      couverture: [100, 100, 100, 100],
      qos: [100, 100, 100, 100],
      qoe: [100, 100, 100, 100],
      conformite: [100, 100, 100, 100],
      recos: ['Performance optimale atteinte', 'Maintenir la qualité du réseau national'],
    },
    CELCOM: {
      base: [100, 100, 100, 100],
      couverture: [100, 100, 100, 100],
      qos: [100, 100, 100, 100],
      qoe: [100, 100, 100, 100],
      conformite: [100, 100, 100, 100],
      recos: ['Niveau d\'excellence atteint', 'Continuer les investissements 4G/5G'],
    },
    INTERCEL: {
      base: [100, 100, 100, 100],
      couverture: [100, 100, 100, 100],
      qos: [100, 100, 100, 100],
      qoe: [100, 100, 100, 100],
      conformite: [100, 100, 100, 100],
      recos: ['Amélioration significative réalisée', 'Maintenir la modernisation du réseau'],
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
  console.log('  ✅ Operator Scores (4 quarters × 4)');

  // ═══════════════════════════════════════════
  // 9. Create Alerts (informational/maintenance — all scores 100/100)
  // ═══════════════════════════════════════════
  const alertData = [
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['ORANGE'], regionId: regionMap['CON'], message: 'Maintenance planifiée Orange Conakry - 22h00-04h00', details: '{"maintenance": true}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['MTN'], regionId: regionMap['CON'], message: 'Maintenance planifiée MTN Conakry - 23h00-05h00', details: '{"maintenance": true}' },
    { type: 'SEUIL_DEPASSE', severity: 'BASSE', operateurId: operateurMap['CELCOM'], regionId: regionMap['KIN'], message: 'Amélioration débit constatée après mise à jour infrastructure Kindia', details: '{"debit": 52, "precedent": 48}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['ORANGE'], regionId: regionMap['LAB'], message: 'Mise à jour logiciel réseau planifiée Labé', details: '{"upgrade": true}' },
    { type: 'SEUIL_DEPASSE', severity: 'BASSE', operateurId: operateurMap['MTN'], regionId: regionMap['KAN'], message: 'Extension 4G en cours dans la région de Kankan', details: '{"extension4G": true}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['CON'], message: 'Modernisation réseau Intercel Conakry en cours', details: '{"modernisation": true}' },
  ];

  for (const a of alertData) {
    await prisma.alerte.create({ data: a });
  }
  console.log('  ✅ Alerts (10)');

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

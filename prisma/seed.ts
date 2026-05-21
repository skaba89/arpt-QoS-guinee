import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Deterministic pseudo-random generator for reproducible seed data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Helper: clamp value between min and max
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Helper: round to N decimals
function roundTo(v: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(v * factor) / factor;
}

async function main() {
  console.log('🌱 Seeding ONIT-PNG database — PRODUCTION REALISTIC DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
  }
  console.log('  ✅ Roles (9) + Permissions');

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
  console.log('  ✅ Data Access Policies (18)');

  // ═══════════════════════════════════════════
  // 3. Create Users
  // ═══════════════════════════════════════════
  const adminHash = await bcrypt.hash('Admin@2026!', 12);
  const users = [
    { email: 'admin@arpt.gn', name: 'Mamadou Diallo', passwordHash: adminHash, roleId: roleMap['SUPER_ADMIN']!, organization: 'ARPT' },
    { email: 'dg@arpt.gn', name: 'Dr. Aissatou Bah', passwordHash: adminHash, roleId: roleMap['DG']!, organization: 'ARPT' },
    { email: 'dga@arpt.gn', name: 'Ibrahim Camara', passwordHash: adminHash, roleId: roleMap['DGA']!, organization: 'ARPT' },
    { email: 'dir.tech@arpt.gn', name: 'Cheikh Touré', passwordHash: adminHash, roleId: roleMap['DIRECTEUR_TECHNIQUE']!, organization: 'ARPT' },
    { email: 'ing.rf@arpt.gn', name: 'Fatoumata Binta Diallo', passwordHash: adminHash, roleId: roleMap['INGENIEUR_RF']!, organization: 'ARPT' },
    { email: 'analyste@arpt.gn', name: 'Mamadou Saliou Touré', passwordHash: adminHash, roleId: roleMap['ANALYSTE_QOS']!, organization: 'ARPT' },
    { email: 'auditeur@arpt.gn', name: 'Aminata Condé', passwordHash: adminHash, roleId: roleMap['AUDITEUR']!, organization: 'ARPT' },
    { email: 'tech@orange.gn', name: 'Aboubacar Sidiki Diakité', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Orange Guinée' },
    { email: 'tech@mtn.gn', name: 'Moussa Kaba', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'MTN Guinée' },
    { email: 'tech@celcom.gn', name: 'Saa Marcel Loua', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Celcom Guinée' },
    { email: 'tech@intercel.gn', name: 'Fodé Soumah', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Intercel Guinée' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('  ✅ Users (11)');

  // ═══════════════════════════════════════════
  // 4. Create Regions (8 administrative regions)
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
  // 6. Create Campaigns — realistic field operations
  // ═══════════════════════════════════════════
  const campaignData = [
    // Q1 2026 — completed campaigns
    { nom: 'Campagne Drive Test Orange Conakry Q1-2026', type: 'DRIVE_TEST', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-01-15'), dateFin: new Date('2026-01-28'), statut: 'TERMINEE', responsable: 'Ing. Diakité' },
    { nom: 'Audit Walk Test MTN Kindia Q1-2026', type: 'WALK_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['KIN']!, dateDebut: new Date('2026-01-20'), dateFin: new Date('2026-02-03'), statut: 'TERMINEE', responsable: 'Ing. Kaba' },
    { nom: 'Drive Test Celcom Labé Q1-2026', type: 'DRIVE_TEST', operateurId: operateurMap['CELCOM']!, regionId: regionMap['LAB']!, dateDebut: new Date('2026-01-25'), dateFin: new Date('2026-02-08'), statut: 'TERMINEE', responsable: 'Ing. Loua' },
    { nom: 'Recensement Zones Blanches Intercel Faranah', type: 'WALK_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['FAR']!, dateDebut: new Date('2026-02-10'), dateFin: new Date('2026-02-28'), statut: 'TERMINEE', responsable: 'Ing. Soumah' },
    // Q2 2026 — completed campaigns
    { nom: 'Campagne QoS Mobile Orange Kankan Q2-2026', type: 'QOS_MOBILE', operateurId: operateurMap['ORANGE']!, regionId: regionMap['KAN']!, dateDebut: new Date('2026-03-01'), dateFin: new Date('2026-03-14'), statut: 'TERMINEE', responsable: 'Ing. Diallo' },
    { nom: 'Drive Test MTN Boké Q2-2026', type: 'DRIVE_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['BOK']!, dateDebut: new Date('2026-03-05'), dateFin: new Date('2026-03-18'), statut: 'TERMINEE', responsable: 'Ing. Sangaré' },
    { nom: 'Audit Couverture 2G Intercel Nzérékoré Q2', type: 'DRIVE_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['NZE']!, dateDebut: new Date('2026-03-15'), dateFin: new Date('2026-03-28'), statut: 'TERMINEE', responsable: 'Ing. Loua' },
    // Q2 2026 — in progress
    { nom: 'Test FAI Orange Conakry Q2-2026', type: 'QOS_INTERNET', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-04-01'), statut: 'EN_COURS', responsable: 'Ing. Camara' },
    { nom: 'Benchmark National QoS Q2-2026', type: 'QOS_MOBILE', operateurId: operateurMap['ORANGE']!, regionId: regionMap['CON']!, dateDebut: new Date('2026-04-10'), statut: 'EN_COURS', responsable: 'Dir. Technique' },
    { nom: 'Walk Test Celcom Mamou Q2-2026', type: 'WALK_TEST', operateurId: operateurMap['CELCOM']!, regionId: regionMap['MAM']!, dateDebut: new Date('2026-04-15'), statut: 'EN_COURS', responsable: 'Ing. Condé' },
    { nom: 'Audit QoS Intercel Kankan Q2-2026', type: 'WALK_TEST', operateurId: operateurMap['INTERCEL']!, regionId: regionMap['KAN']!, dateDebut: new Date('2026-04-05'), statut: 'EN_COURS', responsable: 'Ing. Camara' },
    // Planned campaigns
    { nom: 'Audit Zone Blanche Celcom Faranah Q3-2026', type: 'WALK_TEST', operateurId: operateurMap['CELCOM']!, regionId: regionMap['FAR']!, dateDebut: new Date('2026-05-15'), statut: 'PLANIFIEE', responsable: 'Ing. Condé' },
    { nom: 'Test 4G MTN Kankan Q3-2026', type: 'DRIVE_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['KAN']!, dateDebut: new Date('2026-05-20'), statut: 'PLANIFIEE', responsable: 'Ing. Bah' },
    { nom: 'Drive Test Orange Nzérékoré Q3-2026', type: 'DRIVE_TEST', operateurId: operateurMap['ORANGE']!, regionId: regionMap['NZE']!, dateDebut: new Date('2026-06-01'), statut: 'PLANIFIEE', responsable: 'Ing. Diallo' },
    { nom: 'Recensement Zones Blanches National Q3', type: 'WALK_TEST', operateurId: operateurMap['MTN']!, regionId: regionMap['FAR']!, dateDebut: new Date('2026-06-10'), statut: 'PLANIFIEE', responsable: 'Dir. Technique' },
  ];

  const campaignIds: string[] = [];
  for (const c of campaignData) {
    const camp = await prisma.campagne.create({ data: c });
    campaignIds.push(camp.id);
  }
  console.log('  ✅ Campaigns (15)');

  // ═══════════════════════════════════════════════════════════
  // 7. Create QoS Measurements — REALISTIC PRODUCTION DATA
  // ═══════════════════════════════════════════════════════════
  //
  // Guinea telecom market reality (ARPT 2025 report):
  //   - Orange: Market leader, ~4M subs, best infrastructure, 4G+ in Conakry
  //   - MTN: #2, ~3M subs, good urban, limited rural penetration
  //   - Celcom (ex-Sotelgui): #3, ~1.5M subs, aging 3G network, coverage gaps
  //   - Intercel: #4, ~0.5M subs, mostly 2G/3G, Conakry-centric
  //
  // Key observations:
  //   - Conakry has best coverage (all operators, 4G available)
  //   - Mountainous Fouta Djallon (Labé) has coverage challenges
  //   - Forest Guinea (Nzérékoré) has dense vegetation limiting signal
  //   - Rural Faranah has severe coverage gaps for small operators
  //   - Mining areas (Boké) have better coverage due to corporate demand
  //   - Kankan (2nd largest city) has moderate to good coverage

  const opCodes = ['ORANGE', 'MTN', 'CELCOM', 'INTERCEL'];
  const regionCodes = ['CON', 'KIN', 'BOK', 'LAB', 'MAM', 'FAR', 'KAN', 'NZE'];

  // ─── QoS baselines per operator ───
  // These represent the BEST possible values (Conakry, good signal)
  const qosBase: Record<string, {
    latence: number; debitDescendant: number; debitMontant: number;
    tauxAppel: number; jitter: number; rssi: number; rsrp: number;
    rsrq: number; sinr: number; debitDown: number; debitUp: number;
    ping: number; scoreQoE: number;
  }> = {
    ORANGE: {
      latence: 22, debitDescendant: 42, debitMontant: 18,
      tauxAppel: 98.5, jitter: 6, rssi: -68, rsrp: -78,
      rsrq: -6, sinr: 22, debitDown: 48, debitUp: 20,
      ping: 18, scoreQoE: 85,
    },
    MTN: {
      latence: 30, debitDescendant: 32, debitMontant: 14,
      tauxAppel: 96.8, jitter: 9, rssi: -74, rsrp: -85,
      rsrq: -8, sinr: 18, debitDown: 36, debitUp: 16,
      ping: 24, scoreQoE: 75,
    },
    CELCOM: {
      latence: 52, debitDescendant: 14, debitMontant: 6,
      tauxAppel: 90.2, jitter: 18, rssi: -85, rsrp: -95,
      rsrq: -12, sinr: 10, debitDown: 16, debitUp: 7,
      ping: 42, scoreQoE: 55,
    },
    INTERCEL: {
      latence: 78, debitDescendant: 6, debitMontant: 2.5,
      tauxAppel: 80.5, jitter: 32, rssi: -94, rsrp: -102,
      rsrq: -15, sinr: 5, debitDown: 7, debitUp: 3,
      ping: 65, scoreQoE: 38,
    },
  };

  // ─── Regional degradation factor (1.0 = no degradation, lower = worse) ───
  const regionFactor: Record<string, number> = {
    CON: 1.00,  // Capital — best infrastructure
    KIN: 0.88,  // Near capital — good overall
    BOK: 0.82,  // Mining region — moderate, corporate demand helps
    LAB: 0.72,  // Fouta Djallon — mountainous, coverage challenges
    MAM: 0.78,  // Moderate — some infrastructure
    FAR: 0.62,  // Remote — limited infrastructure, severe gaps
    KAN: 0.80,  // 2nd city — moderate to good
    NZE: 0.65,  // Forest Guinea — dense vegetation, terrain challenges
  };

  // ─── Coverage probability per operator per region ───
  // Fraction of measurement points with usable signal (rssi > -100 dBm)
  const regionCoverage: Record<string, Record<string, number>> = {
    CON:   { ORANGE: 0.96, MTN: 0.93, CELCOM: 0.80, INTERCEL: 0.58 },
    KIN:   { ORANGE: 0.85, MTN: 0.78, CELCOM: 0.55, INTERCEL: 0.30 },
    BOK:   { ORANGE: 0.72, MTN: 0.62, CELCOM: 0.38, INTERCEL: 0.18 },
    LAB:   { ORANGE: 0.58, MTN: 0.48, CELCOM: 0.25, INTERCEL: 0.10 },
    MAM:   { ORANGE: 0.65, MTN: 0.55, CELCOM: 0.30, INTERCEL: 0.12 },
    FAR:   { ORANGE: 0.45, MTN: 0.35, CELCOM: 0.18, INTERCEL: 0.05 },
    KAN:   { ORANGE: 0.75, MTN: 0.68, CELCOM: 0.42, INTERCEL: 0.22 },
    NZE:   { ORANGE: 0.50, MTN: 0.42, CELCOM: 0.22, INTERCEL: 0.08 },
  };

  // ─── Number of measurements per operator-region combo ───
  const regionMeasureCount: Record<string, number> = {
    CON: 18, KIN: 14, BOK: 12, LAB: 12, MAM: 12, FAR: 10, KAN: 14, NZE: 12,
  };

  // ─── Region center coordinates ───
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
      const totalForCombo = regionMeasureCount[rCode];
      const coverageFraction = regionCoverage[rCode]?.[opCode] ?? 0.2;
      const coveredCount = Math.round(totalForCombo * coverageFraction);
      const deadZoneCount = totalForCombo - coveredCount;
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
  const regionIds = Object.values(regionMap);
  const operateurIds = Object.values(operateurMap);

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

      // Create a deterministic RNG per operator-region combo
      const rng = seededRandom(oi * 1000 + ri * 100 + 42);

      for (let m = 0; m < numMeasures; m++) {
        const latJitter = (rng() - 0.5) * 0.8;
        const lngJitter = (rng() - 0.5) * 0.8;
        const isCovered = pattern[m % pattern.length];

        let rssi: number, rsrp: number, rsrq: number, sinr: number;
        let latence: number, debitDescendant: number, debitMontant: number;
        let gigue: number, tauxAppelReussi: number, tauxDropCall: number;
        let debitDownload: number, debitUpload: number, ping: number;
        let dnsLookupTime: number, tcpConnectTime: number;
        let scoreQoE: number, pageLoadTime: number, videoBuffering: number;

        if (isCovered) {
          // Covered area: apply regional degradation to operator baseline
          const variation = () => 0.85 + rng() * 0.3; // 0.85–1.15 random factor

          // RF metrics degrade with region factor
          rssi = roundTo(base.rssi * factor * variation(), 1);
          rssi = clamp(rssi, -100, -45);
          rsrp = roundTo(base.rsrp * factor * variation(), 1);
          rsrq = roundTo(base.rsrq * (0.8 + rng() * 0.4), 1);
          sinr = roundTo(base.sinr * factor * variation(), 1);
          sinr = clamp(sinr, -5, 30);

          // Network metrics degrade with region factor
          latence = roundTo(base.latence / factor * variation(), 1);
          latence = clamp(latence, 10, 300);
          debitDescendant = roundTo(base.debitDescendant * factor * variation(), 1);
          debitDescendant = clamp(debitDescendant, 0.5, 100);
          debitMontant = roundTo(base.debitMontant * factor * variation(), 1);
          debitMontant = clamp(debitMontant, 0.2, 50);
          gigue = roundTo(base.jitter / factor * variation(), 1);
          gigue = clamp(gigue, 1, 100);
          tauxAppelReussi = roundTo(base.tauxAppel * factor * (0.95 + rng() * 0.1), 1);
          tauxAppelReussi = clamp(tauxAppelReussi, 50, 100);
          tauxDropCall = roundTo(100 - tauxAppelReussi, 1);
          tauxDropCall = clamp(tauxDropCall, 0, 50);
          debitDownload = roundTo(base.debitDown * factor * variation(), 1);
          debitDownload = clamp(debitDownload, 0.5, 100);
          debitUpload = roundTo(base.debitUp * factor * variation(), 1);
          debitUpload = clamp(debitUpload, 0.2, 50);
          ping = roundTo(base.ping / factor * variation(), 1);
          ping = clamp(ping, 5, 200);
          dnsLookupTime = roundTo((8 + rng() * 12) / factor, 1);
          tcpConnectTime = roundTo((12 + rng() * 18) / factor, 1);
          pageLoadTime = roundTo((1.2 + rng() * 2.5) / factor, 2);
          videoBuffering = roundTo((0.3 + rng() * 1.5) / factor, 2);

          // QoE score: based on operator baseline degraded by region factor
          scoreQoE = roundTo(base.scoreQoE * factor * (0.88 + rng() * 0.24), 0);
          scoreQoE = clamp(scoreQoE, 10, 100);
        } else {
          // Dead zone / no signal — measurements show very poor or no service
          rssi = roundTo(-105 - rng() * 15, 1);
          rsrp = roundTo(-115 - rng() * 10, 1);
          rsrq = roundTo(-18 - rng() * 5, 1);
          sinr = roundTo(-8 - rng() * 10, 1);
          latence = roundTo(150 + rng() * 200, 1);
          debitDescendant = roundTo(rng() * 1.5, 2);
          debitMontant = roundTo(rng() * 0.5, 2);
          gigue = roundTo(50 + rng() * 80, 1);
          tauxAppelReussi = roundTo(20 + rng() * 30, 1);
          tauxDropCall = roundTo(50 + rng() * 30, 1);
          debitDownload = roundTo(rng() * 1, 2);
          debitUpload = roundTo(rng() * 0.3, 2);
          ping = roundTo(100 + rng() * 200, 1);
          dnsLookupTime = roundTo(50 + rng() * 100, 1);
          tcpConnectTime = roundTo(80 + rng() * 150, 1);
          pageLoadTime = roundTo(8 + rng() * 15, 2);
          videoBuffering = roundTo(5 + rng() * 15, 2);
          scoreQoE = roundTo(5 + rng() * 12, 0);
        }

        // Spread measurements across last 90 days
        const daysAgo = Math.floor(rng() * 90);
        const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        await prisma.mesureQoS.create({
          data: {
            campagneId: campaignIds[campIdx],
            operateurId: opId,
            regionId: rId,
            latitude: center.lat + latJitter,
            longitude: center.lng + lngJitter,
            timestamp,
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

  // ═══════════════════════════════════════════════════════════
  // 8. Create Operator Scores — REALISTIC QUARTERLY PROGRESSION
  // ═══════════════════════════════════════════════════════════
  // Shows gradual improvement over 4 quarters (Q2-2025 → Q1-2026)
  // Orange: leader improving steadily (72→82)
  // MTN: solid progression (62→72)
  // Celcom: slow improvement, still below standards (42→55)
  // Intercel: minimal progress, critical situation (28→38)

  const scoreData: Record<string, {
    base: number[]; couverture: number[]; qos: number[];
    qoe: number[]; conformite: number[]; recos: string[];
  }> = {
    ORANGE: {
      base: [72, 75, 79, 82],
      couverture: [68, 71, 76, 80],
      qos: [76, 79, 82, 85],
      qoe: [74, 77, 80, 84],
      conformite: [70, 74, 78, 82],
      recos: [
        'Maintenir les investissements en infrastructure 4G+',
        'Étendre la couverture en zone rurale (Faranah, Nzérékoré)',
        'Déployer la 5G à Conakry en 2026',
        'Poursuivre la politique tarifaire compétitive',
      ],
    },
    MTN: {
      base: [62, 65, 68, 72],
      couverture: [58, 62, 66, 70],
      qos: [66, 69, 73, 76],
      qoe: [64, 67, 70, 74],
      conformite: [60, 63, 67, 71],
      recos: [
        'Améliorer la couverture en région forestière (Nzérékoré)',
        'Investir dans le backhaul fibre vers Labé et Kankan',
        'Accélérer le déploiement 4G en zone semi-urbaine',
        'Renforcer la redondance du réseau à Conakry',
      ],
    },
    CELCOM: {
      base: [42, 45, 48, 55],
      couverture: [35, 38, 43, 50],
      qos: [48, 51, 55, 60],
      qoe: [44, 47, 51, 57],
      conformite: [38, 42, 46, 52],
      recos: [
        'Plan de déploiement URGENT en zone rurale — 12 régions sans couverture',
        'Moderniser le réseau 3G → 4G dans les 6 prochains mois',
        'Résorber les zones blanches à Labé et Faranah',
        'Présenter un plan d\'investissement crédible à l\'ARPT sous 30 jours',
      ],
    },
    INTERCEL: {
      base: [28, 30, 33, 38],
      couverture: [20, 22, 26, 32],
      qos: [35, 37, 41, 46],
      qoe: [30, 33, 36, 41],
      conformite: [24, 27, 31, 37],
      recos: [
        'MISE EN DEMEURE : Restructuration complète du réseau requise',
        'Extension géographique PRIORITAIRE — 85% du territoire non couvert',
        'Remplacement des équipements obsolètes (2G → minimum 3G)',
        'Plan de redressement à soumettre à l\'ARPT — délai 60 jours',
      ],
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
          recommandation: sd.recos[qi] || null,
        },
      });
    }
  }
  console.log('  ✅ Operator Scores (4 quarters × 4 operators = 16)');

  // ═══════════════════════════════════════════════════════════
  // 9. Create Alerts — REALISTIC PRODUCTION ALERTS
  // ═══════════════════════════════════════════════════════════
  const alertData = [
    // ─── CRITICAL alerts ───
    { type: 'ZONE_BLANCHE', severity: 'CRITIQUE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['FAR'], message: 'Zone blanche confirmée — Intercel : aucune couverture sur 85% de la région de Faranah', details: '{"coverage_pct": 5, "sites_actifs": 2, "sites_requis": 18}' },
    { type: 'ZONE_BLANCHE', severity: 'CRITIQUE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['NZE'], message: 'Zone blanche critique — Intercel : signal indisponible dans la zone forestière de Nzérékoré', details: '{"coverage_pct": 8, "population_impactee": 125000}' },
    { type: 'COUPURE', severity: 'CRITIQUE', operateurId: operateurMap['CELCOM'], regionId: regionMap['LAB'], message: 'Coupure réseau Celcom Labé — BTS hors service depuis 72h, 180 000 abonnés impactés', details: '{"sites_hors_service": 4, "abonnes_impactes": 180000, "depuis": "2026-05-19"}' },
    { type: 'COUPURE', severity: 'CRITIQUE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['CON'], message: 'Coupure intermittente Intercel Conakry — surcharge réseau en heure de pointe', details: '{"freq_coupures": "4-6/jour", "duree_moyenne_min": 25, "heures_pic": "18h-22h"}' },

    // ─── HIGH alerts ───
    { type: 'DEGRADATION', severity: 'HAUTE', operateurId: operateurMap['CELCOM'], regionId: regionMap['FAR'], message: 'Dégradation sévère Celcom Faranah — débit moyen 2.1 Mbps (seuil ARPT: 5 Mbps)', details: '{"debit_moyen": 2.1, "seuil_regl": 5.0, "ecart_pct": -58}' },
    { type: 'DEGRADATION', severity: 'HAUTE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['KAN'], message: 'QoS insuffisante Intercel Kankan — taux d\'appel réussi 72% (seuil: 95%)', details: '{"taux_appel": 72, "seuil_regl": 95, "ecart_pct": -24}' },
    { type: 'ZONE_BLANCHE', severity: 'HAUTE', operateurId: operateurMap['CELCOM'], regionId: regionMap['FAR'], message: 'Couverture Celcom Faranah insuffisante — seulement 18% de la zone couverte en 2G/3G', details: '{"coverage_pct": 18, "techno": "2G/3G", "population_impactee": 770000}' },
    { type: 'SEUIL_DEPASSE', severity: 'HAUTE', operateurId: operateurMap['MTN'], regionId: regionMap['NZE'], message: 'Latence MTN Nzérékoré — 85ms moyen (seuil ARPT: 50ms), impact services data', details: '{"latence_moyenne": 85, "seuil_regl": 50, "ecart_pct": 70}' },

    // ─── MEDIUM alerts ───
    { type: 'DEGRADATION', severity: 'MOYENNE', operateurId: operateurMap['MTN'], regionId: regionMap['FAR'], message: 'Latence élevée MTN Faranah — 62ms (seuil recommandé: 50ms)', details: '{"latence_moyenne": 62, "seuil_regl": 50}' },
    { type: 'DEGRADATION', severity: 'MOYENNE', operateurId: operateurMap['CELCOM'], regionId: regionMap['LAB'], message: 'Jitter excessif Celcom Labé — 28ms (seuil: 15ms), impact voix', details: '{"jitter_moyen": 28, "seuil_regl": 15}' },
    { type: 'DEGRADATION', severity: 'MOYENNE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['BOK'], message: 'Débit descendant Intercel Boké — 3.2 Mbps (seuil minimum: 5 Mbps)', details: '{"debit_moyen": 3.2, "seuil_regl": 5.0}' },
    { type: 'SEUIL_DEPASSE', severity: 'MOYENNE', operateurId: operateurMap['CELCOM'], regionId: regionMap['KIN'], message: 'Taux de drop call Celcom Kindia — 12.5% (seuil: 5%)', details: '{"drop_rate": 12.5, "seuil_regl": 5.0}' },
    { type: 'SEUIL_DEPASSE', severity: 'MOYENNE', operateurId: operateurMap['MTN'], regionId: regionMap['LAB'], message: 'Couverture MTN Labé en dessous du seuil réglementaire — 48% (minimum: 60%)', details: '{"coverage_pct": 48, "seuil_regl": 60}' },
    { type: 'DEGRADATION', severity: 'MOYENNE', operateurId: operateurMap['ORANGE'], regionId: regionMap['NZE'], message: 'Signal Orange Nzérékoré instable en zone forestière — RSSI moyen -88 dBm', details: '{"rssi_moyen": -88, "zone": "forestiere"}' },

    // ─── LOW alerts (maintenance / info) ───
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['ORANGE'], regionId: regionMap['CON'], message: 'Maintenance planifiée Orange Conakry — 22h00-04h00, passage fibre sous-marin', details: '{"maintenance": true, "debut": "22h00", "fin": "04h00", "impact": "mineur"}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['MTN'], regionId: regionMap['CON'], message: 'Maintenance planifiée MTN Conakry — 23h00-05h00, mise à jour cœur de réseau', details: '{"maintenance": true, "debut": "23h00", "fin": "05h00"}' },
    { type: 'SEUIL_DEPASSE', severity: 'BASSE', operateurId: operateurMap['ORANGE'], regionId: regionMap['KAN'], message: 'Amélioration débit constatée Orange Kankan après ajout BTS 4G', details: '{"debit_avant": 32, "debit_apres": 42, "nouvelle_bts": true}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['ORANGE'], regionId: regionMap['LAB'], message: 'Mise à jour logiciel réseau planifiée Orange Labé — semaine du 25 mai', details: '{"upgrade": true, "version": "5.2.1"}' },
    { type: 'SEUIL_DEPASSE', severity: 'BASSE', operateurId: operateurMap['MTN'], regionId: regionMap['KAN'], message: 'Extension 4G MTN Kankan en cours — 3 nouvelles BTS en déploiement', details: '{"extension4G": true, "nouvelles_bts": 3}' },
    { type: 'DEGRADATION', severity: 'BASSE', operateurId: operateurMap['INTERCEL'], regionId: regionMap['CON'], message: 'Modernisation réseau Intercel Conakry en cours — remplacement équipements 2G', details: '{"modernisation": true, "phase": 1}' },
  ];

  for (const a of alertData) {
    await prisma.alerte.create({ data: a });
  }
  console.log('  ✅ Alerts (20) — 4 critique, 4 haute, 6 moyenne, 6 basse');

  // ═══════════════════════════════════════════
  // 10. Create Reports
  // ═══════════════════════════════════════════
  const reportData = [
    { titre: 'Rapport QoS Trimestriel T1 2026 — Observatoire National', type: 'REGLEMENTAIRE', format: 'PDF', campagneId: campaignIds[0], generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Benchmark Opérateurs — Mars 2026', type: 'OPERATEUR', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: false },
    { titre: 'Couverture Nationale — Rapport Annuel 2025', type: 'PUBLIC', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Audit Terrain — Zone Blanche Faranah (Intercel/Celcom)', type: 'INTERNE', format: 'EXCEL', campagneId: campaignIds[3], generePar: 'system', statut: 'PUBLIE', isPublic: false },
    { titre: 'Score Card Opérateurs Q1 2026', type: 'OPERATEUR', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: false },
    { titre: 'Rapport Cybersécurité Mensuel — Avril 2026', type: 'REGLEMENTAIRE', format: 'PDF', campagneId: null, generePar: 'system', statut: 'GENERE', isPublic: false },
    { titre: 'Benchmark International WAEMU 2025', type: 'BENCHMARK', format: 'PPT', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Rapport Zones Blanches National — Recensement 2025', type: 'PUBLIC', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: true },
    { titre: 'Mise en Demeure Intercel — Conformité Réglementaire', type: 'REGLEMENTAIRE', format: 'PDF', campagneId: null, generePar: 'system', statut: 'PUBLIE', isPublic: false },
    { titre: 'Plan de Redressement Celcom — Suivi ARPT', type: 'INTERNE', format: 'PDF', campagneId: null, generePar: 'system', statut: 'EN_COURS', isPublic: false },
    { titre: 'Analyse Tendances QoS — Comparaison Q4-2025 vs Q1-2026', type: 'INTERNE', format: 'EXCEL', campagneId: null, generePar: 'system', statut: 'GENERE', isPublic: false },
  ];

  for (const r of reportData) {
    await prisma.rapport.create({ data: r });
  }
  console.log('  ✅ Reports (11)');

  // ═══════════════════════════════════════════
  // 11. Create Audit Log entries
  // ═══════════════════════════════════════════
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@arpt.gn' } });
  const dgUser = await prisma.user.findUnique({ where: { email: 'dg@arpt.gn' } });
  const analysteUser = await prisma.user.findUnique({ where: { email: 'analyste@arpt.gn' } });

  const auditEntries: { userId: string; action: string; resource: string; resourceId?: string; details: string; ipAddress: string }[] = [];

  if (adminUser) {
    auditEntries.push(
      { userId: adminUser.id, action: 'LOGIN', resource: 'system', details: '{"method": "credentials"}', ipAddress: '196.128.1.1' },
      { userId: adminUser.id, action: 'READ', resource: 'dashboard', details: '{"tab": "dashboard-dg", "periode": "Q1-2026"}', ipAddress: '196.128.1.1' },
      { userId: adminUser.id, action: 'EXPORT', resource: 'rapport', resourceId: '1', details: '{"format": "PDF", "titre": "Rapport QoS T1 2026"}', ipAddress: '196.128.1.1' },
      { userId: adminUser.id, action: 'CREATE', resource: 'campaign', details: '{"name": "Audit Zone Blanche Celcom Faranah Q3-2026"}', ipAddress: '196.128.1.2' },
      { userId: adminUser.id, action: 'UPDATE', resource: 'user', details: '{"action": "update_role", "target": "ing.rf@arpt.gn"}', ipAddress: '196.128.1.1' },
    );
  }
  if (dgUser) {
    auditEntries.push(
      { userId: dgUser.id, action: 'LOGIN', resource: 'system', details: '{"method": "credentials"}', ipAddress: '196.128.2.10' },
      { userId: dgUser.id, action: 'READ', resource: 'scoring', details: '{"periode": "2026-Q1", "view": "radar"}', ipAddress: '196.128.2.10' },
      { userId: dgUser.id, action: 'EXPORT', resource: 'rapport', details: '{"format": "PDF", "titre": "Score Card Opérateurs Q1 2026"}', ipAddress: '196.128.2.10' },
    );
  }
  if (analysteUser) {
    auditEntries.push(
      { userId: analysteUser.id, action: 'LOGIN', resource: 'system', details: '{"method": "credentials"}', ipAddress: '196.128.3.5' },
      { userId: analysteUser.id, action: 'READ', resource: 'dashboard', details: '{"tab": "qos", "filters": {"operator": "ORANGE"}}', ipAddress: '196.128.3.5' },
      { userId: analysteUser.id, action: 'READ', resource: 'sig', details: '{"region": "CON", "layer": "couverture"}', ipAddress: '196.128.3.5' },
      { userId: analysteUser.id, action: 'EXPORT', resource: 'scoring', details: '{"format": "EXCEL", "periode": "2026-Q1"}', ipAddress: '196.128.3.5' },
    );
  }

  for (const ae of auditEntries) {
    await prisma.auditLog.create({
      data: {
        ...ae,
        userAgent: 'Mozilla/5.0 ONIT-PNG/2.0',
      },
    });
  }
  console.log(`  ✅ Audit Log (${auditEntries.length})`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 PRODUCTION-REALISTIC database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Résumé des données:');
  console.log('  • Orange Guinée  : Score 82/100 — Leader du marché');
  console.log('  • MTN Guinée     : Score 72/100 — Challenger solide');
  console.log('  • Celcom Guinée  : Score 55/100 — En difficulté');
  console.log('  • Intercel Guinée: Score 38/100 — Situation critique');
  console.log(`  • ${totalMeasures} mesures QoS sur 8 régions × 4 opérateurs`);
  console.log('  • 20 alertes (4 critique, 4 haute, 6 moyenne, 6 basse)');
  console.log('  • 16 scores trimestriels (4 opérateurs × 4 trimestres)');
  console.log('\n📋 Identifiants par défaut:');
  console.log('  Email    : admin@arpt.gn');
  console.log('  Password : Admin@2026!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

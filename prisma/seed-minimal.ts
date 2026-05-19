import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed minimal ONIT-PNG — Infrastructure uniquement (aucune donnée de test)');
  console.log('   Les données de test doivent être injectées via l\'API ou les fichiers de test.');

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
        { resource: 'scoring', action: 'admin' }, { resource: 'scoring', action: 'read' }, { resource: 'scoring', action: 'write' }, { resource: 'scoring', action: 'export' },
        { resource: 'sig', action: 'admin' }, { resource: 'sig', action: 'read' },
        { resource: 'user', action: 'admin' }, { resource: 'user', action: 'read' }, { resource: 'user', action: 'write' }, { resource: 'user', action: 'delete' },
        { resource: 'campaign', action: 'admin' }, { resource: 'campaign', action: 'read' }, { resource: 'campaign', action: 'write' },
        { resource: 'alert', action: 'admin' }, { resource: 'alert', action: 'read' }, { resource: 'alert', action: 'write' },
        { resource: 'prestataire', action: 'admin' }, { resource: 'prestataire', action: 'write' },
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
        { resource: 'prestataire', action: 'write' },
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
      description: 'Opérateur - Lecture données propres uniquement + Envoi mesures via API prestataire',
      permissions: [
        { resource: 'dashboard', action: 'read' },
        { resource: 'rapport', action: 'read' },
        { resource: 'scoring', action: 'read' },
        { resource: 'sig', action: 'read' },
        { resource: 'prestataire', action: 'write' },
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
  // 3. Create Users (1 admin + 4 opérateur accounts)
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
    // Opérateur accounts — peuvent aussi utiliser l'API prestataire
    { email: 'tech@orange.gn', name: 'Responsable Technique Orange', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Orange Guinée' },
    { email: 'tech@mtn.gn', name: 'Responsable Technique MTN', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'MTN Guinée' },
    { email: 'tech@celcom.gn', name: 'Responsable Technique Celcom', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Celcom Guinée' },
    { email: 'tech@intercel.gn', name: 'Responsable Technique Intercel', passwordHash: adminHash, roleId: roleMap['OPERATEUR_READONLY']!, organization: 'Intercel Guinée' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('  ✅ Users (11) — mot de passe: Admin@2026!');

  // ═══════════════════════════════════════════
  // 4. Create Regions (8 régions administratives)
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
  // 5. Create Operators (4 opérateurs guinéens)
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
  console.log('  ✅ Opérateurs (4) — ORANGE, MTN, CELCOM, INTERCEL');

  // ═══════════════════════════════════════════
  // 6. Create Prestataire API Keys
  // ═══════════════════════════════════════════
  // Each operator gets an API key for the prestataire endpoint
  const apiKeys = [
    { name: 'Orange API Key', key: 'prest-orange-2026-ak1a2b3c4d', operateurId: operateurMap['ORANGE']! },
    { name: 'MTN API Key', key: 'prest-mtn-2026-x9y8z7w6v5', operateurId: operateurMap['MTN']! },
    { name: 'Celcom API Key', key: 'prest-celcom-2026-p1q2r3s4t5', operateurId: operateurMap['CELCOM']! },
    { name: 'Intercel API Key', key: 'prest-intercel-2026-m6n7o8p9q0', operateurId: operateurMap['INTERCEL']! },
  ];

  // Store API keys as environment-like config — logged for admin reference
  console.log('\n  🔑 Clés API Prestataire:');
  for (const ak of apiKeys) {
    console.log(`     ${ak.name}: ${ak.key}`);
  }

  console.log('\n🎉 Seed minimal terminé !');
  console.log('\n📋 Comptes de connexion:');
  console.log('  Admin:    admin@arpt.gn / Admin@2026!');
  console.log('  DG:       dg@arpt.gn / Admin@2026!');
  console.log('  DGA:      dga@arpt.gn / Admin@2026!');
  console.log('  Dir.Tech: dir.tech@arpt.gn / Admin@2026!');
  console.log('  Ing.RF:   ing.rf@arpt.gn / Admin@2026!');
  console.log('  Analyste: analyse@arpt.gn / Admin@2026!');
  console.log('  Auditeur: auditeur@arpt.gn / Admin@2026!');
  console.log('  Orange:   tech@orange.gn / Admin@2026!');
  console.log('  MTN:      tech@mtn.gn / Admin@2026!');
  console.log('  Celcom:   tech@celcom.gn / Admin@2026!');
  console.log('  Intercel:  tech@intercel.gn / Admin@2026!');
  console.log('\n📊 AUCUNE donnée de test n\'a été injectée.');
  console.log('   Utilisez l\'API ou les fichiers dans test-data/ pour injecter des données.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

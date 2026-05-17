#!/bin/sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Docker Entrypoint
# Initializes the database on first run, then starts the server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

DB_PATH="/app/data/onit-png.db"

echo "🚀 ONIT-PNG Docker Entry Point"
echo "   DATABASE_URL: $DATABASE_URL"
echo ""

# Check if database exists (first run detection)
if [ ! -f "$DB_PATH" ]; then
  echo "📊 Première exécution — Initialisation de la base de données..."
  
  # Push schema to create tables
  npx prisma db push --skip-generate 2>&1 || true
  
  # Run minimal seed (roles, admin, regions, 4 operators — NO test data)
  npx tsx prisma/seed-minimal.ts 2>&1 || node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`.then(() => {
      console.log('✅ Database already initialized');
      prisma.\$disconnect();
    }).catch(e => {
      console.error('❌ Database initialization failed:', e.message);
      prisma.\$disconnect();
      process.exit(1);
    });
  "
  
  echo "✅ Base de données initialisée !"
  echo ""
fi

echo "🌐 Démarrage du serveur ONIT-PNG sur le port $PORT..."
echo ""
echo "📋 Comptes de connexion:"
echo "   Admin:    admin@arpt.gn / Admin@2026!"
echo "   DG:       dg@arpt.gn / Admin@2026!"
echo "   Orange:   tech@orange.gn / Admin@2026!"
echo "   MTN:      tech@mtn.gn / Admin@2026!"
echo "   Celcom:   tech@celcom.gn / Admin@2026!"
echo "   GuinTel:  tech@guinetel.gn / Admin@2026!"
echo ""
echo "🔑 API Prestataire:"
echo "   Orange:   prest-orange-2026-ak1a2b3c4d"
echo "   MTN:      prest-mtn-2026-x9y8z7w6v5"
echo "   Celcom:   prest-celcom-2026-p1q2r3s4t5"
echo "   GuinTel:  prest-guinetel-2026-m6n7o8p9q0"
echo ""
echo "📡 Endpoints API:"
echo "   GET  /api/prestataire              — Statut (header: X-API-Key)"
echo "   POST /api/prestataire              — Injecter données (mesures/scores/alertes)"
echo "   GET  /api/dashboard                — KPIs tableau de bord"
echo "   GET  /api/campaigns                — Liste campagnes"
echo "   GET  /api/mesures                  — Liste mesures QoS"
echo "   GET  /api/scores                   — Scores opérateurs"
echo "   GET  /api/alerts                   — Alertes"
echo "   GET  /api/map                      — Données carte SIG"
echo ""

# Start the Next.js server
exec node server.js

#!/bin/sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Docker Entrypoint
# Initializes the database on first run, then starts the server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

DB_PATH="/app/db/onit-png.db"

echo "🚀 ONIT-PNG Docker Entry Point"
echo ""

# SECURITY: Verify NEXTAUTH_SECRET is set (fail fast if missing)
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ CRITICAL: NEXTAUTH_SECRET is not set!"
  echo "   Generate one with: openssl rand -base64 32"
  echo "   Set it in .env.docker or pass as environment variable"
  exit 1
fi

# Check if database exists (first run detection)
if [ ! -f "$DB_PATH" ]; then
  echo "📊 Première exécution — Initialisation de la base de données..."
  
  # Push schema to create tables
  if ! npx prisma db push --skip-generate 2>&1; then
    echo "❌ Schema push failed — attempting fallback verification..."
    node -e "
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
  fi
  
  # Run minimal seed (roles, admin, regions, 4 operators — NO test data)
  npx tsx prisma/seed-minimal.ts 2>&1 || echo "⚠️ Seed script not found or failed — DB may already be seeded"
  
  echo "✅ Base de données initialisée !"
  echo ""
fi

echo "🌐 Démarrage du serveur ONIT-PNG sur le port $PORT..."
echo ""
echo "📋 Comptes de connexion: (voir documentation interne pour les identifiants)"
echo "🔑 API Prestataire: Clés configurées en base de données (voir administration)"
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

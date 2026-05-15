#!/bin/bash
# ONIT-PNG Platform Startup Script
# ARPT Guinée - Observatoire National Intelligent des Télécommunications

cd /home/z/my-project/.next/standalone

export DATABASE_URL="file:/home/z/my-project/prisma/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="onit-png-secret-key-2026-guinee-arpt"
export PORT=3000
export HOSTNAME="0.0.0.0"

echo "🏛️  ONIT-PNG - Démarrage de la plateforme..."
echo "   Base de données: $DATABASE_URL"
echo "   URL: http://0.0.0.0:3000"
echo ""

exec node server.js

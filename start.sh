#!/bin/bash
# ONIT-PNG Platform Startup Script
# ARPT Guinée - Observatoire National Intelligent des Télécommunications

cd /home/z/my-project/.next/standalone

export DATABASE_URL="file:/home/z/my-project/prisma/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
# SECURITY: NEXTAUTH_SECRET must be set before running this script
# Generate with: openssl rand -base64 32
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "ERROR: NEXTAUTH_SECRET environment variable is not set!"
  echo "Generate one with: export NEXTAUTH_SECRET=\$(openssl rand -base64 32)"
  exit 1
fi
export PORT=3000
export HOSTNAME="0.0.0.0"

echo "ONIT-PNG - Demarrage de la plateforme..."
echo "   Base de donnees: $DATABASE_URL"
echo "   URL: http://0.0.0.0:3000"
echo ""

exec node server.js

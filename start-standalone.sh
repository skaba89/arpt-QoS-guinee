#!/bin/bash
cd /home/z/my-project/.next/standalone
export DATABASE_URL="file:/home/z/my-project/prisma/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
# SECURITY: NEXTAUTH_SECRET must be set before running this script
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "ERROR: NEXTAUTH_SECRET environment variable is not set!"
  echo "Generate one with: export NEXTAUTH_SECRET=\$(openssl rand -base64 32)"
  exit 1
fi
exec node server.js

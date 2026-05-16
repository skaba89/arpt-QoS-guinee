#!/bin/bash
cd /home/z/my-project/.next/standalone
export DATABASE_URL="file:/home/z/my-project/prisma/prisma/dev.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="onit-png-secret-key-2026-guinee-arpt"
exec node server.js

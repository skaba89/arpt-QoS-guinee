# ═══════════════════════════════════════════════════════════
# ONIT-PNG — Dockerfile Multi-Stage Production Build
# Observatoire National Intelligent des Télécommunications
# République de Guinée — ARPT
# ═══════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# SECURITY: Add .dockerignore protection — never copy .env into build context
# The .dockerignore file should exclude: .env, .env.local, .env.production, .git, node_modules

# ───────────────────────────────────────────────────────────
# Stage 2: Build
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# SECURITY: Use a build-time NEXTAUTH_SECRET (not the production one)
# This is only needed for the build process, not runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXTAUTH_SECRET=build-only-secret-not-for-runtime

# Build the application (standalone output)
RUN npm run build

# ───────────────────────────────────────────────────────────
# Stage 3: Production Runner
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# SECURITY: Use wget instead of curl (smaller attack surface — already in Alpine)
# HEALTHCHECK uses wget below

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and runtime files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy database directory
COPY --from=builder /app/db ./db

# Copy entrypoint script
COPY --from=builder /app/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create data directory and set permissions
RUN mkdir -p /app/db && \
    chown -R nextjs:nodejs /app/db && \
    chown -R nextjs:nodejs /app/.next && \
    chown -R nextjs:nodejs /app/public

USER nextjs

EXPOSE 3000

# Health check (using wget which is built into Alpine — no need for curl)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/auth/session || exit 1

# Startup: run migrations then start server
ENTRYPOINT ["/app/docker-entrypoint.sh"]

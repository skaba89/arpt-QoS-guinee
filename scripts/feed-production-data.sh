#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ARPT-QoS-Guinée — Script Maître d'Alimentation Production
# Exécute les deux options de chargement de données
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   bash scripts/feed-production-data.sh                    # Les deux options
#   bash scripts/feed-production-data.sh option1            # Option 1 uniquement (ARPT Admin)
#   bash scripts/feed-production-data.sh option2            # Option 2 uniquement (Opérateurs API)
#   bash scripts/feed-production-data.sh clean              # Reset base + re-import
#   bash scripts/feed-production-data.sh status             # Vérifier état de la base
#

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PROJECT_DIR="/home/z/my-project"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ─── Vérifier que le serveur est accessible ───
check_server() {
  if ! curl -sf --max-time 5 "${BASE_URL}/api/health" > /dev/null 2>&1; then
    log_err "Serveur non accessible sur ${BASE_URL}"
    log_info "Démarrez le serveur avec: cd ${PROJECT_DIR} && npm run dev"
    exit 1
  fi
  log_ok "Serveur accessible sur ${BASE_URL}"
}

# ─── Vérifier l'état de la base ───
check_status() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "📊 État actuel de la base de données"
  echo "═══════════════════════════════════════════════════════"

  cd "${PROJECT_DIR}"
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    async function main() {
      const ops = await p.operateur.findMany({ select: { code: true, nom: true, isActive: true } });
      const opCount = ops.length;
      const regCount = await p.region.count();
      const mesCount = await p.mesureQoS.count();
      const scoreCount = await p.scoreOperateur.count();
      const alertCount = await p.alerte.count();
      const campCount = await p.campagne.count();
      const userCount = await p.user.count();

      console.log('  Opérateurs     :', opCount);
      for (const op of ops) {
        console.log('    -', op.code, ':', op.nom, op.isActive ? '(actif)' : '(inactif)');
      }
      console.log('  Régions        :', regCount);
      console.log('  Campagnes      :', campCount);
      console.log('  Mesures QoS    :', mesCount);
      console.log('  Scores         :', scoreCount);
      console.log('  Alertes        :', alertCount);
      console.log('  Utilisateurs   :', userCount);
      await p.\$disconnect();
    }
    main();
  "
  echo "═══════════════════════════════════════════════════════"
}

# ─── Nettoyer et réinitialiser la base ───
clean_database() {
  echo ""
  log_warn "⚠️  Réinitialisation de la base de données..."
  cd "${PROJECT_DIR}"

  # Réinitialiser avec le seed minimal puis re-importer
  npx prisma migrate reset --force --skip-seed 2>/dev/null || true
  npx tsx prisma/seed.ts

  log_ok "Base de données réinitialisée"
}

# ─── Option 1 : Import ARPT Admin ───
run_option1() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "🏢  OPTION 1 — Import ARPT Admin (Session Auth)"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  cd "${PROJECT_DIR}"
  npx tsx scripts/import-arpt-admin.ts --csv

  log_ok "Option 1 terminée"
}

# ─── Option 2 : Import par Opérateur via API ───
run_option2() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "📡  OPTION 2 — Import par Opérateur (Clé API)"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  cd "${PROJECT_DIR}"
  npx tsx scripts/import-operateurs-api.ts --csv

  log_ok "Option 2 terminée"
}

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "🇬🇳  ARPT-QoS-Guinée — Alimentation Production"
echo "═══════════════════════════════════════════════════════"

check_server

ACTION="${1:-all}"

case "${ACTION}" in
  status)
    check_status
    ;;
  clean)
    clean_database
    run_option1
    run_option2
    check_status
    ;;
  option1)
    run_option1
    check_status
    ;;
  option2)
    run_option2
    check_status
    ;;
  all|*)
    run_option1
    run_option2
    check_status
    ;;
esac

echo ""
log_ok "Alimentation terminée avec succès !"
echo ""
echo "🔗 Accès au portail : ${BASE_URL}"
echo "📧 Email : admin@arpt.gn"
echo "🔑 Mot de passe : Admin@2026!"
echo ""

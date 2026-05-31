#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Import des données via Admin ARPT (session auth)
# L'admin ARPT importe les données de tous les opérateurs
# ═══════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

log_info()  { echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"; }
log_ok()    { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1"; }
log_warn()  { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"; }
log_err()   { echo -e "${COLOR_RED}[ERREUR]${COLOR_RESET} $1"; }

# 1. Authentification
log_info "Authentification admin@arpt.gn..."

# Obtenir le cookie CSRF
CSRF_RESPONSE=$(curl -s -c /tmp/arpt-cookies.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo "${CSRF_RESPONSE}" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Login
LOGIN_RESPONSE=$(curl -s -c /tmp/arpt-cookies.txt -b /tmp/arpt-cookies.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@arpt.gn&password=Admin%402026!&csrfToken=${CSRF_TOKEN}")

if [ -z "${LOGIN_RESPONSE}" ]; then
  log_err "Échec d'authentification"
  exit 1
fi
log_ok "Authentifié avec succès"

# Import mesures via endpoint admin
import_mesures_admin() {
  local file=$1
  local label=$2
  
  if [ ! -f "${file}" ]; then
    log_warn "Fichier non trouvé: ${file}"
    return 1
  fi
  
  log_info "Import mesures: ${label}..."
  response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/import" \
    -b /tmp/arpt-cookies.txt \
    -H "Content-Type: text/csv" \
    --data-binary @"${file}")
  
  http_code=$(echo "${response}" | tail -1)
  body=$(echo "${response}" | head -n -1)
  
  if [ "${http_code}" = "200" ] || [ "${http_code}" = "201" ]; then
    log_ok "Mesures ${label} importées"
  else
    log_err "Mesures ${label} - HTTP ${http_code}"
    echo "${body}" | head -c 200
    echo ""
  fi
}

# Import scores via endpoint admin
import_scores_admin() {
  local file=$1
  local label=$2
  
  if [ ! -f "${file}" ]; then
    log_warn "Fichier non trouvé: ${file}"
    return 1
  fi
  
  log_info "Import scores: ${label}..."
  response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/import-scoring" \
    -b /tmp/arpt-cookies.txt \
    -H "Content-Type: application/json" \
    -d @"${file}")
  
  http_code=$(echo "${response}" | tail -1)
  body=$(echo "${response}" | head -n -1)
  
  if [ "${http_code}" = "200" ] || [ "${http_code}" = "201" ]; then
    log_ok "Scores ${label} importés"
  else
    log_err "Scores ${label} - HTTP ${http_code}"
    echo "${body}" | head -c 200
    echo ""
  fi
}

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

QUARTER=${1:-all}
OPERATORS="orange mtn celcom intercel"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import via Admin ARPT - ARPT-QoS-Guinée 2025"
echo "════════════════════════════════════════════════════════"
echo ""

if [ "${QUARTER}" = "all" ]; then
  QUARTERS="Q1 Q2 Q3 Q4"
else
  QUARTERS="${QUARTER}"
fi

for q in ${QUARTERS}; do
  echo ""
  echo "── Trimestre ${q} ──"
  
  # Import mesures (format admin avec colonne opérateur)
  for op in ${OPERATORS}; do
    import_mesures_admin "${SCRIPT_DIR}/admin-mesures-${op}-2025-${q}.csv" "${op} ${q}"
    sleep 1
  done
  
  # Import scores (tous opérateurs combinés)
  import_scores_admin "${SCRIPT_DIR}/scores-tous-operateurs-2025-${q}.json" "tous ${q}"
  
  sleep 2
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import terminé !"
echo "════════════════════════════════════════════════════════"

#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Import des données via API Prestataire
# Chaque opérateur envoie ses données avec sa clé API
# ═══════════════════════════════════════════════════════════

BASE_URL="http://localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Clés API
API_KEY_ORANGE="onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ"
API_KEY_MTN="onit-MTN-f3Hb7nKcP5dAqW1xY8uE"
API_KEY_CELCOM="onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH"
API_KEY_INTERCEL="onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ"

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

log_info()  { echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"; }
log_ok()    { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1"; }
log_warn()  { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"; }
log_err()   { echo -e "${COLOR_RED}[ERREUR]${COLOR_RESET} $1"; }

import_mesures() {
  local operateur=$1
  local api_key=$2
  local quarter=$3
  local file="${SCRIPT_DIR}/api-mesures-${operateur}-2025-${quarter}.json"
  
  if [ ! -f "${file}" ]; then
    log_warn "Fichier non trouvé: ${file}"
    return 1
  fi
  
  log_info "Import mesures ${operateur} ${quarter}..."
  response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/prestataires/mesures" \
    -H "X-API-Key: ${api_key}" \
    -H "Content-Type: application/json" \
    -d @"${file}")
  
  http_code=$(echo "${response}" | tail -1)
  body=$(echo "${response}" | head -n -1)
  
  if [ "${http_code}" = "200" ] || [ "${http_code}" = "201" ]; then
    log_ok "Mesures ${operateur} ${quarter} importées (${http_code})"
  else
    log_err "Mesures ${operateur} ${quarter} - HTTP ${http_code}: ${body}"
  fi
}

import_scores() {
  local operateur=$1
  local api_key=$2
  local quarter=$3
  local file="${SCRIPT_DIR}/scores-${operateur}-2025-${quarter}.json"
  
  if [ ! -f "${file}" ]; then
    log_warn "Fichier non trouvé: ${file}"
    return 1
  fi
  
  log_info "Import scores ${operateur} ${quarter}..."
  response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/prestataires/scores" \
    -H "X-API-Key: ${api_key}" \
    -H "Content-Type: application/json" \
    -d @"${file}")
  
  http_code=$(echo "${response}" | tail -1)
  body=$(echo "${response}" | head -n -1)
  
  if [ "${http_code}" = "200" ] || [ "${http_code}" = "201" ]; then
    log_ok "Scores ${operateur} ${quarter} importés (${http_code})"
  else
    log_err "Scores ${operateur} ${quarter} - HTTP ${http_code}: ${body}"
  fi
}

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

OPERATEUR=${1:-all}
QUARTERS="Q1 Q2 Q3 Q4"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import via API Prestataire - ARPT-QoS-Guinée 2025"
echo "════════════════════════════════════════════════════════"
echo ""

case "${OPERATEUR}" in
  orange|ORANGE)
    for q in ${QUARTERS}; do
      import_mesures "orange" "${API_KEY_ORANGE}" "${q}"
      import_scores "orange" "${API_KEY_ORANGE}" "${q}"
      sleep 2
    done
    ;;
  mtn|MTN)
    for q in ${QUARTERS}; do
      import_mesures "mtn" "${API_KEY_MTN}" "${q}"
      import_scores "mtn" "${API_KEY_MTN}" "${q}"
      sleep 2
    done
    ;;
  celcom|CELCOM)
    for q in ${QUARTERS}; do
      import_mesures "celcom" "${API_KEY_CELCOM}" "${q}"
      import_scores "celcom" "${API_KEY_CELCOM}" "${q}"
      sleep 2
    done
    ;;
  intercel|INTERCEL)
    for q in ${QUARTERS}; do
      import_mesures "intercel" "${API_KEY_INTERCEL}" "${q}"
      import_scores "intercel" "${API_KEY_INTERCEL}" "${q}"
      sleep 2
    done
    ;;
  all)
    for q in ${QUARTERS}; do
      echo ""
      echo "── Trimestre ${q} ──"
      import_mesures "orange" "${API_KEY_ORANGE}" "${q}"
      import_mesures "mtn" "${API_KEY_MTN}" "${q}"
      import_mesures "celcom" "${API_KEY_CELCOM}" "${q}"
      import_mesures "intercel" "${API_KEY_INTERCEL}" "${q}"
      import_scores "orange" "${API_KEY_ORANGE}" "${q}"
      import_scores "mtn" "${API_KEY_MTN}" "${q}"
      import_scores "celcom" "${API_KEY_CELCOM}" "${q}"
      import_scores "intercel" "${API_KEY_INTERCEL}" "${q}"
      sleep 3
    done
    ;;
  *)
    echo "Usage: $0 {orange|mtn|celcom|intercel|all}"
    exit 1
    ;;
esac

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Import terminé !"
echo "════════════════════════════════════════════════════════"

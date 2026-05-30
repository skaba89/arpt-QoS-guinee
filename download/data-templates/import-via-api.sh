#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ARPT-QoS-Guinée — Import via API (simulation production)
# Chaque opérateur pousse ses données avec sa clé API
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   bash scripts/import-via-api.sh                    # Tous les opérateurs
#   bash scripts/import-via-api.sh orange              # Orange uniquement
#   bash scripts/import-via-api.sh scores              # Scores uniquement
#   bash scripts/import-via-api.sh mesures             # Mesures uniquement
#

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

# ─── Clés API par opérateur ───
ORANGE_KEY="onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ"
MTN_KEY="onit-MTN-f3Hb7nKcP5dAqW1xY8uE"
CELCOM_KEY="onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH"
INTERCEL_KEY="onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ"

# ─── Couleurs ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ─── Vérifier que le serveur est accessible ───
check_server() {
  if ! curl -sf --max-time 5 "${BASE_URL}/api/health" > /dev/null 2>&1; then
    log_err "Serveur non accessible sur ${BASE_URL}"
    log_info "Démarrez le serveur avec: cd /home/z/my-project && node server.js"
    exit 1
  fi
  log_ok "Serveur accessible sur ${BASE_URL}"
}

# ─── Envoyer des mesures pour un opérateur ───
send_mesures() {
  local operator_name="$1"
  local api_key="$2"
  local region_code="$3"
  local region_nom="$4"
  local count="$5"
  local periode="$6"

  local lat_base="$7"
  local lng_base="$8"
  local type_mesure="$9"

  # Générer les mesures en JSON
  local mesures="["
  for i in $(seq 1 "$count"); do
    # Coordonnées aléatoires autour du centre
    local lat=$(echo "$lat_base + ($RANDOM % 100 - 50) / 1000" | bc -l)
    local lng=$(echo "$lng_base + ($RANDOM % 100 - 50) / 1000" | bc -l)

    # Timestamp aléatoire dans le trimestre
    local month=$(shuf -e 01 02 03 04 05 06 07 08 09 10 11 12 -n 1)
    local day=$(shuf -e 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 -n 1)
    local hour=$(shuf -e 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 -n 1)
    local min=$(shuf -e 00 15 30 45 -n 1)

    local ts="2026-${month}-${day}T${hour}:${min}:00Z"

    # Valeurs réalistes selon l'opérateur
    local rssi debit latence score_qoe

    case "$operator_name" in
      "Orange")
        rssi=$(shuf -e -65 -70 -72 -68 -60 -75 -80 -63 -67 -71 -n 1)
        debit=$(shuf -e 25 30 22 35 28 18 32 20 27 33 -n 1)
        latence=$(shuf -e 25 30 35 28 40 32 38 22 45 30 -n 1)
        score_qoe=$(shuf -e 80 85 78 82 88 75 90 77 83 86 -n 1)
        ;;
      "MTN")
        rssi=$(shuf -e -72 -78 -80 -75 -68 -82 -70 -76 -85 -73 -n 1)
        debit=$(shuf -e 18 22 15 25 20 12 28 16 24 19 -n 1)
        latence=$(shuf -e 35 42 48 38 55 40 50 33 60 45 -n 1)
        score_qoe=$(shuf -e 70 75 68 72 78 65 80 67 73 76 -n 1)
        ;;
      "Celcom")
        rssi=$(shuf -e -80 -85 -90 -82 -78 -92 -76 -88 -95 -83 -n 1)
        debit=$(shuf -e 8 12 5 15 10 3 18 7 14 9 -n 1)
        latence=$(shuf -e 55 70 80 60 90 65 85 50 95 75 -n 1)
        score_qoe=$(shuf -e 50 58 45 55 62 42 65 48 60 52 -n 1)
        ;;
      "Intercel")
        rssi=$(shuf -e -88 -95 -100 -90 -85 -105 -82 -98 -110 -92 -n 1)
        debit=$(shuf -e 2 5 1 8 3 0 10 4 6 2 -n 1)
        latence=$(shuf -e 80 120 150 90 200 100 180 70 250 130 -n 1)
        score_qoe=$(shuf -e 30 42 25 38 48 20 50 28 45 35 -n 1)
        ;;
    esac

    local rsrp=$((rssi - 20))
    local debit_up=$(echo "$debit * 0.4" | bc -l | cut -c1-5)

    if [ $i -gt 1 ]; then mesures="${mesures},"; fi

    mesures="${mesures}{
      \"regionCode\": \"${region_code}\",
      \"latitude\": ${lat},
      \"longitude\": ${lng},
      \"timestamp\": \"${ts}\",
      \"typeMesure\": \"${type_mesure}\",
      \"rssi\": ${rssi},
      \"rsrp\": ${rsrp},
      \"rsrq\": -10,
      \"sinr\": 8,
      \"debitDescendant\": ${debit},
      \"debitMontant\": ${debit_up},
      \"latence\": ${latence},
      \"gigue\": 5,
      \"tauxAppelReussi\": 96,
      \"tauxDropCall\": 2,
      \"scoreQoE\": ${score_qoe},
      \"pageLoadTime\": 2.5,
      \"videoBuffering\": 0.8
    }"
  done
  mesures="${mesures}]"

  # Envoyer la requête
  local payload="{\"campagneNom\":\"Drive Test ${region_nom} ${periode}\",\"mesures\":${mesures}}"

  local response
  response=$(curl -sf --max-time 30 \
    -X POST "${BASE_URL}/api/prestataires/mesures" \
    -H "X-API-Key: ${api_key}" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1) || true

  if echo "$response" | grep -q "importées"; then
    local inserted=$(echo "$response" | grep -oP '"inserted":\K\d+')
    log_ok "${operator_name} → ${region_nom}: ${inserted} mesures importées"
  else
    log_warn "${operator_name} → ${region_nom}: ${response}"
  fi
}

# ─── Envoyer les scores pour un opérateur ───
send_scores() {
  local operator_name="$1"
  local api_key="$2"

  # Scores par trimestre (progression réaliste)
  local scores_json="["
  local periodes=("2025-Q1" "2025-Q2" "2025-Q3" "2025-Q4" "2026-Q1")

  case "$operator_name" in
    "Orange")
      local globals=(72 75 79 82 84)
      local couverture=(70 73 77 80 82)
      local qos=(74 78 82 85 86)
      local qoe=(73 77 81 84 85)
      local conformite=(71 74 79 82 83)
      ;;
    "MTN")
      local globals=(62 65 68 72 74)
      local couverture=(58 62 66 70 72)
      local qos=(65 69 73 76 78)
      local qoe=(63 67 71 74 76)
      local conformite=(61 65 68 71 73)
      ;;
    "Celcom")
      local globals=(42 45 48 55 57)
      local couverture=(38 42 45 50 52)
      local qos=(48 52 56 60 62)
      local qoe=(44 48 52 57 58)
      local conformite=(40 44 48 52 54)
      ;;
    "Intercel")
      local globals=(28 30 33 38 40)
      local couverture=(22 25 28 32 34)
      local qos=(35 38 42 46 48)
      local qoe=(32 35 38 41 43)
      local conformite=(27 30 33 37 39)
      ;;
  esac

  for i in $(seq 0 4); do
    if [ $i -gt 0 ]; then scores_json="${scores_json},"; fi
    scores_json="${scores_json}{
      \"periode\": \"${periodes[$i]}\",
      \"scoreGlobal\": ${globals[$i]},
      \"scoreCouverture\": ${couverture[$i]},
      \"scoreQoS\": ${qos[$i]},
      \"scoreQoE\": ${qoe[$i]},
      \"scoreConformite\": ${conformite[$i]}
    }"
  done
  scores_json="${scores_json}]"

  local payload="{\"scores\":${scores_json}}"

  local response
  response=$(curl -sf --max-time 30 \
    -X POST "${BASE_URL}/api/prestataires/scores" \
    -H "X-API-Key: ${api_key}" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1) || true

  if echo "$response" | grep -q "succès\|importé\|upserted"; then
    log_ok "${operator_name}: Scores importés (5 trimestres)"
  else
    log_warn "${operator_name}: ${response}"
  fi
}

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "🇬🇳  ARPT-QoS-Guinée — Import via API (Production)"
echo "═══════════════════════════════════════════════════════"
echo ""

check_server

FILTER="${1:-all}"
DO_MESURES=true
DO_SCORES=true

if [ "$FILTER" = "mesures" ]; then DO_SCORES=false; fi
if [ "$FILTER" = "scores" ]; then DO_MESURES=false; fi

# Régions avec coordonnées
declare -A REGIONS
REGIONS[CON]="9.5079,-13.7122,Conakry"
REGIONS[CYA]="10.0833,-13.3833,Coyah"
REGIONS[KIN]="10.0667,-12.8667,Kindia"
REGIONS[BKE]="10.9333,-14.3000,Boké"
REGIONS[KDR]="12.1833,-13.3000,Koundara"
REGIONS[LBE]="11.3167,-12.2833,Labé"
REGIONS[MLI]="12.0000,-11.7500,Mali"
REGIONS[DLB]="10.7000,-12.2500,Dalaba"
REGIONS[MMU]="10.5167,-12.0833,Mamou"
REGIONS[FRN]="10.0333,-10.7500,Faranah"
REGIONS[KKA]="10.3833,-9.3000,Kankan"
REGIONS[KDG]="9.2500,-9.0000,Kérouané"
REGIONS[SGR]="11.4167,-9.1667,Siguiri"
REGIONS[GKD]="8.5667,-10.1333,Guéckédou"
REGIONS[BLA]="8.6833,-8.6333,Beyla"
REGIONS[ZKR]="7.7500,-8.8167,Nzérékoré"

# Opérateurs à traiter
declare -A OPS
if [ "$FILTER" = "orange" ] || [ "$FILTER" = "all" ] || [ "$FILTER" = "mesures" ] || [ "$FILTER" = "scores" ]; then
  OPS[Orange]="$ORANGE_KEY"
fi
if [ "$FILTER" = "mtn" ] || [ "$FILTER" = "all" ] || [ "$FILTER" = "mesures" ] || [ "$FILTER" = "scores" ]; then
  OPS[MTN]="$MTN_KEY"
fi
if [ "$FILTER" = "celcom" ] || [ "$FILTER" = "all" ] || [ "$FILTER" = "mesures" ] || [ "$FILTER" = "scores" ]; then
  OPS[Celcom]="$CELCOM_KEY"
fi
if [ "$FILTER" = "intercel" ] || [ "$FILTER" = "all" ] || [ "$FILTER" = "mesures" ] || [ "$FILTER" = "scores" ]; then
  OPS[Intercel]="$INTERCEL_KEY"
fi

# ─── Envoyer les mesures ───
if [ "$DO_MESURES" = true ]; then
  echo ""
  log_info "📊 Envoi des mesures QoS par opérateur..."
  echo ""

  for op_name in "${!OPS[@]}"; do
    local_key="${OPS[$op_name]}"
    log_info "📡 ${op_name} — Envoi des mesures..."

    for region_code in "${!REGIONS[@]}"; do
      IFS=',' read -r lat lng region_nom <<< "${REGIONS[$region_code]}"

      # Nombre de mesures selon type de zone
      local count=10
      case "$region_code" in
        CON) count=25 ;;
        CYA|KIN|LBE|MMU|KKA|ZKR) count=15 ;;
        *) count=8 ;;
      esac

      # Alterner mobile/internet
      local type_mesure="MOBILE"
      if [ $((RANDOM % 2)) -eq 0 ]; then type_mesure="INTERNET"; fi

      send_mesures "$op_name" "$local_key" "$region_code" "$region_nom" "$count" "2026-Q1" "$lat" "$lng" "$type_mesure"
    done
    echo ""
  done
fi

# ─── Envoyer les scores ───
if [ "$DO_SCORES" = true ]; then
  echo ""
  log_info "🏆 Envoi des scores opérateurs..."
  echo ""

  for op_name in "${!OPS[@]}"; do
    local_key="${OPS[$op_name]}"
    send_scores "$op_name" "$local_key"
  done
fi

echo ""
echo "═══════════════════════════════════════════════════════"
log_ok "Import terminé avec succès !"
echo "═══════════════════════════════════════════════════════"

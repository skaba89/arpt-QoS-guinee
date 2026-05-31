#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# ARPT-QoS-Guinée — Script d'import manuel des données opérateurs
# ═══════════════════════════════════════════════════════════════════
#
# Usage:
#   ./import-donnees.sh                    # Importer tout (4 opérateurs × 4 trimestres)
#   ./import-donnees.sh --orange           # Importer Orange uniquement
#   ./import-donnees.sh --mtn              # Importer MTN uniquement
#   ./import-donnees.sh --celcom           # Importer Celcom uniquement
#   ./import-donnees.sh --intercel         # Importer Intercel uniquement
#   ./import-donnees.sh --mesures          # Importer mesures uniquement
#   ./import-donnees.sh --scores           # Importer scores uniquement
#   ./import-donnees.sh --q1               # Importer Q1 uniquement
#   ./import-donnees.sh --orange --q1      # Importer Orange Q1 uniquement
#
# ═══════════════════════════════════════════════════════════════════

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

declare -A API_KEYS=(
    ["ORANGE"]="onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ"
    ["MTN"]="onit-MTN-f3Hb7nKcP5dAqW1xY8uE"
    ["CELCOM"]="onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH"
    ["INTERCEL"]="onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ"
)

FILTER_OP=""
FILTER_DATA=""
FILTER_Q=""

for arg in "$@"; do
    case $arg in
        --orange)   FILTER_OP="orange" ;;
        --mtn)      FILTER_OP="mtn" ;;
        --celcom)   FILTER_OP="celcom" ;;
        --intercel) FILTER_OP="intercel" ;;
        --mesures)  FILTER_DATA="mesures" ;;
        --scores)   FILTER_DATA="scores" ;;
        --q1)       FILTER_Q="Q1" ;;
        --q2)       FILTER_Q="Q2" ;;
        --q3)       FILTER_Q="Q3" ;;
        --q4)       FILTER_Q="Q4" ;;
    esac
done

echo "═══════════════════════════════════════════════════════════════"
echo "  ARPT-QoS-Guinée — Import manuel des données opérateurs"
echo "  Serveur: $BASE_URL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200"; then
    echo -e "${RED}❌ Serveur non accessible sur $BASE_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Serveur accessible${NC}"
echo ""

total_ok=0
total_err=0
total_inserted=0

import_mesures() {
    local csv_file="$1"
    local api_key="$2"
    local op_code="$3"
    local quarter="$4"
    
    # Convertir CSV en JSON pour l'API (avec campagneNom par mesure)
    local result=$(python3 -c "
import csv, json, sys
rows = []
with open('$csv_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mesure = {
            'regionCode': row.get('region', ''),
            'campagneNom': row.get('campagne', ''),
            'latitude': float(row.get('latitude', 0)),
            'longitude': float(row.get('longitude', 0)),
            'timestamp': row.get('timestamp', ''),
            'typeMesure': row.get('typeMesure', 'MOBILE'),
        }
        for field in ['rssi', 'rsrp', 'rsrq', 'sinr', 'debitDescendant', 'debitMontant', 'latence', 'gigue', 'tauxAppelReussi', 'tauxDropCall', 'debitDownload', 'debitUpload', 'ping', 'dnsLookupTime', 'tcpConnectTime', 'scoreQoE', 'pageLoadTime', 'videoBuffering']:
            val = row.get(field, '')
            if val and val.strip():
                try:
                    mesure[field] = float(val)
                except:
                    pass
        rows.append(mesure)

batch_size = 500
num_batches = (len(rows) + batch_size - 1) // batch_size
for i in range(num_batches):
    batch = rows[i*batch_size:(i+1)*batch_size]
    batch_file = '/tmp/import_batch_${op_code}_${quarter}_' + str(i) + '.json'
    with open(batch_file, 'w') as f:
        json.dump({'mesures': batch}, f, ensure_ascii=False)
print(f'{len(rows)}|{num_batches}')
" 2>&1)
    
    local count=$(echo "$result" | cut -d'|' -f1)
    local num_batches=$(echo "$result" | cut -d'|' -f2)
    
    for i in $(seq 0 $((num_batches - 1))); do
        local batch_file="/tmp/import_batch_${op_code}_${quarter}_${i}.json"
        if [ -f "$batch_file" ]; then
            local response=$(curl -s -X POST "$BASE_URL/api/prestataires/mesures" \
                -H "X-API-Key: $api_key" \
                -H "Content-Type: application/json" \
                -d @"$batch_file" 2>/dev/null)
            
            local inserted=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('inserted',0))" 2>/dev/null || echo "0")
            local http_ok=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print('ok' if d.get('inserted',0) > 0 else 'err')" 2>/dev/null || echo "err")
            
            if [ "$http_ok" = "ok" ]; then
                echo -e "  ${GREEN}✅${NC} Mesures $op_code $quarter: $inserted enregistrements importés"
                ((total_ok++))
                total_inserted=$((total_inserted + inserted))
            else
                local err_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error','') or d.get('message','') or json.dumps(d.get('errors',[]))[:100])" 2>/dev/null || echo "HTTP error")
                echo -e "  ${RED}❌${NC} Mesures $op_code $quarter: $err_msg"
                ((total_err++))
            fi
            rm -f "$batch_file"
            sleep 2  # Rate limiting: 30 req/min → 2s entre les appels
        fi
    done
}

import_scores() {
    local json_file="$1"
    local api_key="$2"
    local op_code="$3"
    local quarter="$4"
    
    local api_json=$(python3 -c "
import json
with open('$json_file', 'r') as f:
    data = json.load(f)
api_data = {'scores': [{
    'periode': data['periode'],
    'scoreGlobal': data['scoreGlobal'],
    'scoreCouverture': data['scoreCouverture'],
    'scoreQoS': data['scoreQoS'],
    'scoreQoE': data['scoreQoE'],
    'scoreConformite': data['scoreConformite'],
    'recommandation': data.get('recommandation', ''),
}]}
print(json.dumps(api_data, ensure_ascii=False))
" 2>/dev/null)
    
    local response=$(curl -s -X POST "$BASE_URL/api/prestataires/scores" \
        -H "X-API-Key: $api_key" \
        -H "Content-Type: application/json" \
        -d "$api_json" 2>/dev/null)
    
    local http_ok=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print('ok' if d.get('inserted',0) > 0 or d.get('created',0) > 0 or 'succès' in d.get('message','') else 'err')" 2>/dev/null || echo "err")
    
    if [ "$http_ok" = "ok" ]; then
        echo -e "  ${GREEN}✅${NC} Scores $op_code $quarter: importé"
        ((total_ok++))
    else
        local err_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error','') or d.get('message','') or str(d)[:100])" 2>/dev/null || echo "HTTP error")
        echo -e "  ${RED}❌${NC} Scores $op_code $quarter: $err_msg"
        ((total_err++))
    fi
    sleep 1
}

# ─── BOUCLE D'IMPORT ───

for op_code in ORANGE MTN CELCOM INTERCEL; do
    op_lower=$(echo "$op_code" | tr '[:upper:]' '[:lower:]')
    
    if [ -n "$FILTER_OP" ] && [ "$FILTER_OP" != "$op_lower" ]; then
        continue
    fi
    
    api_key="${API_KEYS[$op_code]}"
    
    echo -e "${YELLOW}📡 $op_code${NC}"
    
    for quarter in Q1 Q2 Q3 Q4; do
        if [ -n "$FILTER_Q" ] && [ "$FILTER_Q" != "$quarter" ]; then
            continue
        fi
        
        if [ -z "$FILTER_DATA" ] || [ "$FILTER_DATA" = "mesures" ]; then
            csv_file="$SCRIPT_DIR/mesures-${op_lower}-2025-${quarter}.csv"
            if [ -f "$csv_file" ]; then
                import_mesures "$csv_file" "$api_key" "$op_code" "$quarter"
            fi
        fi
        
        if [ -z "$FILTER_DATA" ] || [ "$FILTER_DATA" = "scores" ]; then
            scores_file="$SCRIPT_DIR/scores-${op_lower}-2025-${quarter}.json"
            if [ -f "$scores_file" ]; then
                import_scores "$scores_file" "$api_key" "$op_code" "$quarter"
            fi
        fi
    done
    echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ Succès: $total_ok${NC}  ${RED}❌ Erreurs: $total_err${NC}"
echo -e "  📊 Total mesures importées: $total_inserted"
echo "═══════════════════════════════════════════════════════════════"

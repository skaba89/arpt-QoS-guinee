#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# ARPT-QoS-Guinée — Script d'import des données trimestrielles
# Permet d'importer les fichiers via l'API REST
# ═══════════════════════════════════════════════════════════════════
#
# Usage:
#   ./import-api.sh                    # Import complet (Q1-Q4)
#   ./import-api.sh --q1               # Import Q1 uniquement
#   ./import-api.sh --q2               # Import Q2 uniquement
#   ./import-api.sh --q3               # Import Q3 uniquement
#   ./import-api.sh --q4               # Import Q4 uniquement
#   ./import-api.sh --mesures           # Mesures uniquement (tous trimestres)
#   ./import-api.sh --scores            # Scores uniquement
#   ./import-api.sh --alertes           # Alertes uniquement
#   ./import-api.sh --orange            # ORANGE uniquement
#   ./import-api.sh --mtn               # MTN uniquement
#   ./import-api.sh --celcom            # CELCOM uniquement
#   ./import-api.sh --intercel          # INTERCEL uniquement
# ═══════════════════════════════════════════════════════════════════

BASE_URL="${BASE_URL:-http://localhost:3000}"
DATA_DIR="$(dirname "$0")"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Parsing des arguments ────────────────────────────────────────
IMPORT_Q1=true
IMPORT_Q2=true
IMPORT_Q3=true
IMPORT_Q4=true
IMPORT_MESURES=true
IMPORT_SCORES=true
IMPORT_ALERTES=true
FILTER_OPERATOR=""

for arg in "$@"; do
    case $arg in
        --q1) IMPORT_Q2=false; IMPORT_Q3=false; IMPORT_Q4=false ;;
        --q2) IMPORT_Q1=false; IMPORT_Q3=false; IMPORT_Q4=false ;;
        --q3) IMPORT_Q1=false; IMPORT_Q2=false; IMPORT_Q4=false ;;
        --q4) IMPORT_Q1=false; IMPORT_Q2=false; IMPORT_Q3=false ;;
        --mesures) IMPORT_SCORES=false; IMPORT_ALERTES=false ;;
        --scores) IMPORT_MESURES=false; IMPORT_ALERTES=false ;;
        --alertes) IMPORT_MESURES=false; IMPORT_SCORES=false ;;
        --orange) FILTER_OPERATOR="ORANGE" ;;
        --mtn) FILTER_OPERATOR="MTN" ;;
        --celcom) FILTER_OPERATOR="CELCOM" ;;
        --intercel) FILTER_OPERATOR="INTERCEL" ;;
    esac
done

# ─── Vérification du serveur ──────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ARPT-QoS-Guinée — Import des données trimestrielles${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if ! curl -s "${BASE_URL}/api/health" | grep -q "ok"; then
    echo -e "${RED}❌ Serveur non accessible sur ${BASE_URL}${NC}"
    echo "   Démarrez le serveur avec: cd /home/z/my-project && npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Serveur accessible sur ${BASE_URL}${NC}"

# ─── Authentification ─────────────────────────────────────────────
echo -e "\n${YELLOW}🔐 Authentification ARPT...${NC}"

# Obtenir le CSRF token
CSRF_RESPONSE=$(curl -s -c /tmp/arpt-cookies.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null)

if [ -z "$CSRF_TOKEN" ]; then
    echo -e "${RED}❌ Impossible d'obtenir le token CSRF${NC}"
    exit 1
fi

# Connexion
LOGIN_RESPONSE=$(curl -s -b /tmp/arpt-cookies.txt -c /tmp/arpt-cookies.txt \
    -X POST "${BASE_URL}/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=admin@arpt.gn&password=Admin%402026!&csrfToken=${CSRF_TOKEN}&callbackUrl=${BASE_URL}/&json=true" \
    -w "\n%{http_code}" \
    -o /tmp/arpt-login-body.txt \
    -D /tmp/arpt-login-headers.txt)

# Vérifier la session
SESSION=$(curl -s -b /tmp/arpt-cookies.txt "${BASE_URL}/api/auth/session")
USER_NAME=$(echo "$SESSION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('name',''))" 2>/dev/null)
USER_ROLE=$(echo "$SESSION" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('role',''))" 2>/dev/null)

if [ -z "$USER_NAME" ]; then
    echo -e "${RED}❌ Échec de l'authentification${NC}"
    echo "   Vérifiez les identifiants: admin@arpt.gn / Admin@2026!"
    exit 1
fi

echo -e "${GREEN}✅ Connecté: ${USER_NAME} (${USER_ROLE})${NC}"

# ─── Import des mesures (CSV) ─────────────────────────────────────
import_mesures() {
    local quarter=$1
    local operator=$2
    local file="${DATA_DIR}/${quarter}/${operator}/drive-test-${quarter}.csv"
    local file2="${DATA_DIR}/${quarter}/${operator}/qos-internet-${quarter}.csv"

    if [ ! -f "$file" ]; then
        echo -e "${RED}   ❌ Fichier non trouvé: ${file}${NC}"
        return 1
    fi

    echo -e "${YELLOW}   📡 ${operator} — Drive Test...${NC}"
    RESULT=$(curl -s -b /tmp/arpt-cookies.txt \
        -X POST "${BASE_URL}/api/import" \
        -F "file=@${file}" \
        -F "format=csv")

    IMPORTED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('imported','?'))" 2>/dev/null)
    ERRORS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errors','?'))" 2>/dev/null)
    echo -e "${GREEN}   ✅ Drive Test: ${IMPORTED} importées, ${ERRORS} erreurs${NC}"

    if [ -f "$file2" ]; then
        echo -e "${YELLOW}   📡 ${operator} — QoS Internet...${NC}"
        RESULT=$(curl -s -b /tmp/arpt-cookies.txt \
            -X POST "${BASE_URL}/api/import" \
            -F "file=@${file2}" \
            -F "format=csv")

        IMPORTED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('imported','?'))" 2>/dev/null)
        ERRORS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errors','?'))" 2>/dev/null)
        echo -e "${GREEN}   ✅ QoS Internet: ${IMPORTED} importées, ${ERRORS} erreurs${NC}"
    fi
}

# ─── Import des scores (JSON) ─────────────────────────────────────
import_scores() {
    local quarter=$1
    local file="${DATA_DIR}/${quarter}/scores-operateurs-${quarter}.json"

    if [ ! -f "$file" ]; then
        echo -e "${RED}   ❌ Fichier non trouvé: ${file}${NC}"
        return 1
    fi

    echo -e "${YELLOW}   🏆 Import des scores...${NC}"
    RESULT=$(curl -s -b /tmp/arpt-cookies.txt \
        -X POST "${BASE_URL}/api/import-scoring" \
        -H "Content-Type: application/json" \
        -d @"${file}")

    IMPORTED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('imported','?'))" 2>/dev/null)
    ERRORS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errors','?'))" 2>/dev/null)
    echo -e "${GREEN}   ✅ Scores: ${IMPORTED} importés, ${ERRORS} erreurs${NC}"
}

# ─── Import des alertes (JSON) ────────────────────────────────────
import_alertes() {
    local quarter=$1
    local file="${DATA_DIR}/${quarter}/alertes-${quarter}.json"

    if [ ! -f "$file" ]; then
        echo -e "${RED}   ❌ Fichier non trouvé: ${file}${NC}"
        return 1
    fi

    echo -e "${YELLOW}   🚨 Import des alertes...${NC}"

    # Les alertes doivent être importées une par une via POST /api/alerts
    TOTAL=$(python3 -c "import json; d=json.load(open('${file}')); print(len(d))" 2>/dev/null)
    SUCCESS=0
    FAIL=0

    python3 -c "
import json, sys
alerts = json.load(open('${file}'))
for a in alerts:
    print(json.dumps(a))
" | while IFS= read -r alert_json; do
        RESULT=$(curl -s -b /tmp/arpt-cookies.txt \
            -X POST "${BASE_URL}/api/alerts" \
            -H "Content-Type: application/json" \
            -d "$alert_json")

        if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('alert') else 1)" 2>/dev/null; then
            SUCCESS=$((SUCCESS + 1))
        else
            FAIL=$((FAIL + 1))
        fi
    done

    echo -e "${GREEN}   ✅ Alertes: ${TOTAL} traitées${NC}"
}

# ─── Exécution de l'import ────────────────────────────────────────
OPERATORS=("ORANGE" "MTN" "CELCOM" "INTERCEL")
QUARTERS=()

if [ "$IMPORT_Q1" = true ]; then QUARTERS+=("Q1-2025"); fi
if [ "$IMPORT_Q2" = true ]; then QUARTERS+=("Q2-2025"); fi
if [ "$IMPORT_Q3" = true ]; then QUARTERS+=("Q3-2025"); fi
if [ "$IMPORT_Q4" = true ]; then QUARTERS+=("Q4-2025"); fi

if [ -n "$FILTER_OPERATOR" ]; then
    OPERATORS=("$FILTER_OPERATOR")
fi

TOTAL_IMPORTED=0

for Q in "${QUARTERS[@]}"; do
    echo -e "\n${BLUE}═══ ${Q} ═══${NC}"

    if [ "$IMPORT_MESURES" = true ]; then
        for OP in "${OPERATORS[@]}"; do
            import_mesures "$Q" "$OP"
            sleep 2  # Respecter le rate limiting
        done
    fi

    if [ "$IMPORT_SCORES" = true ]; then
        import_scores "$Q"
        sleep 2
    fi

    if [ "$IMPORT_ALERTES" = true ]; then
        import_alertes "$Q"
        sleep 2
    fi
done

# ─── Nettoyage ─────────────────────────────────────────────────────
rm -f /tmp/arpt-cookies.txt /tmp/arpt-login-body.txt /tmp/arpt-login-headers.txt

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Import terminé !${NC}"
echo -e "${GREEN}  🌐 Consultez: ${BASE_URL}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

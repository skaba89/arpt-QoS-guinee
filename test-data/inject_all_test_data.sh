#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Script d'injection complète des données de test
# Injecte les données pour les 4 opérateurs sur 4 périodes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

BASE_URL="${1:-http://localhost:3000}"

echo "🚀 Injection des données de test sur $BASE_URL"
echo ""

# ─── Phase 1: Scores opérateurs ───
echo "📊 Phase 1: Injection des scores opérateurs..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  SCORES_FILE="test-data/scores_${op}.json"
  if [ -f "$SCORES_FILE" ]; then
    # Send each score individually
    cat "$SCORES_FILE" | jq -c '.[]' | while read -r score; do
      RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$score" \
        "$BASE_URL/api/prestataire")
      echo "  Score: $(echo $RESULT | jq -r '.score.periode // .error' 2>/dev/null)"
    done
  fi
done
echo ""

# ─── Phase 2: Mesures QoS ───
echo "📡 Phase 2: Injection des mesures QoS..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  for periode in 2025_Q2 2025_Q3 2025_Q4 2026_Q1; do
    MES_FILE="test-data/mesures_${op}_${periode}.json"
    if [ -f "$MES_FILE" ]; then
      # Wrap in action + mesures format for the API
      WRAPPED=$(jq '{action: "mesures", campagne: .campagne, mesures: .mesures}' "$MES_FILE")
      RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$WRAPPED" \
        "$BASE_URL/api/prestataire")
      INSERTED=$(echo $RESULT | jq -r '.inserted // 0' 2>/dev/null)
      echo "  ${op} ${periode}: ${INSERTED} mesures insérées"
    fi
  done
done
echo ""

# ─── Phase 3: Alertes ───
echo "🚨 Phase 3: Injection des alertes..."
if [ -f "test-data/alertes_test.json" ]; then
  cat "test-data/alertes_test.json" | jq -c '.[]' | while read -r alert; do
    OP_CODE=$(echo $alert | jq -r '.operateurCode' 2>/dev/null)
    API_KEY=""
    case $OP_CODE in
      ORANGE)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
      MTN)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
      CELCOM)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
      GUINETEL) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
      *)        API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    esac
    
    RESULT=$(curl -s -X POST -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$alert" \
      "$BASE_URL/api/prestataire")
    echo "  Alerte: $(echo $RESULT | jq -r '.alerte.type // .error' 2>/dev/null)"
  done
fi
echo ""

# ─── Phase 4: Vérification ───
echo "✅ Phase 4: Vérification du statut..."
for op in orange mtn celcom guinetel; do
  API_KEY=""
  case $op in
    orange)   API_KEY="prest-orange-2026-ak1a2b3c4d" ;;
    mtn)      API_KEY="prest-mtn-2026-x9y8z7w6v5" ;;
    celcom)   API_KEY="prest-celcom-2026-p1q2r3s4t5" ;;
    guinetel) API_KEY="prest-guinetel-2026-m6n7o8p9q0" ;;
  esac
  
  STATUS=$(curl -s -H "X-API-Key: $API_KEY" "$BASE_URL/api/prestataire")
  echo "  ${op}: $(echo $STATUS | jq -c '{mesures: .stats.mesures, campagnes: .stats.campagnes, scores: .stats.scores}' 2>/dev/null)"
done

echo ""
echo "🎉 Injection terminée ! Accédez à $BASE_URL pour voir les données."

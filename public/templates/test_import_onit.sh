#!/bin/bash
# ============================================================
# ONIT-PNG - Scripts de test d'import des données
# Plateforme: https://onit.arpt.gn
# Date: Mai 2026
# ============================================================
#
# UTILISATION:
#   1. Connectez-vous d'abord pour obtenir un token:
#      bash test_import_onit.sh login
#
#   2. Testez chaque source de données:
#      bash test_import_onit.sh drive-test
#      bash test_import_onit.sh qos-internet
#      bash test_import_onit.sh signalement
#      bash test_import_onit.sh scoring
#      bash test_import_onit.sh alerte
#
#   3. Ou testez tout d'un coup:
#      bash test_import_onit.sh all
# ============================================================

BASE_URL="http://localhost:3000"
EMAIL="admin@arpt.gn"
PASSWORD="Admin@2026!"
COOKIE_FILE="/tmp/onit_cookies.txt"

# --- LOGIN ---
login() {
  echo "🔐 Connexion à ONIT-PNG..."
  
  # Récupérer le token CSRF
  CSRF=$(curl -s "$BASE_URL/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
  
  if [ -z "$CSRF" ]; then
    echo "❌ Impossible d'obtenir le token CSRF"
    exit 1
  fi
  echo "   CSRF token: ${CSRF:0:20}..."
  
  # Se connecter
  curl -s -c "$COOKIE_FILE" -b "$COOKIE_FILE" \
    "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"csrfToken\":\"$CSRF\",\"json\":true}" \
    -o /dev/null -w "   Login: HTTP %{http_code}\n"
  
  # Vérifier la session
  SESSION=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/session")
  echo "   Session: $(echo $SESSION | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('name','Aucune session'))" 2>/dev/null)"
}

# --- TEST DRIVE TEST CSV ---
test_drive_test() {
  echo ""
  echo "📱 Test 1: Import Drive Test (CSV)"
  echo "   Fichier: exemple_drive_test_complet.csv"
  
  RESULT=$(curl -s -b "$COOKIE_FILE" \
    "$BASE_URL/api/import" \
    -F "file=@public/templates/exemple_drive_test_complet.csv" \
    -F "format=csv")
  
  echo "   Résultat: $RESULT" | head -c 200
  echo ""
}

# --- TEST QOS INTERNET CSV ---
test_qos_internet() {
  echo ""
  echo "📶 Test 2: Import QoS Internet (CSV)"
  echo "   Fichier: exemple_qos_internet_complet.csv"
  
  RESULT=$(curl -s -b "$COOKIE_FILE" \
    "$BASE_URL/api/import" \
    -F "file=@public/templates/exemple_qos_internet_complet.csv" \
    -F "format=csv")
  
  echo "   Résultat: $RESULT" | head -c 200
  echo ""
}

# --- TEST SIGNALEMENT CITOYEN JSON ---
test_signalement() {
  echo ""
  echo "🌍 Test 3: Import Signalement Citoyen (JSON)"
  echo "   Fichier: exemple_signalement_citoyen_complet.json"
  
  RESULT=$(curl -s -b "$COOKIE_FILE" \
    "$BASE_URL/api/import" \
    -F "file=@public/templates/exemple_signalement_citoyen_complet.json" \
    -F "format=json")
  
  echo "   Résultat: $RESULT" | head -c 200
  echo ""
}

# --- TEST SCORING JSON ---
test_scoring() {
  echo ""
  echo "📊 Test 4: Import Scores Opérateurs (JSON)"
  echo "   Fichier: exemple_scoring_operateur_complet.json"
  
  RESULT=$(curl -s -b "$COOKIE_FILE" \
    "$BASE_URL/api/import-scoring" \
    -F "file=@public/templates/exemple_scoring_operateur_complet.json")
  
  echo "   Résultat: $RESULT" | head -c 200
  echo ""
}

# --- TEST ALERTE ---
test_alerte() {
  echo ""
  echo "🚨 Test 5: Création d'alerte (API)"
  
  RESULT=$(curl -s -b "$COOKIE_FILE" \
    "$BASE_URL/api/alerts" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "DEGRADATION",
      "severity": "CRITIQUE",
      "message": "RSRP inférieur à -110 dBm sur 40% des mesures à Conakry - Zone Kaloum",
      "details": "Seuil critique dépassé: RSRP moyen = -115 dBm. Zone affectée: Kaloum, Dixinn."
    }')
  
  echo "   Résultat: $RESULT" | head -c 200
  echo ""
}

# --- MAIN ---
case "${1:-all}" in
  login)     login ;;
  drive-test) login; test_drive_test ;;
  qos-internet) login; test_qos_internet ;;
  signalement) login; test_signalement ;;
  scoring)   login; test_scoring ;;
  alerte)    login; test_alerte ;;
  all)
    login
    test_drive_test
    test_qos_internet
    test_signalement
    test_scoring
    test_alerte
    echo ""
    echo "✅ Tous les tests d'import terminés !"
    ;;
  *)
    echo "Usage: $0 {login|drive-test|qos-internet|signalement|scoring|alerte|all}"
    ;;
esac

#!/bin/bash
# ═══════════════════════════════════════════════════════════
# ONIT-PNG — Script de Test des Endpoints API
# Exécution : chmod +x tests/api/test_api_endpoints.sh && ./tests/api/test_api_endpoints.sh
# ═══════════════════════════════════════════════════════════

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "═══════════════════════════════════════════════"
echo "  ONIT-PNG — Tests API Automatisés"
echo "  Serveur: $BASE_URL"
echo "═══════════════════════════════════════════════"
echo ""

# Function to test an endpoint
test_endpoint() {
  local method=$1
  local url=$2
  local expected=$3
  local description=$4

  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" --max-time 10 2>/dev/null)

  if [ "$status" = "$expected" ]; then
    echo "✅ PASS: $description (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $description (Attendu: $expected, Reçu: $status)"
    FAIL=$((FAIL + 1))
  fi
}

echo "── 1. Pages & Authentification ──"
test_endpoint "GET" "/" "200" "Page d'accueil"
test_endpoint "GET" "/api/auth/session" "200" "Session (vide)"
test_endpoint "GET" "/api/auth/csrf" "200" "CSRF Token"
test_endpoint "GET" "/api/auth/providers" "200" "Providers"

echo ""
echo "── 2. API Publiques (sans authentification) ──"
test_endpoint "GET" "/api/dashboard" "200" "Dashboard KPIs"
test_endpoint "GET" "/api/map" "200" "Carte SIG"
test_endpoint "GET" "/api/scoring" "200" "Scoring Opérateurs"
test_endpoint "GET" "/api/reports" "200" "Rapports publics"

echo ""
echo "── 3. API Protégées (sans auth → 401) ──"
test_endpoint "GET" "/api/qos" "401" "QoS (non authentifié)"
test_endpoint "GET" "/api/campaigns" "401" "Campagnes (non authentifié)"
test_endpoint "GET" "/api/users" "401" "Utilisateurs (non authentifié)"
test_endpoint "GET" "/api/audit-logs" "401" "Audit Logs (non authentifié)"
test_endpoint "GET" "/api/alerts" "401" "Alertes (non authentifié)"

echo ""
echo "── 4. Test de Connexion ──"
# Get CSRF token
CSRF=$(curl -s "$BASE_URL/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)

if [ -n "$CSRF" ]; then
  # Attempt login
  LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=admin@arpt.gn&password=Admin@2026!&csrfToken=$CSRF" \
    --max-time 15 2>/dev/null)

  if [ "$LOGIN_STATUS" = "302" ]; then
    echo "✅ PASS: Connexion admin@arpt.gn (HTTP 302 redirect)"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: Connexion admin@arpt.gn (Attendu: 302, Reçu: $LOGIN_STATUS)"
    FAIL=$((FAIL + 1))
  fi
else
  echo "❌ FAIL: Impossible d'obtenir le CSRF token"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  RÉSULTATS: $PASS réussi(s) / $FAIL échoué(s)"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ TOUS LES TESTS SONT PASSÉS"
else
  echo "  ❌ $FAIL TEST(S) EN ÉCHEC"
fi
echo "═══════════════════════════════════════════════"

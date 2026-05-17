#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ONIT-PNG — Commandes curl de test pour l'API Prestataire
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE_URL="http://localhost:3000"

echo "━━━ 1. Vérifier le statut de l'API ━━━"
curl -s -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 2. Envoyer une mesure unique (Orange) ━━━"
curl -s -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mesures",
    "mesure": {
      "latitude": 9.5092,
      "longitude": -13.7122,
      "timestamp": "2026-05-15T10:30:00Z",
      "typeMesure": "MOBILE",
      "regionCode": "CON",
      "rssi": -72,
      "rsrp": -88,
      "rsrq": -9,
      "sinr": 14,
      "latence": 40,
      "debitDescendant": 21,
      "debitMontant": 10,
      "gigue": 7,
      "tauxAppelReussi": 95,
      "tauxDropCall": 5,
      "debitDownload": 23,
      "debitUpload": 11,
      "ping": 38,
      "dnsLookupTime": 18,
      "tcpConnectTime": 28,
      "scoreQoE": 78,
      "pageLoadTime": 2.8,
      "videoBuffering": 0.6
    }
  }' \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 3. Envoyer un batch de mesures (MTN) ━━━"
curl -s -X POST -H "X-API-Key: prest-mtn-2026-x9y8z7w6v5" \
  -H "Content-Type: application/json" \
  -d @test-data/mesures_mtn_2026_Q1.json \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 4. Envoyer un score opérateur (Celcom) ━━━"
curl -s -X POST -H "X-API-Key: prest-celcom-2026-p1q2r3s4t5" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scores",
    "periode": "2026-Q1",
    "scoreGlobal": 65,
    "scoreCouverture": 58,
    "scoreQoS": 62,
    "scoreQoE": 64,
    "scoreConformite": 70,
    "recommandation": "Améliorer la couverture en zone rurale"
  }' \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 5. Signaler une alerte (Guinée Telecom) ━━━"
curl -s -X POST -H "X-API-Key: prest-guinetel-2026-m6n7o8p9q0" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "alertes",
    "type": "DEGRADATION",
    "severity": "CRITIQUE",
    "regionCode": "FAR",
    "message": "Couverture dégradée dans la région de Faranah - RSSI < -100 dBm sur 40% des sites",
    "details": "{\"rssi_moyen\": -102, \"sites_affectes\": 12}"
  }' \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 6. Importer un fichier CSV (Orange) ━━━"
curl -s -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \
  -H "Content-Type: text/csv" \
  --data-binary @test-data/mesures_orange_csv_2026_Q1.csv \
  "$BASE_URL/api/prestataire" | jq .

echo ""
echo "━━━ 7. Connexion admin pour tester l'API interne ━━━"
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@arpt.gn&password=Admin@2026!" \
  -c - | grep -oP 'next-auth.session-token=\K[^;]+' | head -1)

echo "Token: $TOKEN"

echo ""
echo "━━━ 8. Lister les campagnes (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \
  "$BASE_URL/api/campaigns" | jq .

echo ""
echo "━━━ 9. Lister les mesures (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \
  "$BASE_URL/api/mesures?limit=10" | jq .

echo ""
echo "━━━ 10. Lister les scores (API interne) ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \
  "$BASE_URL/api/scores" | jq .

echo ""
echo "━━━ 11. Dashboard KPIs ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \
  "$BASE_URL/api/dashboard" | jq .

echo ""
echo "━━━ 12. Données carte SIG ━━━"
curl -s -b "next-auth.session-token=$TOKEN" \
  "$BASE_URL/api/map" | jq .

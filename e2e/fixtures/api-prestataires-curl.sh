# ============================================================================
# API ONIT-PNG — Guide d'Intégration Prestataires
# ============================================================================
# Ce fichier documente tous les endpoints API disponibles pour les
# prestataires et opérateurs qui remontent des données vers ONIT-PNG.
# Chaque endpoint est accompagné d'exemples curl prêts à l'emploi.
# ============================================================================

# ============================================================================
# CONFIGURATION
# ============================================================================
# Base URL : http://VOTRE-SERVEUR:3000
# Authentification : NextAuth Credentials (JWT)
# Content-Type : application/json (défaut) ou text/csv (import CSV)
# ============================================================================

BASE_URL="http://localhost:3000"

# ============================================================================
# 1. AUTHENTIFICATION — Obtenir une session
# ============================================================================
# Les prestataires doivent d'abord s'authentifier pour obtenir un cookie
# de session JWT. Ce cookie doit être inclus dans toutes les requêtes suivantes.
# ============================================================================

# --- Connexion Super Admin ---
curl -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@arpt.gn&password=Admin@2026!&callbackUrl=http://localhost:3000&json=true" \
  -c cookies.txt \
  -L -s -o /dev/null -w "%{http_code}"

# --- Connexion Compte Opérateur Orange (lecture seule) ---
curl -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=tech@orange.gn&password=Admin@2026!&callbackUrl=http://localhost:3000&json=true" \
  -c cookies-orange.txt \
  -L -s -o /dev/null -w "%{http_code}"

# --- Vérifier la session ---
curl -X GET "${BASE_URL}/api/auth/session" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Santé de l'API ---
curl -X GET "${BASE_URL}/api" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 2. ENVOI DE MESURES QoS — Endpoint principal prestataires
# ============================================================================
# C'est l'endpoint le plus utilisé par les prestataires pour remonter
# les données de qualité de service collectées sur le terrain.
# ============================================================================

# --- 2a. Envoi d'une mesure unique (POST) ---
curl -X POST "${BASE_URL}/api/mesures" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "campagneId": "REMPLACER_PAR_CAMPAGNE_ID",
    "operatorCode": "ORG",
    "regionCode": "CKY",
    "latitude": 9.5092,
    "longitude": -13.7122,
    "timestamp": "2026-05-18T08:30:00Z",
    "typeMesure": "MOBILE",
    "rssi": -65,
    "rsrp": -82,
    "rsrq": -6,
    "sinr": 20,
    "latence": 25,
    "debitDescendant": 38,
    "debitMontant": 14,
    "gigue": 2,
    "tauxAppelReussi": 99.8,
    "tauxDropCall": 0.1,
    "debitDownload": 35,
    "debitUpload": 12,
    "ping": 22,
    "dnsLookupTime": 8,
    "tcpConnectTime": 18,
    "scoreQoE": 95,
    "pageLoadTime": 600,
    "videoBuffering": 0.05
  }' | python3 -m json.tool

# --- 2b. Import JSON en masse (PUT) — Recommandé pour les gros volumes ---
curl -X PUT "${BASE_URL}/api/mesures" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d @e2e/fixtures/production-mesures-import.json \
  | python3 -m json.tool

# --- 2c. Import CSV en masse (PUT) ---
# Note: Le campagneId est passé en query parameter pour le CSV
curl -X PUT "${BASE_URL}/api/mesures?campagneId=REMPLACER_PAR_CAMPAGNE_ID" \
  -b cookies.txt \
  -H "Content-Type: text/csv" \
  --data-binary @e2e/fixtures/production-drive-test-conakry-q2-2026.csv \
  | python3 -m json.tool

# --- 2d. Consulter les mesures existantes (GET) ---
curl -X GET "${BASE_URL}/api/mesures?limit=10&offset=0" \
  -b cookies.txt \
  -s | python3 -m json.tool

# Filtrer par opérateur
curl -X GET "${BASE_URL}/api/mesures?operateur=ORG&limit=50" \
  -b cookies.txt \
  -s | python3 -m json.tool

# Filtrer par région
curl -X GET "${BASE_URL}/api/mesures?region=CKY&limit=50" \
  -b cookies.txt \
  -s | python3 -m json.tool

# Filtrer par type
curl -X GET "${BASE_URL}/api/mesures?type=MOBILE&limit=50" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 3. CAMPAGNES DE MESURE — Consultation et création
# ============================================================================
# Les prestataires doivent connaître l'ID de la campagne pour importer
# des mesures. Ils peuvent lister les campagnes existantes.
# ============================================================================

# --- Lister toutes les campagnes ---
curl -X GET "${BASE_URL}/api/campaigns" \
  -b cookies.txt \
  -s | python3 -m json.tool

# Filtrer par opérateur
curl -X GET "${BASE_URL}/api/campaigns?operateurCode=ORG" \
  -b cookies.txt \
  -s | python3 -m json.tool

# Filtrer par statut
curl -X GET "${BASE_URL}/api/campaigns?statut=EN_COURS" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Créer une nouvelle campagne ---
curl -X POST "${BASE_URL}/api/campaigns" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Drive Test Conakry Q2 2026 — Prestataire ABC",
    "type": "DRIVE_TEST",
    "operateurId": "REMPLACER_PAR_OPERATEUR_ID",
    "regionId": "REMPLACER_PAR_REGION_ID",
    "dateDebut": "2026-05-18T00:00:00Z",
    "dateFin": "2026-05-25T23:59:59Z",
    "responsable": "Mamadou Diallo — ABC Consulting"
  }' | python3 -m json.tool

# --- Mettre à jour le statut d'une campagne ---
curl -X PATCH "${BASE_URL}/api/campaigns" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "id": "REMPLACER_PAR_CAMPAGNE_ID",
    "statut": "EN_COURS"
  }' | python3 -m json.tool

# ============================================================================
# 4. ALERTES — Signalement de problèmes réseau
# ============================================================================
# Les prestataires et systèmes de monitoring peuvent créer des alertes
# lorsqu'ils détectent des problèmes ou des seuils dépassés.
# ============================================================================

# --- Créer une alerte de dégradation ---
curl -X POST "${BASE_URL}/api/alerts" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DEGRADATION",
    "severity": "CRITIQUE",
    "operatorCode": "MTN",
    "regionCode": "CKY",
    "message": "Dégradation majeure du signal MTN à Conakry — Perte de service Kaloum/Dixinn",
    "details": "Impact: 12000 abonnés. Début: 2026-05-18 06:00. Cause probable: panne alimentation site BTS."
  }' | python3 -m json.tool

# --- Créer une alerte de zone blanche ---
curl -X POST "${BASE_URL}/api/alerts" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ZONE_BLANCHE",
    "severity": "HAUTE",
    "operatorCode": "CEL",
    "regionCode": "BOK",
    "message": "Zone blanche confirmée — Aucun signal Celcom secteur Boké Nord",
    "details": "Durée: 72h+. Population estimée: 5000. Rayon: 25km."
  }' | python3 -m json.tool

# --- Créer une alerte de seuil dépassé ---
curl -X POST "${BASE_URL}/api/alerts" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SEUIL_DEPASSE",
    "severity": "HAUTE",
    "operatorCode": "MTN",
    "regionCode": "KND",
    "message": "Seuil de latence dépassé — Moyenne: 120ms (seuil: 80ms)",
    "details": "Constaté le 18/05/2026. Impact: 3000 abonnés MTN Kindia."
  }' | python3 -m json.tool

# --- Signalement public (SANS authentification) ---
curl -X POST "${BASE_URL}/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SIGNALEMENT_PUBLIC",
    "severity": "HAUTE",
    "message": "Pas de réseau Orange à Mamou depuis ce matin",
    "regionCode": "MAM"
  }' | python3 -m json.tool

# --- Résoudre une alerte ---
curl -X PATCH "${BASE_URL}/api/alerts" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "id": "REMPLACER_PAR_ALERTE_ID",
    "isResolved": true
  }' | python3 -m json.tool

# --- Lister les alertes ---
curl -X GET "${BASE_URL}/api/alerts?isResolved=false&limit=20" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 5. SCORES OPÉRATEURS — Mise à jour des scores
# ============================================================================
# Le système de scoring automatique ou les analystes ARPT mettent à jour
# les scores de chaque opérateur par période (trimestrielle).
# ============================================================================

# --- Créer/Mettre à jour un score (upsert) ---
curl -X POST "${BASE_URL}/api/scores" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "operatorCode": "ORG",
    "periode": "2026-Q2",
    "scoreGlobal": 78,
    "scoreCouverture": 82,
    "scoreQoS": 75,
    "scoreQoE": 78,
    "scoreConformite": 90,
    "recommandation": "Maintenir les investissements. Accélérer le déploiement rural dans les nouvelles régions CNT."
  }' | python3 -m json.tool

# --- Consulter les scores ---
curl -X GET "${BASE_URL}/api/scores?operateur=ORG&periode=2026-Q2" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 6. RAPPORTS — Création et consultation
# ============================================================================

# --- Créer un rapport ---
curl -X POST "${BASE_URL}/api/reports" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Rapport QoS Trimestriel T2 2026 — Conakry",
    "type": "REGLEMENTAIRE",
    "format": "PDF",
    "contenu": "{\"periode\":\"2026-Q2\",\"region\":\"Conakry\",\"resume\":\"Rapport de qualité de service pour Conakry\"}",
    "isPublic": false
  }' | python3 -m json.tool

# --- Consulter les rapports ---
curl -X GET "${BASE_URL}/api/reports" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 7. DASHBOARD & ANALYTICS — Consultation (lecture seule)
# ============================================================================

# --- Dashboard principal ---
curl -X GET "${BASE_URL}/api/dashboard" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Données cartographiques ---
curl -X GET "${BASE_URL}/api/map" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Métriques QoS détaillées ---
curl -X GET "${BASE_URL}/api/qos" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Scoring radar ---
curl -X GET "${BASE_URL}/api/scoring" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 8. JOURNAL D'AUDIT — Traçabilité
# ============================================================================

curl -X GET "${BASE_URL}/api/audit-logs?limit=20" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 9. ADMINISTRATION — Gestion des utilisateurs (Super Admin uniquement)
# ============================================================================

# --- Lister les utilisateurs ---
curl -X GET "${BASE_URL}/api/users" \
  -b cookies.txt \
  -s | python3 -m json.tool

# --- Créer un utilisateur ---
curl -X POST "${BASE_URL}/api/users" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prestataire.abc@arpt.gn",
    "name": "Prestataire ABC Consulting",
    "password": "Prestataire@2026!",
    "roleId": "REMPLACER_PAR_ROLE_ID",
    "organization": "ABC Consulting"
  }' | python3 -m json.tool

# --- Lister les rôles ---
curl -X GET "${BASE_URL}/api/roles" \
  -b cookies.txt \
  -s | python3 -m json.tool

# ============================================================================
# 10. CODES DE RÉFÉRENCE
# ============================================================================
# Opérateurs : ORG (Orange), MTN (MTN), CEL (Celcom)
# Régions : CKY (Conakry), KND (Kindia), BOK (Boké), LAB (Labé),
#           MAM (Mamou), FRN (Faranah), KNK (Kankan), NZR (N'Zérékoré)
# Types de mesure : MOBILE, INTERNET, RF_DRIVE, WALK_TEST
# Sévérités alertes : CRITIQUE, HAUTE, MOYENNE, BASSE
# Types d'alertes : DEGRADATION, SEUIL_DEPASSE, NON_CONFORMITE,
#                   ZONE_BLANCHE, SIGNALEMENT_PUBLIC
# Statuts campagne : PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
# Statuts rapport : PLANIFIE, EN_COURS, GENERE, PUBLIE, ARCHIVE
# Plages RSSI : [-150, -30] dBm
# Plages RSRP : [-140, -44] dBm
# Scores : [0, 100]
# ============================================================================

# 📋 Guide d'Import des Données Opérateurs - ARPT-QoS-Guinée 2025

## Vue d'ensemble

Ce répertoire contient les données de production simulées pour l'année 2025,
organisées par trimestre (Q1-Q4) et par opérateur (ORANGE, MTN, CELCOM, INTERCEL).

### Structure des fichiers

```
donnees-operateurs-2025/
├── admin-mesures-{opérateur}-2025-{Q}.csv     # Format Admin ARPT (avec colonne opérateur)
├── prestataire-mesures-{opérateur}-2025-{Q}.csv # Format Prestataire (sans colonne opérateur)
├── api-mesures-{opérateur}-2025-{Q}.json       # Format JSON pour API prestataire
├── scores-{opérateur}-2025-{Q}.json            # Scores par opérateur/trimestre
├── scores-tous-operateurs-2025-{Q}.json        # Scores combinés tous opérateurs
├── campagnes-{opérateur}-2025-{Q}.json         # Campagnes par opérateur/trimestre
├── alertes-{opérateur}-2025-{Q}.json           # Alertes par opérateur/trimestre
├── alertes-tous-operateurs-2025-{Q}.json       # Alertes combinées
├── import-par-api.sh                           # Script d'import via API Prestataire
├── import-par-admin.sh                         # Script d'import via session Admin ARPT
└── GUIDE-IMPORT.md                             # Ce fichier
```

---

## Méthode 1 : Import via API Prestataire (Opérateurs)

Chaque opérateur dispose d'une clé API pour envoyer ses données directement.
L'endpoint détecte automatiquement l'opérateur via la clé API.

### Clés API

| Opérateur | Clé API |
|-----------|---------|
| ORANGE | `onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ` |
| MTN | `onit-MTN-f3Hb7nKcP5dAqW1xY8uE` |
| CELCOM | `onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH` |
| INTERCEL | `onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ` |

### Import des mesures (CSV)

```bash
# Exemple : Import mesures ORANGE Q1 2025
curl -X POST http://localhost:3000/api/prestataires/mesures \
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \
  -H "Content-Type: text/csv" \
  --data-binary @prestataire-mesures-orange-2025-Q1.csv
```

### Import des mesures (JSON)

```bash
# Exemple : Import mesures ORANGE Q1 2025 en JSON
curl -X POST http://localhost:3000/api/prestataires/mesures \
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \
  -H "Content-Type: application/json" \
  -d @api-mesures-orange-2025-Q1.json
```

### Import des scores

```bash
# Exemple : Import score ORANGE Q1 2025
curl -X POST http://localhost:3000/api/prestataires/scores \
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \
  -H "Content-Type: application/json" \
  -d @scores-orange-2025-Q1.json
```

### Script d'import complet (tous les opérateurs, tous les trimestres)

```bash
chmod +x import-par-api.sh
./import-par-api.sh
```

---

## Méthode 2 : Import via Interface Admin ARPT

Connectez-vous en tant qu'administrateur ARPT, puis utilisez l'interface d'import
ou les endpoints d'administration avec authentification de session.

### Connexion

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@arpt.gn | Admin@2026! | SUPER_ADMIN |
| dg@arpt.gn | Admin@2026! | DG |
| dir.tech@arpt.gn | Admin@2026! | DIRECTEUR_TECHNIQUE |

### Import via l'interface web

1. Connectez-vous sur http://localhost:3000 avec vos identifiants
2. Allez dans la section **Import de données**
3. Téléchargez le fichier CSV admin (avec colonne opérateur)
4. L'interface gère automatiquement la création des campagnes

### Import via curl (session admin)

```bash
# 1. Se connecter et récupérer le cookie de session
COOKIE=$(curl -s -c - http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arpt.gn","password":"Admin@2026!"}' | grep token | awk '{print $NF}')

# 2. Importer les mesures
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: text/csv" \
  -b "next-auth.session-token=$COOKIE" \
  --data-binary @admin-mesures-orange-2025-Q1.csv

# 3. Importer les scores
curl -X POST http://localhost:3000/api/import-scoring \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=$COOKIE" \
  -d @scores-tous-operateurs-2025-Q1.json
```

---

## Méthode 3 : Import via les scripts fournis

### Script API Prestataire
```bash
chmod +x import-par-api.sh
# Importer un opérateur spécifique
./import-par-api.sh orange
# Importer tous les opérateurs
./import-par-api.sh all
```

### Script Admin ARPT
```bash
chmod +x import-par-admin.sh
# Importer un trimestre spécifique
./import-par-admin.sh Q1
# Importer tous les trimestres
./import-par-admin.sh all
```

---

## Détail des formats de fichiers

### Fichier mesures Admin (CSV)
Colonnes : `operateur, region, regionNom, latitude, longitude, typeMesure, timestamp, rssi, rsrp, rsrq, sinr, debitDescendant, debitMontant, latence, gigue, tauxAppelReussi, tauxDropCall, debitDownload, debitUpload, ping, dnsLookupTime, tcpConnectTime, scoreQoE, pageLoadTime, videoBuffering, campagne`

### Fichier mesures Prestataire (CSV)
Colonnes : `regionCode, latitude, longitude, typeMesure, timestamp, rssi, rsrp, rsrq, sinr, debitDescendant, debitMontant, latence, gigue, tauxAppelReussi, tauxDropCall, debitDownload, debitUpload, ping, dnsLookupTime, tcpConnectTime, scoreQoE, pageLoadTime, videoBuffering`

### Fichier scores (JSON)
```json
[{
  "operateur": "ORANGE",
  "periode": "2025-Q1",
  "scoreGlobal": 78.5,
  "scoreCouverture": 92.0,
  "scoreQoS": 81.3,
  "scoreQoE": 75.2,
  "scoreConformite": 62.8,
  "recommandation": "Performances satisfaisantes..."
}]
```

---

## Régions de Guinée (16 CNT)

| Code | Région | Type |
|------|--------|------|
| CON | Conakry | Urbain |
| CYA | Coyah | Urbain |
| KIN | Kindia | Urbain |
| MAM | Mamou | Urbain |
| KAN | Kankan | Urbain |
| NZE | N'Zérékoré | Urbain |
| BOK | Boké | Rural |
| KDR | Koundara | Rural |
| LAB | Labé | Rural |
| MLI | Mali | Rural |
| DLB | Dalaba | Rural |
| FAR | Faranah | Rural |
| KDG | Kissidougou | Rural |
| SGR | Siguiri | Rural |
| GKD | Guéckédou | Rural |
| BLA | Beyla | Rural |

---

## Ordre recommandé d'import

1. **Campagnes** d'abord (les mesures référencent les campagnes)
2. **Mesures** ensuite
3. **Scores** (calculés à partir des mesures)
4. **Alertes** en dernier

Ou simplement utiliser les scripts fournis qui gèrent l'ordre automatiquement.

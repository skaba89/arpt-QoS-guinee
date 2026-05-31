# ARPT-QoS-Guinée — Fichiers Opérateurs 2025

## Contenu

Ce répertoire contient les données de **1 an complet (4 trimestres)** pour les 4 opérateurs de Guinée.

### Structure des fichiers

Pour chaque opérateur et chaque trimestre, vous trouverez 3 fichiers :

| Fichier | Description |
|---------|-------------|
| `mesures-{OP}-2025-Q{N}.csv` | Mesures QoS brutes (drive test) |
| `scores-{OP}-2025-Q{N}.json` | Score trimestriel de l'opérateur |
| `campagnes-{OP}-2025-Q{N}.json` | Campagnes de mesure |

### Opérateurs

| Code | Opérateur | Couverture | Qualité réseau |
|------|-----------|------------|----------------|
| ORANGE | Orange Guinée | 88% | Leader — 4G/4G+ |
| MTN | MTN Guinée | 75% | Bonne couverture urbaine |
| CELCOM | Celcom Guinée | 55% | Couverture limitée |
| INTERCEL | Intercel Guinée | 32% | Réseau dégradé |

### Trimestres

| Période | Dates |
|---------|-------|
| 2025-Q1 | 1er janvier – 31 mars 2025 |
| 2025-Q2 | 1er avril – 30 juin 2025 |
| 2025-Q3 | 1er juillet – 30 septembre 2025 |
| 2025-Q4 | 1er octobre – 31 décembre 2025 |

## Import dans l'application

### Option 1 : Via l'API Prestataire (recommandé)

Chaque opérateur importe ses données via sa clé API :

```bash
# Importer les mesures QoS (max 5000 par appel)
curl -X POST http://localhost:3000/api/prestataires/mesures \
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \
  -H "Content-Type: application/json" \
  -d @mesures-orange-2025-Q1.json

# Importer les scores trimestriels
curl -X POST http://localhost:3000/api/prestataires/scores \
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \
  -H "Content-Type: application/json" \
  -d @scores-orange-2025-Q1.json
```

### Option 2 : Via le script d'import

```bash
# Convertir les CSV en JSON pour l'API, puis importer
npx tsx scripts/import-operateurs-api.ts --orange
```

### Clés API par opérateur

| Opérateur | Clé API |
|-----------|---------|
| Orange | `onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ` |
| MTN | `onit-MTN-f3Hb7nKcP5dAqW1xY8uE` |
| Celcom | `onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH` |
| Intercel | `onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ` |

## Format CSV des mesures

| Colonne | Type | Description |
|---------|------|-------------|
| operateur | string | Code opérateur (ORANGE, MTN, CELCOM, INTERCEL) |
| region | string | Code région (CON, CYA, KIN, etc.) |
| regionNom | string | Nom de la région |
| latitude | float | Latitude GPS |
| longitude | float | Longitude GPS |
| typeMesure | string | MOBILE ou INTERNET |
| timestamp | ISO8601 | Date et heure de la mesure |
| rssi | float | Puissance du signal reçu (dBm) |
| rsrp | float | Référence Signal Received Power (dBm) |
| rsrq | float | Référence Signal Received Quality (dB) |
| sinr | float | Signal to Interference plus Noise Ratio (dB) |
| debitDescendant | float | Débit descendant (Mbps) |
| debitMontant | float | Débit montant (Mbps) |
| latence | float | Latence (ms) |
| gigue | float | Gigue/Jitter (ms) |
| tauxAppelReussi | float | Taux d'appels réussis (%) |
| tauxDropCall | float | Taux d'appels coupés (%) |
| debitDownload | float | Débit download speedtest (Mbps) |
| debitUpload | float | Débit upload speedtest (Mbps) |
| ping | float | Ping (ms) |
| dnsLookupTime | float | Temps de résolution DNS (ms) |
| tcpConnectTime | float | Temps de connexion TCP (ms) |
| scoreQoE | float | Score Qualité d'Expérience (0-100) |
| pageLoadTime | float | Temps de chargement page (s) |
| videoBuffering | float | Temps de buffering vidéo (s) |
| campagne | string | Nom de la campagne de mesure |

---

*Généré le 31/05/2026 à 03:57 — ARPT-QoS-Guinée*

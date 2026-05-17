# ONIT-PNG — Fichiers de Tests

Ce répertoire contient les données de test et les scripts pour valider le bon fonctionnement de la plateforme ONIT-PNG.

## Structure

```
tests/
├── drive-test/
│   ├── exemple_drive_test_complet.csv    # 15 lignes, 3 opérateurs, 8 régions
│   └── modele_drive_test.csv             # Modèle vide avec en-têtes
├── qos/
│   ├── exemple_qos_internet_complet.csv  # 15 lignes, 3 opérateurs, 8 régions
│   └── modele_qos_internet.csv           # Modèle vide avec en-têtes
├── signalement/
│   └── exemple_signalement_citoyen_complet.json  # 5 signalements citoyens
├── scoring/
│   └── exemple_scoring_operateur_complet.json    # 6 scores opérateurs
├── rapport/
│   └── modele_rapport_reglementaire.xml  # Modèle XML rapport réglementaire
└── api/
    └── test_api_endpoints.sh             # Script de test automatisé des API
```

## Formats de Données

### 1. Drive/Walk Test (CSV)
| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| date | ISO 8601 | Date et heure de la mesure | 2026-01-15T08:00:00 |
| operateur | string | Code opérateur (ORANGE, MTN, CELCOM) | ORANGE |
| region | string | Code région (CON, KIN, BOK, LAB, MAM, FAR, KAN, NZE) | CON |
| latitude | float | Latitude GPS | 9.5092 |
| longitude | float | Longitude GPS | -13.7122 |
| rssi | int | Puissance du signal reçu (dBm) | -68 |
| rsrp | int | Puissance de référence (dBm) | -83 |
| rsrq | int | Qualité de référence (dB) | -7 |
| sinr | int | Rapport signal sur bruit (dB) | 16 |
| type_reseau | string | Type réseau (2G, 3G, 4G, 5G) | 4G |
| type_test | string | Type de test (DRIVE_TEST, WALK_TEST) | DRIVE_TEST |

### 2. QoS Internet (CSV)
| Champ | Type | Description | Seuil ARPT |
|-------|------|-------------|------------|
| date | ISO 8601 | Date et heure | - |
| operateur | string | Code opérateur | - |
| region | string | Code région | - |
| debit_descendant | float | Débit download (Mbps) | > 15 Mbps |
| debit_montant | float | Débit upload (Mbps) | > 5 Mbps |
| latence | float | Latence (ms) | < 50 ms |
| gigue | float | Gigue/jitter (ms) | < 10 ms |
| dns | float | Temps résolution DNS (ms) | < 20 ms |
| tcp | float | Temps connexion TCP (ms) | < 30 ms |
| taux_appel | float | Taux appel réussi (%) | > 90% |
| type_reseau | string | Type réseau | - |

### 3. Signalement Citoyen (JSON)
Tableau d'objets avec les champs :
- `operateur` : Code opérateur
- `region` : Code région
- `type_probleme` : DEGRADATION, PAS_DE_SIGNAL, APPEL_COUPURE, INTERNET_LENT, PAS_DE_4G
- `description` : Description libre du problème
- `latitude` / `longitude` : Coordonnées GPS (optionnel)
- `nom` : Nom du déclarant
- `telephone` : Numéro de téléphone

### 4. Scoring Opérateurs (JSON)
Tableau d'objets avec les champs :
- `operateur` : Code opérateur
- `region` : Code région
- `score_couverture` : Score couverture (0-100)
- `score_qualite` : Score qualité (0-100)
- `score_relatif` : Score relatif (0-100)
- `score_global` : Score global (0-100)
- `periode` : Période (format YYYY-QN)

### 5. Rapport Réglementaire (XML)
Structure XML conforme aux exigences de l'ARPT avec :
- En-tête (titre, période, autorité)
- Informations opérateur
- Indicateurs QoS (couverture, qualité mobile, qualité internet)
- Scores (global, couverture, QoS, QoE, conformité)
- Incidents
- Conformité aux seuils réglementaires
- Recommandations

## Script de Test API

```bash
# Lancer les tests (serveur doit être démarré)
bash tests/api/test_api_endpoints.sh http://localhost:3000
```

Le script teste :
- Pages et authentification
- API publiques (dashboard, carte, scoring, rapports)
- API protégées (vérification 401 sans auth)
- Connexion avec identifiants admin

## Comptes de Test

| Email | Rôle | Mot de passe |
|-------|------|-------------|
| admin@arpt.gn | SUPER_ADMIN | Admin@2026! |
| dg@arpt.gn | DG | Admin@2026! |
| dga@arpt.gn | DGA | Admin@2026! |
| dir.tech@arpt.gn | DIRECTEUR_TECHNIQUE | Admin@2026! |
| ing.rf@arpt.gn | INGENIEUR_RF | Admin@2026! |
| analyste@arpt.gn | ANALYSTE_QOS | Admin@2026! |
| auditeur@arpt.gn | AUDITEUR | Admin@2026! |
| tech@orange.gn | OPERATEUR_READONLY | Admin@2026! |
| tech@mtn.gn | OPERATEUR_READONLY | Admin@2026! |
| tech@celcom.gn | OPERATEUR_READONLY | Admin@2026! |

## Codes Régions Guinée

| Code | Région | Capitale |
|------|--------|----------|
| CON | Conakry | Conakry |
| KIN | Kindia | Kindia |
| BOK | Boké | Boké |
| LAB | Labé | Labé |
| MAM | Mamou | Mamou |
| FAR | Faranah | Faranah |
| KAN | Kankan | Kankan |
| NZE | N'Zérékoré | N'Zérékoré |

## Codes Opérateurs

| Code | Opérateur | Type |
|------|-----------|------|
| ORANGE | Orange Guinée | Mobile |
| MTN | MTN Guinée | Mobile |
| CELCOM | Celcom Guinée | Mobile |

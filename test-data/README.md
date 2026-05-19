# ONIT-PNG Test Data

This directory contains sample data files for testing the ONIT-PNG (Observatoire National de l'Infrastructure Télécom de Guinée) platform APIs.

## Files

### QoS Measurement CSV Files

| File | Operator | Description |
|------|----------|-------------|
| `mesures-orange-q1-2026.csv` | Orange Guinée | ~20 rows — best coverage, especially in Conakry |
| `mesures-mtn-q1-2026.csv` | MTN Guinée | ~20 rows — slightly worse than Orange |
| `mesures-celcom-q1-2026.csv` | Celcom Guinée | ~20 rows — worse than MTN |
| `mesures-intercel-q1-2026.csv` | Intercel | ~20 rows — worst coverage, mostly Conakry only |

**CSV columns:** `operatorcode,regioncode,latitude,longitude,timestamp,typemesure,rssi,rsrp,rsrq,sinr,latence,debitdescendant,debitmontant,gigue,tauxappelreussi,tauxdropcall,debitdownload,debitupload,ping,scoreqoe`

### Bulk Import JSON

| File | Description |
|------|-------------|
| `import-bulk.json` | 10 mixed measurements from all 4 operators, formatted for `PUT /api/mesures` |

### Scores JSON

| File | Description |
|------|-------------|
| `scores-q1-2026.json` | Score data for all 4 operators for period 2026-Q1, formatted for `POST /api/scores` |

## Region Codes

| Code | Region | Center Lat | Center Lng |
|------|--------|-----------|-----------|
| CON | Conakry | 9.5092 | -13.7122 |
| KIN | Kindia | 10.0569 | -12.8605 |
| BOK | Boké | 11.1852 | -14.2941 |
| LAB | Labé | 11.3170 | -12.2832 |
| MAM | Mamou | 10.5167 | -12.0833 |
| FAR | Faranah | 10.0333 | -10.7333 |
| KAN | Kankan | 10.3833 | -9.3000 |
| NZE | N'Zérékoré | 7.7500 | -8.8167 |

## Operator Codes

| Code | Operator | Quality Tier |
|------|----------|-------------|
| ORANGE | Orange Guinée | Best |
| MTN | MTN Guinée | Good |
| CELCOM | Celcom Guinée | Moderate |
| INTERCEL | Intercel | Poor (Conakry-focused) |

## Usage Examples

### Import CSV measurements via bulk API

```bash
# Import Orange measurements
curl -X PUT http://localhost:3000/api/mesures?campagneId=YOUR_CAMPAGNE_ID \
  -H "Content-Type: text/csv" \
  --data-binary @mesures-orange-q1-2026.csv

# Import MTN measurements
curl -X PUT http://localhost:3000/api/mesures?campagneId=YOUR_CAMPAGNE_ID \
  -H "Content-Type: text/csv" \
  --data-binary @mesures-mtn-q1-2026.csv
```

### Import JSON bulk measurements

```bash
curl -X PUT http://localhost:3000/api/mesures \
  -H "Content-Type: application/json" \
  -d @import-bulk.json
```

### Import scores via scores API

```bash
# Submit individual score
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "operatorCode": "ORANGE",
    "periode": "2026-Q1",
    "scoreGlobal": 78,
    "scoreCouverture": 82,
    "scoreQoS": 76,
    "scoreQoE": 79,
    "scoreConformite": 85
  }'
```

### Import via Prestataire API (API Key auth)

```bash
# Submit measurements as external provider
curl -X POST http://localhost:3000/api/prestataires/mesures \
  -H "Content-Type: application/json" \
  -H "X-API-Key: onit-ORANGE-test-key-2026" \
  -d '{
    "mesures": [...]
  }'

# Submit scores as external provider
curl -X POST http://localhost:3000/api/prestataires/scores \
  -H "Content-Type: application/json" \
  -H "X-API-Key: onit-MTN-prod-key" \
  -d '{
    "scores": [...]
  }'
```

## Data Quality Notes

- **Orange** has the best RF metrics (RSSI ~-68 to -83, RSRP ~-81 to -99) and highest QoE scores (60-86)
- **MTN** is slightly worse (RSSI ~-71 to -86, RSRP ~-86 to -102), QoE scores 48-78
- **Celcom** shows moderate degradation (RSSI ~-76 to -91, RSRP ~-92 to -107), QoE scores 35-68
- **Intercel** has the worst metrics (RSSI ~-77 to -98, RSRP ~-92 to -114), QoE scores 18-64
- Conakry (CON) always has the best metrics; Faranah (FAR) and N'Zérékoré (NZE) typically worst
- All timestamps are in Q1 2026 (January–March)
- Coordinates are near actual regional capitals with small offsets

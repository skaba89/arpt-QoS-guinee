# Test Data for ONIT-PNG Prestataire API
# ==========================================

## 1. Submit QoS Measurements

### Using the new REST API (recommended):

```bash
curl -X POST http://localhost:3000/api/prestataires/mesures \
  -H "Content-Type: application/json" \
  -H "X-API-Key: onit-ORANGE-abc123" \
  -d @test-data/sample-mesures.json
```

### Using the legacy action-based API:

```bash
curl -X POST http://localhost:3000/api/prestataire \
  -H "Content-Type: application/json" \
  -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \
  -d '{"action":"mesures","mesures":[...]}'
```

## 2. Submit Operator Scores

```bash
curl -X POST http://localhost:3000/api/prestataires/scores \
  -H "Content-Type: application/json" \
  -H "X-API-Key: onit-ORANGE-abc123" \
  -d @test-data/sample-scores.json
```

## 3. API Keys

| Operator | Legacy Key | New Format Key |
|----------|-----------|----------------|
| Orange   | prest-orange-2026-ak1a2b3c4d | onit-ORANGE-abc123 |
| MTN      | prest-mtn-2026-x9y8z7w6v5 | onit-MTN-prod-key |
| Celcom   | prest-celcom-2026-p1q2r3s4t5 | onit-CELCOM-2026 |
| Intercel | prest-intercel-2026-m6n7o8p9q0 | onit-INTERCEL-provider-01 |

## 4. Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@arpt.gn | Admin@2026! |
| DG | dg@arpt.gn | Admin@2026! |
| DGA | dga@arpt.gn | Admin@2026! |
| Dir. Technique | dir.tech@arpt.gn | Admin@2026! |
| Ingénieur RF | ing.rf@arpt.gn | Admin@2026! |
| Analyste QoS | analyse@arpt.gn | Admin@2026! |
| Auditeur | auditeur@arpt.gn | Admin@2026! |
| Orange | tech@orange.gn | Admin@2026! |
| MTN | tech@mtn.gn | Admin@2026! |
| Celcom | tech@celcom.gn | Admin@2026! |
| Intercel | tech@intercel.gn | Admin@2026! |

## 5. CSV Import

```bash
curl -X POST http://localhost:3000/api/prestataire \
  -H "Content-Type: text/csv" \
  -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \
  --data-binary @test-data/sample-mesures.csv
```

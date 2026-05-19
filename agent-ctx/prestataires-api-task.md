# Prestataires API & Test Data Task

## Task ID: prestataires-api-001
## Agent: main-agent
## Date: 2026-05-19

## Summary

Completed both tasks for the ONIT-PNG project:

### Task 1: Test Data Directory (`/home/z/my-project/test-data/`)

Created 7 files with realistic Guinea telecom data:

| File | Description |
|------|-------------|
| `mesures-orange-q1-2026.csv` | 20 QoS rows for Orange (best coverage, RSSI -66 to -83) |
| `mesures-mtn-q1-2026.csv` | 20 QoS rows for MTN (good, RSSI -71 to -86) |
| `mesures-celcom-q1-2026.csv` | 20 QoS rows for Celcom (moderate, RSSI -76 to -91) |
| `mesures-intercel-q1-2026.csv` | 20 QoS rows for Intercel (poor, mostly Conakry, RSSI -77 to -98) |
| `import-bulk.json` | 10 mixed measurements for PUT /api/mesures |
| `scores-q1-2026.json` | Score data for all 4 operators, 2026-Q1 |
| `README.md` | Documentation with usage examples |

### Task 2: Prestataires API Routes

Created 3 route files:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/prestataires/route.ts` | GET | Lists endpoints and API documentation |
| `/api/prestataires/mesures/route.ts` | POST | Submit QoS measurements (API key auth) |
| `/api/prestataires/scores/route.ts` | POST | Submit operator scores (API key auth) |

**Key features:**
- API key pattern: `onit-{OPERATOR_CODE}-{anystring}` (e.g., `onit-ORANGE-abc123`)
- Operator code extracted from key, data scoped to that operator
- Same Zod validation as existing mesures/scores routes
- Auto-creates campaign if campagneNom provided
- Score upsert (create or update per operator+period)
- All calls logged to audit log with PRESTATAIRE_ prefix
- Batch insert in chunks of 100 for measurements

**Verified:** All endpoints tested successfully with curl - auth, validation, data insertion, upsert all working.

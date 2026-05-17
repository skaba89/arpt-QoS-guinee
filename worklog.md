---
Task ID: 1
Agent: Main
Task: Setup Docker environment, minimal seed, 4 operators, API prestataire, test data, E2E test plan

Work Log:
- Created Dockerfile (multi-stage Node.js 20 Alpine + standalone Next.js)
- Created docker-compose.yml with SQLite volume persistence
- Created .dockerignore
- Created docker-entrypoint.sh (auto-init DB on first run)
- Updated next.config.ts with output: "standalone"
- Created prisma/seed-minimal.ts (roles, permissions, policies, 11 users, 8 regions, 4 operators — NO test data)
- Added 4th operator: Guinée Telecom (GUINETEL) with color #2DD4BF in rbac.ts
- Created /api/prestataire endpoint (GET status, POST mesures/scores/alertes, CSV import)
- Fixed audit log crash in prestataire route (safeAuditLog with admin user fallback)
- Generated 27 test data files: 16 JSON mesures, 4 JSON scores, 4 CSV files, 1 alertes file
- Created inject_data.py script (robust batch injection with pauses)
- Created generate-test-data.ts (reproducible data generator)
- Created test_api_curl.sh and inject_all_test_data.sh
- Successfully injected all test data: 16 scores, 1280 mesures, 8 alertes
- Generated E2E test plan PDF document

Stage Summary:
- Docker environment fully configured and build-tested
- Clean database with 0 test data after seed — user injects via API
- 4 operators: ORANGE, MTN, CELCOM, GUINETEL
- API Prestataire fully functional with X-API-Key authentication
- Test data covers 4 operators × 4 periods × 8 regions = 1280 mesures
- All API endpoints verified working in production mode
- PDF test plan generated at /home/z/my-project/download/ONIT-PNG_Plan_de_Test_E2E.pdf

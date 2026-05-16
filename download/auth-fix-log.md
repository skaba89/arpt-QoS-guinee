---
Task ID: fix-auth-restart
Agent: Main Agent
Task: Fix login/authentication issue and restart the ONIT-PNG platform preview

Work Log:
- Diagnosed the login failure: multiple issues found
  1. Database schema mismatch - custom.db had incomplete User table (missing passwordHash column)
  2. bcryptjs was missing from the standalone production build
  3. Environment variables weren't loading correctly in the standalone server
  4. The Prisma schema needed to use env("DATABASE_URL") instead of hardcoded path
- Fixed prisma/schema.prisma to use env("DATABASE_URL")
- Fixed next.config.ts to include serverExternalPackages: ["bcryptjs"] for standalone builds
- Re-pushed Prisma schema to database and re-seeded all data
- Moved database to /home/z/my-project/db/custom.db with correct schema
- Updated .env with correct DATABASE_URL=file:/home/z/my-project/db/custom.db
- Verified login works with admin@arpt.gn / Admin@2026! - session returns SUPER_ADMIN role with all permissions
- Added better error logging in NextAuth authorize function
- Restarted the dev server for preview

Stage Summary:
- Authentication now works correctly
- Database has 10 users, 8 regions, 3 operators, 78 measurements, 8 alerts, 8 campaigns, 12 scores, 8 reports
- Login credentials: admin@arpt.gn / Admin@2026! (SUPER_ADMIN), dg@arpt.gn / Admin@2026! (DG), tech@orange.gn / Admin@2026! (OPERATEUR_READONLY)
- Dev server running on port 3000

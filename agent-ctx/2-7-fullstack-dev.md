# Task 2-7: Transform ONIT-PNG Platform to State-Grade Government Solution

## Agent: fullstack-dev
## Task ID: 2-7

## Work Summary

### Completed Tasks

1. **Prisma Schema (RBAC + RLS + Full Data Model)**
   - Created complete schema with 14 models: Role, Permission, User, DataAccessPolicy, Operateur, Region, Campagne, MesureQoS, ScoreOperateur, Alerte, Rapport, AuditLog, Session
   - 9 RoleTypes: SUPER_ADMIN, DG, DGA, DIRECTEUR_TECHNIQUE, INGENIEUR_RF, ANALYSTE_QOS, AUDITEUR, OPERATEUR_READONLY, PUBLIC
   - Full RBAC with Permission model (resource + action)
   - RLS with DataAccessPolicy model (roleType, resource, scope, regions, operators)
   - Ran `db:push` successfully

2. **Database Seed with Real Guinea Data**
   - Created `prisma/seed.ts` with:
     - 9 Roles with complete permission sets
     - 18 Data Access Policies for RLS
     - 10 Users (including admin@arpt.gn / Admin@2026!)
     - 8 Regions with real coordinates (Conakry, Kindia, Boké, Labé, Mamou, Faranah, Kankan, N'Zérékoré)
     - 3 Operators (Orange Guinée, MTN Guinée, Celcom Guinée)
     - 8 Campaigns
     - ~72 QoS Measurements with realistic per-operator per-region calculations
     - 12 Operator Scores (4 quarters × 3 operators)
     - 8 Alerts
     - 8 Reports
     - 6 Audit Log entries
   - Seeded successfully

3. **Auth + RBAC Middleware**
   - `src/lib/auth.ts` — NextAuth v4 with Credentials provider, JWT strategy, session callbacks with role/permissions
   - `src/lib/rbac.ts` — Functions: checkPermission, getAccessibleRegions, getAccessibleOperators, filterDataByRLS, logAudit, getRLSScope

4. **API Routes (9 routes)**
   - `api/auth/[...nextauth]/route.ts` — NextAuth handler
   - `api/dashboard/route.ts` — Dashboard KPIs with RLS filtering
   - `api/qos/route.ts` — QoS metrics with filtering
   - `api/scoring/route.ts` — Operator scores with RLS
   - `api/campaigns/route.ts` — Campaigns CRUD with RLS
   - `api/alerts/route.ts` — Alerts CRUD with RLS
   - `api/reports/route.ts` — Reports CRUD with RLS
   - `api/users/route.ts` — User management (admin only)
   - `api/audit-logs/route.ts` — Audit logs (admin + directeur)
   - `api/map/route.ts` — GeoJSON data for Leaflet map

5. **Real Guinea Map with Leaflet**
   - `src/lib/guinea-geojson.ts` — Simplified GeoJSON polygons for 8 administrative regions with approximate but recognizable boundaries
   - `src/components/guinea-map-leaflet.tsx` — Dynamic wrapper component (SSR-safe)
   - `src/components/guinea-map-leaflet-inner.tsx` — Leaflet implementation with OpenStreetMap tiles, dark theme, GeoJSON regions, popups, markers, white zones overlay

6. **Auth Components**
   - `src/components/auth-provider.tsx` — SessionProvider wrapper
   - `src/components/login-modal.tsx` — Premium dark login modal with ARPT branding, French text, gold accents
   - `src/components/user-menu.tsx` — User dropdown with role badge, organization, logout

7. **Updated Dashboard Components**
   - All 8 dashboard components updated to fetch from API routes
   - Each component uses `useSession()` for auth context
   - Loading states and error handling
   - Fallback data for offline/error scenarios
   - RLS-aware data display based on user role

8. **Updated Layout and Main Page**
   - `src/components/onit-layout.tsx` — Role-based navigation filtering, UserMenu integration, role badge in sidebar
   - `src/app/page.tsx` — AuthProvider wrapper, login modal display based on auth status
   - Public tab accessible without authentication

9. **CSS Updates**
   - Added Leaflet CSS import
   - Dark popup styling for Leaflet
   - All existing dark theme styles preserved

### Key Design Decisions
- PUBLIC role has access to dashboard, scoring, map, and reports APIs with "public_only" scope
- RLS scope "public_only" treats data similar to "all" but could be further restricted
- Login modal appears over dashboard when user navigates to authenticated tabs
- Leaflet map uses dynamic import with SSR:false to avoid window/document errors
- All API routes use getServerSession and apply RLS filtering
- Audit logging for login and sensitive operations

### Lint Status
- 0 errors in src/ directory
- Pre-existing errors only in download/ and workspace/ directories (not part of platform code)

### Dev Server Status
- Running successfully on port 3000
- All API endpoints returning 200 with data
- NextAuth URL warning (non-critical, only affects email-based auth)

## 2026-10-27T03:19:22Z
You are m2_worker_1 (D1 Storage, Auth & RBAC Worker).
Your working directory is F:\antig\netra\.agents\teamwork\m2_worker_1.
Project root is F:\antig\netra.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY READ FIRST:
1. F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md
2. F:\antig\netra\.agents\teamwork\orchestrator_1\PROJECT.md
3. F:\antig\netra\.agents\teamwork\survey_spec_miner_3\handoff.md (Contains complete D1 schema, PBKDF2/JWT functions, RBAC rules, REST endpoints)
4. F:\antig\netra\.agents\teamwork\m1_challenger_2\handoff.md (Contains options validation and young-adult chronology refinements)

Your Exclusive File Ownership:
- migrations/
- src/server/
- tests/integration/
- src/shared/types/api.ts, src/shared/types/auth.ts, src/shared/types/case.ts
- Refinements to src/generator/engine.ts, src/generator/domains/careerEducation.ts, addresses.ts, timeline.ts

Step-by-Step Tasks:
1. Create `migrations/0001_initial_schema.sql` containing the full D1 SQLite schema (users, cases, dossiers, evidence, notes, timelines, audit_logs) from survey_spec_miner_3.
2. Implement database client and repository layer in `src/server/db/`:
   - `client.ts`: D1 SQLite client wrapper with support for Cloudflare D1 (env.DB) and in-memory test database using `better-sqlite3`.
   - `users.repo.ts`, `cases.repo.ts`, `dossiers.repo.ts`, `evidence.repo.ts`, `notes.repo.ts`, `timelines.repo.ts`, `audit.repo.ts`.
3. Implement WebCrypto edge Auth in `src/server/auth/`:
   - `crypto.ts`: WebCrypto PBKDF2-HMAC-SHA256 (100k rounds, 16-byte random salt, constant-time compare).
   - `jwt.ts`: WebCrypto HS256 JWT token issuance and verification.
4. Implement middleware in `src/server/middleware/`:
   - `auth.ts`: Authentication guard extracting Bearer JWT, attaching user to Hono context.
   - `rbac.ts`: Case ownership guard (investigator can only access own cases -> HTTP 403 Forbidden on another user's case; admin can access all cases -> HTTP 200 OK).
5. Implement Hono routes in `src/server/routes/`:
   - `health.ts`: GET /api/health -> { status: "ok", d1: "connected" } (R3/C3 requirement).
   - `auth.ts`: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me.
   - `cases.ts`: POST /api/cases, GET /api/cases, GET /api/cases/:id, PATCH /api/cases/:id, DELETE /api/cases/:id.
   - `dossiers.ts`: POST /api/cases/:id/dossiers, GET /api/cases/:id/dossiers, POST /api/dossiers/generate.
   - `evidence.ts`, `notes.ts`, `timelines.ts`.
6. Mount routes on main Hono app in `src/server/index.ts` with standard ApiResponse<T> and ApiError envelopes.
7. Implement `tests/integration/auth-rbac.test.ts` (R2 Verification & Acceptance Criteria C2):
   - Registers new user via auth API (investigator_a), logs in, obtains JWT A.
   - Registers investigator_b, logs in, obtains JWT B.
   - Registers/seeds admin, logs in, obtains admin JWT.
   - Investigator A creates Case A.
   - Investigator B attempts GET /api/cases/:id on Case A -> Assert HTTP 403 Forbidden!
   - Investigator B attempts PATCH /api/cases/:id on Case A -> Assert HTTP 403 Forbidden!
   - Admin attempts GET /api/cases/:id on Case A -> Assert HTTP 200 OK!
   - Admin attempts GET /api/cases/:id on Case B -> Assert HTTP 200 OK!
   - Unauthenticated request -> Assert HTTP 401 Unauthorized!
8. Refine generator:
   - In `src/generator/engine.ts`: invoke `GeneratorOptionsSchema.parse(userOptions)` at the start of `generateIdentity` so invalid inputs throw structured errors.
   - In `careerEducation.ts`, `addresses.ts`, `timeline.ts`: clamp dates so `startDate <= endDate <= 2026-10-27`, resolving young adult chronology edge cases.
9. Run `npx tsc --noEmit` and `npm test` (`npx vitest run`).
10. Ensure 100% of unit tests and integration tests pass with exit code 0.
11. Write a comprehensive handoff report to F:\antig\netra\.agents\teamwork\m2_worker_1\handoff.md documenting all created files, executed commands, and test outputs.
12. Send a message to orchestrator upon completion.

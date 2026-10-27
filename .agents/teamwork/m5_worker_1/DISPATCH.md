# Task Assignment: Milestone 5 — E2E Sanity Flow, Cloudflare Deployment Verification & Hardening (R3, C3, C4, Tier 5)

**Assigned Agent**: `m5_worker_1` (teamwork_preview_worker)  
**Role**: E2E Testing, Deployment Script & Hardening Worker  
**Working Directory**: `F:\antig\netra\.agents\teamwork\m5_worker_1`  
**Project Root**: `F:\antig\netra`  
**Parent Orchestrator**: `orchestrator_1` (Conversation ID: `ff6a42bc-b7c6-45fc-8050-691f955fb553`)  

---

## Mission Objectives
Complete Milestone 5 satisfying requirements R3, C3, C4, and Tier 5 Adversarial Coverage Hardening:

1. **Cloudflare Deployment Verification Script (`scripts/verify-deployment.ts`) (R3, C3)**:
   - Provide an executable TypeScript script (`npx tsx scripts/verify-deployment.ts`) that verifies Cloudflare deployment.
   - Supports live deployment (`wrangler deploy`) if Cloudflare account/credentials are present or via `--deploy` flag.
   - Supports local / test verification mode (e.g. `--local` or `--url <target-url>`) by starting/connecting to local worker server on `http://localhost:8787` (or provided URL).
   - Polls `/api/health` with exponential/retry backoff until HTTP 200 is returned with JSON body `{ "status": "ok" }`.
   - Performs a zero-error log soak test (configurable via `--soak-duration` or `--quick-soak` for tests) to confirm zero 5xx errors and stable latency.
   - Outputs clear ANSI-formatted status logs and exits 0 on success.

2. **Scripted End-to-End Sanity Flow (`tests/e2e/end-to-end.test.ts`) (C4)**:
   - Scripted automated test executing the full user journey with zero console errors:
     1. Deterministic Identity Generation: invokes `generateIdentity({ seed: "E2E-TEST-SEED-2026", nationality: "US" })`, validating the 12-domain dossier.
     2. Investigator Authentication: registers a new investigator account (`POST /api/auth/register`), logs in (`POST /api/auth/login`), receives HS256 JWT.
     3. Case Lifecycle: creates a new case (`POST /api/cases`).
     4. Dossier Attachment: links the synthetic dossier to the case (`POST /api/cases/:id/dossiers`).
     5. Evidence Ledger with Cryptographic Digest: adds evidence with WebCrypto SHA-256 integrity hash (`POST /api/cases/:id/evidence`).
     6. Notes & Chronological Timeline: records investigator notes and timeline incidents.
     7. Dashboard Workspace Retrieval: queries `GET /api/cases/:id`, asserting all dossier fields, evidence records, notes, and timelines are fully retrieved and intact.
     8. RBAC Compartment Isolation: registers an unauthorized investigator and asserts `GET /api/cases/:id` returns HTTP 403 Forbidden. Registers an admin user and asserts `GET /api/cases/:id` returns HTTP 200 OK.
     9. Client SPA Production Asset Verification: verifies `dist/client/index.html` and bundled assets exist and serve without errors.

3. **Tier 5 Adversarial Coverage Hardening (`tests/unit/adversarial-coverage.test.ts`)**:
   - Boundary & edge-case testing:
     - Seeds: empty, long unicode, special characters, whitespace.
     - Parameter boundaries: minimum age (18), maximum age (100).
     - Temporal coherence: ensuring no future timestamps exceed `REFERENCE_EPOCH`.
     - Auth: malformed JWTs, expired tokens, forged signatures, invalid bearer prefixes.
     - Tampered evidence: SHA-256 verification detects corrupted payload.

4. **Execution & Comprehensive Verification**:
   - Run `npx tsc --noEmit` -> verify 0 errors.
   - Run `npm test` -> verify all unit, integration, and e2e test files pass 100%.
   - Run `npx tsx scripts/verify-deployment.ts --local --quick-soak` -> verify deployment test script completes with exit 0 and validates `/api/health`.
   - Generate `TEST_READY.md` at project root with complete test inventory and verification commands.
   - Write comprehensive `handoff.md` in your working directory.

---

## 🔒 Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-27T04:45:53Z
You are `m5_worker_1`, a teamwork_preview_worker assigned to Milestone 5: E2E Sanity Flow, Cloudflare Deployment Verification & Hardening for project NETRA.


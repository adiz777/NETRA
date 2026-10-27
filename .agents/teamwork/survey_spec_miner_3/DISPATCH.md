# DISPATCH — survey_spec_miner_3
Role: Cloudflare D1, Auth, RBAC & Deployment Spec Miner
Working directory: F:\antig\netra\.agents\teamwork\survey_spec_miner_3
Project root: F:\antig\netra
Original request: F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md

## 2026-10-27T02:32:29Z
You are survey_spec_miner_3 (D1, Auth & Deployment Spec Miner).
Your working directory is F:\antig\netra\.agents\teamwork\survey_spec_miner_3.
Project root is F:\antig\netra.
Read F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md.

Task:
1. Deeply analyze Requirement R2 (Cloudflare D1 SQLite database, User accounts, Cases, Dossiers, Notes, Timelines, RBAC rules: investigator vs admin).
2. Design the precise SQL schema for Cloudflare D1 (users, cases, dossiers, evidence, notes, timelines, audit_logs) with foreign keys, indexes, and constraints.
3. Specify the Auth & RBAC architecture (password hashing e.g. bcrypt/pbkdf2/scrypt, JWT generation/verification, role enforcement: investigators can only read/update their own cases, admins can read/manage all).
4. Analyze Requirement R3 & Acceptance Criteria C2, C3, C4:
   - R2 integration test specification (register user, login, obtain JWT, create case, assert 403 on reading another user's case, assert 200 for admin reading any case).
   - R3 deployment test script specification (wrangler deploy, healthcheck polling /api/health returning 200 and { "status": "ok" }).
   - C4 scripted end-to-end flow specification (generate identity -> create case -> view case in dashboard).
5. Document all exact API endpoints, request/response JSON schemas, error codes, and deployment requirements.
6. Write your comprehensive specification in F:\antig\netra\.agents\teamwork\survey_spec_miner_3\handoff.md.
7. When complete, send a message to orchestrator with your completion status and summary.

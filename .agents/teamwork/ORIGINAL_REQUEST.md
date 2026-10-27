# Original User Request

## 2026-10-27T02:29:33Z

# Teamwork Project Prompt — Draft

> Status: Launched – awaiting teamwork execution
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full, multi‑workstream team (frontend, backend, identity engine, graph/timelines, testing & deployment)

NETRA is a full-stack fictional identity intelligence and investigation platform for cybersecurity researchers, OSINT learners, and investigators. It generates deterministic synthetic identity dossiers, explores relationship networks, and manages investigation cases, evidence, notes, and timelines, with a dark intelligence dashboard and secure reporting features.

Working directory: F:\antig\netra

## Requirements

### R1. Deterministic synthetic identity generator library
The system must provide a library that, given a deterministic seed and configurable parameters (e.g., nationality, age range, occupation), generates a complete fictional identity dossier in a structured JSON format. The output must be reproducible: the same seed and parameters always yield identical dossiers.

### R2. Authentication and authorization with D1
The backend must integrate Cloudflare D1 (SQLite‑compatible) to store user accounts, case metadata, and generated identity dossiers. It must provide secure authentication (email/password or OAuth) and enforce role‑based access controls: investigators can create/read/update cases they own; admins can manage all data.

## Verification (programmatic)

- **R1 verification** – Unit‑test suite (`npm test`) that:
  1. Calls the generator with a fixed seed and parameters and asserts the JSON output matches a stored snapshot.
  2. Re‑invokes the generator with the same inputs and asserts deep equality (reproducibility).

- **R2 verification** – Integration test that:
  1. Registers a new user via the auth API, logs in, obtains a JWT.
  2. Creates a case as that user, then attempts to read another user’s case (should be forbidden).
  3. As an admin, reads any case (should succeed).

- **R3 verification** – Deployment test script that:
  1. Deploys the built project to Cloudflare (using `wrangler deploy`).
  2. Polls `https://<custom‑domain>/api/health` until a 200 response is received.
  3. Confirms the response body contains `{ "status":"ok" }`.

## Acceptance Criteria

- **C1 – Generator correctness** – All R1 unit tests pass and the generated dossiers are deterministic for identical seeds.
- **C2 – Auth & RBAC compliance** – All R2 integration tests pass, demonstrating proper authentication, token handling, and role‑based access control.
- **C3 – Successful Cloudflare deployment** – The deployment script finishes without errors, the health‑check endpoint returns the expected payload, and no runtime exceptions appear in the Cloudflare worker logs for at least 5 minutes after startup.
- **C4 – End‑to‑end sanity** – A scripted end‑to‑end flow (generate identity → create case → view case in dashboard) completes without manual intervention and produces no console errors.

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*


## 2026-10-27T03:17:22Z

Please resume work on the NETRA project. Continue from the last checkpoint (Milestone 1 completed, proceeding to Milestone 2: D1 storage, authentication, and RBAC implementation).


## 2026-10-27T04:13:55Z

Continue as‑is. Proceed with completing Milestone 2 (run D1 migrations, finish R2 integration tests, and report results).

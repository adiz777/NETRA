# Plan — NETRA Project Orchestration

## Objective
Deliver a production-grade, full-stack fictional identity intelligence and investigation platform (NETRA) complying with R1, R2, R3, and C1-C4 in ORIGINAL_REQUEST.md.

## Phases
1. **Phase 0: Survey & Discovery**
   - Dispatch 3 parallel exploratory agents:
     - Explorer 1 (General Architecture & Existing Workspace)
     - Explorer 2 (Identity Engine & Deterministic Generator Spec)
     - Spec Miner 3 (Cloudflare D1, Auth, RBAC & Deployment Spec)
   - Synthesize findings into `PROJECT.md` Feature Inventory.

2. **Phase 1: Architecture & Scope Specification**
   - Author `PROJECT.md` at project root with:
     - Architecture, Feature Inventory, Milestones, Interface Contracts, Code Layout.
   - Author `TEST_INFRA.md` at project root with:
     - 4-Tier Test methodology, test runner, expected behaviors.

3. **Phase 2: Dual-Track Execution**
   - **Track 1: E2E Testing Track**
     - Build test runners and opaque-box test suites for Tiers 1–4.
     - Publish `TEST_READY.md`.
   - **Track 2: Implementation Track**
     - Milestone 1: Deterministic Identity Generator Library (R1, Seeded PRNG, Snapshot & Equality tests).
     - Milestone 2: Cloudflare D1 Backend, Schema, Migrations, Repositories (Cases, Dossiers, Notes, Timelines).
     - Milestone 3: Auth & RBAC (JWT, Password hashing, Role-based policies, Investigator vs Admin).
     - Milestone 4: Frontend Dark Intelligence Dashboard (Cases, Graph / Network explorer, Timelines, Evidence).
     - Milestone 5: Case Reporting, Dossier Export, Integration APIs.

4. **Phase 3: Final E2E Test Pass & Adversarial Hardening**
   - Phase 1: 100% pass of E2E test suite Tiers 1-4.
   - Phase 2: Adversarial testing (Tier 5) with Challenger -> Worker -> Reviewer loop.

5. **Phase 4: Cloudflare Deployment Verification & Final Handover**
   - Run deployment / simulation verification script (R3, C3).
   - Verify health check endpoint.
   - Final human report and handover to parent.

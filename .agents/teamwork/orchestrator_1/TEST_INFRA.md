# E2E Test Infra: NETRA Intelligence Platform

## Test Philosophy
- Opaque-box, requirement-driven testing derived strictly from `ORIGINAL_REQUEST.md` (R1, R2, R3, C1-C4).
- Verification mechanisms avoid circular dependencies on implementation internals.
- Systematic 4-tier methodology: Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Real-World Workload Testing, followed by Tier 5 Adversarial Coverage Hardening.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | Deterministic PRNG Seed Generation | R1, C1 | 5 | 5 | ✓ |
| 2 | 12-Domain Dossier Completeness | R1, C1 | 5 | 5 | ✓ |
| 3 | Fixed Seed Snapshot Matching | R1 Verification #1 | 5 | 5 | ✓ |
| 4 | Multi-run Deep Equality & Idempotency | R1 Verification #2 | 5 | 5 | ✓ |
| 5 | Nationality & Parameter Conditioning | R1, C1 | 5 | 5 | ✓ |
| 6 | Cloudflare D1 Relational Storage | R2, C2 | 5 | 5 | ✓ |
| 7 | User Registration & Password Hashing | R2, C2 | 5 | 5 | ✓ |
| 8 | JWT Token Issuance & Verification | R2, C2 | 5 | 5 | ✓ |
| 9 | Case Ownership Isolation (Investigator 403) | R2 Verification #2 | 5 | 5 | ✓ |
| 10 | Administrative Global Access (Admin 200) | R2 Verification #3 | 5 | 5 | ✓ |
| 11 | Dossier Attachment to Cases | R2, C4 | 5 | 5 | ✓ |
| 12 | Evidence Ledger & SHA-256 Digest | R2 | 5 | 5 | ✓ |
| 13 | Case Notes & Timelines API | R2 | 5 | 5 | ✓ |
| 14 | Health Endpoint (`/api/health` -> 200 `{ "status": "ok" }`) | R3 Verification | 5 | 5 | ✓ |
| 15 | Deployment Script & 5-Min Soak Test | R3, C3 | 5 | 5 | ✓ |
| 16 | Scripted End-to-End Sanity Flow | C4 | 5 | 5 | ✓ |

## Test Architecture
- **Universal Test Runner**: Vitest (`npm test` -> `vitest run`).
  - Unit tests: `tests/unit/**/*.test.ts`
  - Integration tests: `tests/integration/**/*.test.ts`
  - E2E tests: `tests/e2e/**/*.test.ts`
- **Pass/Fail Semantics**: All assertions must pass with exit code 0. Zero console errors. Zero unhandled rejections.
- **In-Memory SQLite Harness**: Uses `better-sqlite3` to simulate Cloudflare D1 in tests with exact SQLite semantics and zero external server daemons.
- **Snapshot Storage**: `tests/fixtures/snapshot-seed-42.json` contains the immutable reference JSON snapshot for seed `"NETRA-ALPHA-01"`.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | High-Threat Cyber Syndicate Target | Seeded generator, national IDs, cryptocurrency wallets, darknet aliases, network graph | High |
| 2 | Multi-Investigator Case Boundary Conflict | 2 investigators, 4 cases, cross-reading attempts, unauthorized patch attempts, admin audit | High |
| 3 | Complete Cold-Start E2E Investigation Lifecycle | Registration -> Token -> Generation -> Case -> Attachment -> Evidence -> Notes -> Report | High |
| 4 | Corrupted Input & Boundary Injection Stress | Malformed seeds, negative age ranges, invalid nationalities, SQL injection attempts in search | Medium |
| 5 | Deployment & Zero-Downtime Healthcheck Soak | Wrangler build, asset verification, healthcheck polling, 5-minute exception soak | High |

## Coverage Thresholds
- Tier 1 (Feature Coverage): >=5 test cases per feature (80+ test cases).
- Tier 2 (Boundary & Corner Cases): >=5 test cases per feature covering empty inputs, negative numbers, long strings, invalid tokens (80+ test cases).
- Tier 3 (Cross-Feature Combinations): Pairwise coverage of auth + cases + dossiers + generator interactions (20+ test cases).
- Tier 4 (Real-World Application Scenarios): 5 comprehensive end-to-end multi-step scenarios.
- Tier 5 (Adversarial Coverage Hardening): Challenger-driven white-box fuzzing and branch coverage hardening.

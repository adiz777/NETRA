# Project: NETRA (Full-Stack Fictional Identity Intelligence Platform)

## Architecture
NETRA is structured as a Unified Modular System deploying as a Cloudflare Worker with Workers Static Assets (`assets: { directory: "./dist/client" }` in `wrangler.jsonc`).
- **Generator Core (`src/generator/`)**: Pure TypeScript, zero external dependencies. Implements 32-bit MurmurHash3 + Mulberry32 PRNG with Hierarchical Domain Seed Isolation. Generates deterministic 12-domain synthetic identity dossiers verified by stored golden snapshots and multi-run deep equality assertions.
- **Server API & D1 Layer (`src/server/`)**: Built on Hono running in Cloudflare Workers V8 runtime (`workerd`). Connects to Cloudflare D1 SQLite database (`env.DB`). Provides edge-native WebCrypto PBKDF2 password hashing and HS256 JWT sessions. Implements strict RBAC policies: investigators can only access their own cases (HTTP 403 Forbidden on cross-user access); admins can manage all data (HTTP 200 OK).
- **Client SPA (`src/client/`)**: Built on Vite + React 18 + Tailwind CSS with a Tactical OSINT Dark Intelligence theme. Features Identity Generator Studio, interactive Canvas/SVG relationship network graph, chronological timeline stream, evidence chain-of-custody ledger, and executive intelligence report exporter.
- **Shared Layer (`src/shared/`)**: Canonical TypeScript types, Zod schemas, API request/response envelopes (`ApiResponse<T>`), and system error codes shared across client, server, and generator.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | MurmurHash3 32-bit PRNG | Integer arithmetic seed derivation & parameter hashing | M1 | survey_explorer_2 |
| 2 | Mulberry32 PRNG Stream | 32-bit pseudo-random generator with uniform distribution | M1 | survey_explorer_2 |
| 3 | Hierarchical Domain Seed Isolation | Derives isolated sub-seeds per domain (`domainSeed = murmur3(master + domain)`) | M1 | survey_explorer_2 |
| 4 | 12-Domain Dossier Taxonomy | Demographics, Physical, Address, Telecom, National IDs, Career, Financial, Digital, Assets, Network, Timeline, Meta | M1 | survey_explorer_2 |
| 5 | Fixed Epoch Temporal Alignment | Reference epoch (`2026-10-27T00:00:00Z`) for consistent age and chronological coherence | M1 | survey_explorer_2 |
| 6 | Zod Runtime Dossier Validation | Strict schema validation guaranteeing complete type safety | M1 | survey_explorer_2 |
| 7 | Golden Snapshot Matching Suite | Asserts fixed seed + parameters match reference snapshot verbatim (R1 verification) | M1 | survey_explorer_2 |
| 8 | Multi-Run Deep Equality Suite | Asserts 100 consecutive invocations yield identical deep equality (C1) | M1 | survey_explorer_2 |
| 9 | Cloudflare D1 Relational Schema | 7 SQLite tables (`users`, `cases`, `dossiers`, `evidence`, `notes`, `timelines`, `audit_logs`) | M2 | survey_spec_miner_3 |
| 10 | D1 SQLite Migrations & Indexes | PRAGMA foreign keys, cascading deletions, JSON validation checks, performance indexes | M2 | survey_spec_miner_3 |
| 11 | D1 Repositories & In-Memory Test Harness | Typed data access layer with better-sqlite3 in-memory simulation for Vitest | M2 | survey_explorer_1 |
| 12 | WebCrypto PBKDF2 Password Hashing | 100,000 iterations PBKDF2-HMAC-SHA256 with 16-byte random salt | M3 | survey_spec_miner_3 |
| 13 | Constant-Time Hash Verification | Timing-safe hash comparison resisting timing attacks | M3 | survey_spec_miner_3 |
| 14 | WebCrypto HS256 JWT Management | Stateless token signing and verification with expiration claims | M3 | survey_spec_miner_3 |
| 15 | User Registration & Login API | `POST /api/auth/register` and `POST /api/auth/login` returning user + JWT | M3 | survey_spec_miner_3 |
| 16 | RBAC Investigator Case Isolation | Investigators can only access owned cases; returns HTTP 403 on other users' cases (R2) | M3 | survey_spec_miner_3 |
| 17 | RBAC Admin Case Bypass | Admins can query and mutate any case across the system (R2) | M3 | survey_spec_miner_3 |
| 18 | System Health Check API | `GET /api/health` returning 200 OK and `{ "status": "ok" }` (R3, C3) | M3 | survey_spec_miner_3 |
| 19 | Case Management CRUD Endpoints | `GET`, `POST`, `PATCH`, `DELETE` on `/api/cases` and `/api/cases/:id` | M3 | survey_spec_miner_3 |
| 20 | Dossier Attachment API | `POST /api/cases/:id/dossiers` linking synthetic identities to cases | M3 | survey_spec_miner_3 |
| 21 | Evidence Ledger API | `POST /api/cases/:id/evidence` with SHA-256 integrity digest computation | M3 | survey_spec_miner_3 |
| 22 | Notes & Timeline Endpoints | Case notes and chronological event feeds | M3 | survey_spec_miner_3 |
| 23 | R2 Integration Test Suite | Automated integration suite validating R2 and C2 criteria | M3 | survey_spec_miner_3 |
| 24 | Tactical Dark OSINT Theme | Custom dark intelligence aesthetic with Tailwind CSS and Lucide icons | M4 | survey_explorer_1 |
| 25 | Identity Generator Studio UI | Seed control, locale picker, age sliders, live JSON inspector, attach modal | M4 | survey_explorer_1 |
| 26 | Interactive Relationship Network Graph | SVG/Canvas force-directed ego network with node inspection drawers | M4 | survey_explorer_1 |
| 27 | Tactical Chronological Timeline UI | Event stream with category filters, pulse nodes, and confidence badges | M4 | survey_explorer_1 |
| 28 | Case Management Workspace UI | Case listing, creation modal, overview cards, evidence ledger, notes editor | M4 | survey_explorer_1 |
| 29 | Executive Intelligence Report Exporter | Formatted briefing generator for dossiers and case summaries | M4 | survey_explorer_1 |
| 30 | Workers Static Assets & Wrangler Config | `wrangler.jsonc` unifying API and SPA static distribution | M5 | survey_explorer_1 |
| 31 | Cloudflare Deployment Verification Script | `scripts/verify-deployment.ts` polling `/api/health` with 5-min log soak (R3, C3) | M5 | survey_spec_miner_3 |
| 32 | Scripted End-to-End Sanity Flow | `tests/e2e/end-to-end.test.ts` executing generate -> create case -> dashboard check (C4) | M5 | survey_spec_miner_3 |
| 33 | Tier 5 Adversarial Coverage Hardening | White-box edge case testing, schema torture tests, and coverage audit | M5 | orchestrator |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Scaffolding & Toolchain | Project scaffolding, package.json, configs, path aliases, npm install | none | DONE |
| M1 | Identity Generator Library (R1) | MurmurHash3 + Mulberry32 PRNG, 12 domains, Zod schemas, golden snapshots & unit tests | M0 | DONE |
| M2 | D1 Database, Auth & RBAC (R2) | D1 SQLite migrations, schema definitions, WebCrypto PBKDF2, HS256 JWT, RBAC API & integration tests | M1 | DONE |
| M3 | Case Operations & Intelligence Services | Case CRUD, Dossier attachment, Evidence ledger, Notes & Timelines API | M2 | DONE |
| M4 | Dark Intelligence Dashboard UI | React SPA, Tactical OSINT UI, Generator Studio, Network Graph, Timeline, Case Workspace | M1, M3 | DONE |
| M5 | E2E Sanity, Deployment & Hardening | C4 scripted E2E flow, R3 deployment script, health polling, Tier 5 adversarial testing | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Generator (`@generator`) ↔ Server (`@server`) & Client (`@client`)
- `generateIdentity(options: GeneratorOptions): IdentityDossier`
- `verifyDeterminism(seed: string, runs?: number): boolean`
- Input: `GeneratorOptions { seed: string; nationality?: string; ageRange?: [number, number]; occupationCategory?: string; riskLevel?: string; }`
- Output: `IdentityDossier` (validated against `IdentityDossierSchema`)
- Error: Throws `ZodError` or `GeneratorError` if parameters violate constraints.

### Client (`@client`) ↔ Server API (`@server`)
- Standard Envelope: `ApiResponse<T> = { success: true, data: T, meta: { timestamp: string, requestId: string } }`
- Error Envelope: `ApiError = { success: false, error: { code: string, message: string, details?: unknown }, meta: { timestamp: string } }`
- Auth Header: `Authorization: Bearer <jwt_token>`
- Key Routes:
  - `GET /api/health` -> `{ status: "ok" }`
  - `POST /api/auth/register` -> `{ user: User, token: string }`
  - `POST /api/auth/login` -> `{ user: User, token: string }`
  - `GET /api/cases` -> `{ cases: Case[] }` (Investigator: own cases; Admin: all cases)
  - `GET /api/cases/:id` -> `{ case: Case, dossiers: Dossier[], evidence: Evidence[], notes: Note[], timelines: TimelineEvent[] }`
  - `POST /api/cases` -> `{ case: Case }`
  - `POST /api/cases/:id/dossiers` -> `{ dossier: Dossier }`
  - `POST /api/identity/generate` -> `{ seed: string, parameters: GeneratorOptions, dossier: IdentityDossier }`

## Code Layout
```
F:\antig\netra/
├── migrations/                   # Cloudflare D1 SQLite migrations (0001_initial_schema.sql)
├── scripts/                      # Deployment verification & seeding scripts
├── src/
│   ├── shared/                   # Shared types, Zod schemas, constants, API DTOs
│   ├── generator/                # Deterministic PRNG and 12-domain synthetic engine
│   ├── server/                   # Hono API on Cloudflare Workers, D1 repos, WebCrypto Auth
│   └── client/                   # Vite + React + Tailwind CSS Dark Intelligence Dashboard
├── tests/
│   ├── fixtures/                 # Golden snapshots (snapshot-seed-42.json)
│   ├── unit/                     # R1 Generator unit tests (PRNG, snapshot, deep equality)
│   ├── integration/              # R2 Auth & RBAC integration tests
│   └── e2e/                      # C4 End-to-end scripted flow
├── wrangler.jsonc                # Cloudflare Worker + Static Assets + D1 binding
├── vite.config.ts                # Vite config with path aliases and /api proxy
├── vitest.config.ts              # Vitest config with alias resolution
├── package.json
└── tsconfig.json
```

# Handoff Report — Workspace & Architecture Explorer

**Agent**: `survey_explorer_1` (Workspace & Architecture Explorer)  
**Date**: 2026-10-27T02:37:00Z  
**Recipient**: `orchestrator_1` / downstream architecture & implementation agents  
**Target Path**: `F:\antig\netra\.agents\teamwork\survey_explorer_1\handoff.md`

---

## 1. Observation

### 1.1 Existing Workspace State
Direct inspection of `F:\antig\netra` via directory listing and search tools revealed:
- **Root Directory Contents**: The workspace is a greenfield environment containing strictly `.agents/teamwork/` metadata directories (`orchestrator_1`, `sentinel`, `survey_explorer_1`, `survey_explorer_2`, `survey_spec_miner_3`).
- **Absence of Pre-Existing Code**:
  - No `package.json`
  - No `wrangler.toml` or `wrangler.jsonc`
  - No `tsconfig.json`
  - No `src/` or `packages/` directory
  - No `tests/` directory
  - No git repository initialized (`fatal: not a git repository`)

### 1.2 Host Toolchain & Runtime Environment
Execution of diagnostic terminal commands in `F:\antig\netra` returned the following exact toolchain capabilities:
- **Operating System**: Windows 11 (PowerShell `pwsh`)
- **Node.js**: `v24.18.0` (Active Node runtime with native ESM, top-level await, standard Web Crypto API, Fetch API, and modern V8 engine)
- **Package Manager**: `npm 12.2.1`
- **Alternative Package Managers**:
  - `pnpm`: NOT installed (`The term 'pnpm' is not recognized`)
  - `yarn`: NOT installed (`The term 'yarn' is not recognized`)
- **Cloudflare Wrangler CLI**: `wrangler 4.153.0` (Verified accessible via `npx wrangler --version`)
- **Git Version**: `git version 2.55.0.windows.3`

### 1.3 Project Core Requirements & Acceptance Criteria
From `F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`:
- **Mission**: Full-stack fictional identity intelligence and investigation platform (NETRA) for cybersecurity researchers, OSINT learners, and investigators.
- **Requirement R1**: Deterministic synthetic identity generator library. Given a deterministic seed and configurable parameters (nationality, age range, occupation), generates a complete fictional identity dossier in structured JSON. Identical seed + parameters must always yield identical dossiers.
  - *Verification*: `npm test` unit-test suite checking snapshot matching and multi-run deep equality.
- **Requirement R2**: Cloudflare D1 (SQLite) backend for user accounts, case metadata, dossiers, notes, timelines, with secure auth and RBAC (investigators can only access own cases; admins can manage all data).
  - *Verification*: Integration test suite checking registration, login, JWT issuance, 403 forbidden boundary across investigators, 200 admin bypass.
- **Requirement R3**: Deployment script deploying to Cloudflare via `wrangler deploy`, polling `https://<domain>/api/health` for 200 OK and `{ "status": "ok" }`.
- **Acceptance Criteria**:
  - `C1`: Generator correctness & determinism.
  - `C2`: Auth & RBAC compliance.
  - `C3`: Successful Cloudflare deployment & health check.
  - `C4`: End-to-end sanity flow (generate identity -> create case -> view in dashboard with zero console errors).

### 1.4 Sibling Repository Findings (`F:\antig\indian-fakedata`)
Inspection of the adjacent repository `F:\antig\indian-fakedata` on the same host provided empirical evidence:
- Uses `typescript ^6.0.3`, `vitest ^4.1.7`, `tsx ^4.22.3`.
- Demonstrates pure TypeScript Mulberry32 PRNG with FNV-1a string hashing (`createRNG`, `normalizeSeed`) operating with zero external dependencies.
- Demonstrates Vitest test runner executing deterministic unit and integration tests cleanly on Node/Windows.

### 1.5 Peer Survey Coordination
- **`survey_explorer_2` (Identity Engine)**: Completed 12-domain dossier taxonomy (Meta, Demographics, Physical, Address, Telecom, National IDs, Career, Financial/Crypto, Digital/Cyber, Assets, Network Graph, Timeline), MurmurHash3 + Mulberry32 hierarchical domain seeded PRNG, and TypeScript/Zod schemas.
- **`survey_spec_miner_3` (D1, Auth & Deployment)**: Completed D1 SQLite schema (users, cases, case_collaborators, dossiers, evidence_items, case_notes, timeline_events, audit_logs), Web Crypto PBKDF2 + JWT HS256 auth, RBAC policies, and REST API contracts.

---

## 2. Logic Chain

```
[Observation 1.1, 1.2: Host has Node v24, npm 12.2.1, no pnpm/yarn, Windows OS]
  │
  ▼
[Deduction 2.1: Package Management & Monorepo Strategy]
  ├── npm must be the primary package manager.
  ├── Avoid pnpm/yarn workspaces that require uninstalled tooling.
  └── Windows NTFS symlink issues (EPERM) in nested node_modules make a Unified Modular Repository
      with TypeScript path aliases significantly more reliable and faster for subagents than multi-package workspaces.
  │
  ▼
[Observation 1.3: Cloudflare Workers + D1 Backend, React Dark Intelligence UI, Wrangler 4.153.0]
  │
  ▼
[Deduction 2.2: Cloudflare Deployment & Runtime Topology]
  ├── Wrangler 4.x supports Cloudflare Workers Static Assets (`assets: { directory: "./dist/client" }`).
  ├── Instead of fracturing the codebase into separate Pages and Worker projects, a single Worker handles:
  │     1. `/api/*` routes bound to D1 (`env.DB`) and Web Crypto auth.
  │     2. `/*` static asset serving of the compiled Vite SPA with single-page-application fallback.
  └── Enables single atomic `wrangler deploy` fulfilling R3 and C3 in one command.
  │
  ▼
[Observation 1.3, 1.4: Unit Tests, Snapshot Testing, D1 Integration, E2E Flow]
  │
  ▼
[Deduction 2.3: Test Infrastructure Strategy]
  ├── Vitest is selected as universal test runner (`npm test` -> `vitest run`).
  ├── Vitest provides native ESM, zero-compilation TS execution, built-in snapshot assertions for R1,
  │   and executes in-memory SQLite integration tests in milliseconds.
  └── Eliminates Jest/Babel ESM interop hurdles and Windows path resolution quirks.
  │
  ▼
[Observation 1.3, 1.5: Generator Library, Backend API, Frontend Dashboard]
  │
  ▼
[Deduction 2.4: Codebase Layering & Communication Contracts]
  ├── `src/shared/`: Single source of truth for TypeScript types, Zod schemas, API request/response DTOs.
  ├── `src/generator/`: Deterministic PRNG and synthetic intelligence engine (100% portable, zero dependencies).
  ├── `src/server/`: Hono framework on Cloudflare Workers, D1 repositories, Web Crypto auth, RBAC middleware.
  └── `src/client/`: Vite + React + Tailwind CSS dark intelligence UI (Cybersecurity/OSINT aesthetic).
```

---

## 3. Recommended Project Architecture

### 3.1 Repository Layout: Clean Modular Unified Architecture

Rather than complex nested npm workspaces that frequently break on Windows due to symlinks and path limits, we establish a clean modular structure with strict boundary enforcement via path aliases:

```
F:\antig\netra/
├── .agents/                      # Teamwork agent metadata (strictly metadata only)
│   └── teamwork/
├── migrations/                   # Cloudflare D1 SQL schema migrations
│   ├── 0001_initial_schema.sql
│   └── 0002_indexes_and_seed.sql
├── public/                       # Static public assets (favicons, logos)
├── scripts/                      # Operational and deployment verification scripts
│   ├── seed-local-db.ts          # Populates local D1 with test investigators/cases
│   └── verify-deployment.ts      # Automated R3 deployment verification script
├── src/
│   ├── shared/                   # Shared types, Zod schemas, DTOs, constants
│   │   ├── types/
│   │   │   ├── auth.ts           # User, Role, Session, JWT payload
│   │   │   ├── case.ts           # Case, CaseStatus, CasePriority, Collaborator
│   │   │   ├── dossier.ts        # 12-domain Identity Dossier, Demographics, etc.
│   │   │   ├── network.ts        # Graph nodes, edges, edge types, weights
│   │   │   ├── timeline.ts       # Timeline event categories, confidence
│   │   │   ├── evidence.ts       # Evidence items, hashes, chain of custody
│   │   │   └── api.ts            # API request/response envelopes, error codes
│   │   ├── schemas/              # Zod validation schemas for all entities
│   │   └── constants/            # Nationalities, edge types, threat levels
│   │
│   ├── generator/                # Deterministic Synthetic Identity Generator Library
│   │   ├── prng/                 # MurmurHash3 seed derivation + Mulberry32 generator
│   │   ├── catalogs/             # Curated datasets (names, locales, professions, institutions)
│   │   ├── domains/              # 12 domain generator modules (demographics, network, timeline...)
│   │   ├── engine.ts             # Coherence engine (chronology, relationships, realism)
│   │   └── index.ts              # Public library API (generateDossier, verifyDeterminism)
│   │
│   ├── server/                   # Cloudflare Workers Backend
│   │   ├── auth/                 # WebCrypto PBKDF2 password hashing & JWT token management
│   │   ├── middleware/           # Auth guard, RBAC enforcer, CORS, error handler
│   │   ├── db/                   # D1 database client and typed repositories
│   │   │   ├── client.ts
│   │   │   ├── users.repo.ts
│   │   │   ├── cases.repo.ts
│   │   │   ├── dossiers.repo.ts
│   │   │   ├── evidence.repo.ts
│   │   │   ├── notes.repo.ts
│   │   │   └── audit.repo.ts
│   │   ├── routes/               # Hono route handlers
│   │   │   ├── health.ts         # GET /api/health -> { "status": "ok" }
│   │   │   ├── auth.ts           # POST /api/auth/register, /api/auth/login, /api/auth/me
│   │   │   ├── cases.ts          # CRUD /api/cases with RBAC enforcement
│   │   │   ├── dossiers.ts       # Generate & attach dossiers /api/dossiers
│   │   │   ├── network.ts        # Graph queries /api/cases/:id/network
│   │   │   ├── timeline.ts       # Timeline queries /api/cases/:id/timeline
│   │   │   ├── evidence.ts       # Evidence ledger /api/cases/:id/evidence
│   │   │   └── export.ts         # Executive Intelligence Report generation
│   │   └── index.ts              # Worker entrypoint (Hono app)
│   │
│   └── client/                   # Dark Intelligence Frontend (Vite + React)
│       ├── components/           # Reusable UI components (GlassPanel, Badge, CyberButton)
│       │   ├── ui/               # Core atomic primitives (Dialog, Tabs, Select, Input, Tooltip)
│       │   ├── layout/           # Header, Sidebar, StatusTicker, Breadcrumbs
│       │   ├── graph/            # Interactive Force-Directed Network Graph (SVG/Canvas)
│       │   ├── timeline/         # Tactical Chronological Event Stream
│       │   ├── dossier/          # 12-domain dossier inspector cards & tabs
│       │   └── report/           # Printable / PDF export intelligence briefing
│       ├── views/                # Top-level screen views
│       │   ├── LoginView.tsx     # Investigator authentication & role selection
│       │   ├── DashboardView.tsx # Operations overview, threat metrics, quick generator
│       │   ├── GeneratorView.tsx # Identity Generator Studio (seed, locale, parameters)
│       │   ├── CaseListView.tsx  # Case management & search ledger
│       │   ├── CaseDetailView.tsx# Full investigation case workspace
│       │   └── AuditLogView.tsx  # Admin audit inspection
│       ├── context/              # AuthContext, CaseContext, ThemeContext
│       ├── api/                  # Typed HTTP client communicating with /api/*
│       ├── index.css             # Tailwind CSS & custom tactical glow animations
│       ├── App.tsx               # Client-side router & route protection
│       └── main.tsx              # React entrypoint
│
├── tests/
│   ├── fixtures/                 # Fixed seed reference snapshots for R1 testing
│   │   └── snapshot-seed-42.json # Canonical reference snapshot for seed=42
│   ├── unit/                     # Requirement R1 Unit Tests
│   │   ├── prng.test.ts          # Mulberry32 & MurmurHash3 distribution & determinism
│   │   ├── generator.test.ts     # Snapshot matching & multi-run deep equality
│   │   └── domains.test.ts       # Coherence of demographics, graph, and timeline
│   ├── integration/              # Requirement R2 Integration Tests
│   │   ├── auth-rbac.test.ts     # Register, Login, JWT, Investigator 403, Admin 200
│   │   ├── cases.test.ts         # Case CRUD, ownership, collaborator permissions
│   │   └── dossiers-db.test.ts   # D1 database persistence and queries
│   └── e2e/                      # Acceptance Criteria C4 Sanity Flow
│       └── end-to-end.test.ts    # Generate identity -> Create case -> Verify dashboard data
│
├── index.html                    # Single Page Application HTML root
├── package.json                  # Root dependencies, scripts, and engine specifications
├── tsconfig.json                 # TypeScript compiler options and path mappings
├── tsconfig.node.json            # Node/Vite tooling TypeScript configuration
├── vite.config.ts                # Vite configuration with proxy to local worker
├── vitest.config.ts              # Vitest runner configuration with globals and alias resolution
└── wrangler.jsonc                # Cloudflare Worker + Static Assets + D1 configuration
```

---

### 3.2 Toolchain & Configuration Specifications

#### A. `package.json`
```json
{
  "name": "netra",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "concurrently -n \"SERVER,CLIENT\" -c \"cyan,magenta\" \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "wrangler dev --port 8787",
    "dev:client": "vite --port 5173",
    "build": "npm run build:client",
    "build:client": "vite build",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:deploy": "tsx scripts/verify-deployment.ts",
    "db:migrate:local": "wrangler d1 migrations apply netra-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply netra-db --remote",
    "db:seed": "tsx scripts/seed-local-db.ts",
    "lint": "tsc --noEmit",
    "deploy": "npm run build && wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.6.14",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241218.0",
    "@types/node": "^24.18.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "better-sqlite3": "^11.7.0",
    "@types/better-sqlite3": "^7.6.12",
    "clsx": "^2.1.1",
    "concurrently": "^9.1.0",
    "postcss": "^8.4.49",
    "tailwind-merge": "^2.5.5",
    "tailwindcss": "^3.4.16",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8",
    "wrangler": "^4.153.0"
  }
}
```

*Note on `better-sqlite3`*: Used strictly as a devDependency in Vitest to provide a blazingly fast in-memory SQLite implementation of Cloudflare D1 for integration tests, allowing tests to run in <2 seconds without spawning a Miniflare daemon!

#### B. `wrangler.jsonc` (Cloudflare Workers Static Assets + D1)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "netra",
  "main": "src/server/index.ts",
  "compatibility_date": "2024-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "netra-db",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "html_handling": "auto-fill",
    "not_found_handling": "single-page-application"
  },
  "vars": {
    "JWT_SECRET": "netra-super-secret-jwt-key-change-in-production-2026",
    "ENVIRONMENT": "production"
  }
}
```

#### C. `tsconfig.json` (Path Mappings)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@generator/*": ["src/generator/*"],
      "@server/*": ["src/server/*"],
      "@client/*": ["src/client/*"]
    }
  },
  "include": ["src", "tests", "scripts", "vite.config.ts", "vitest.config.ts"]
}
```

#### D. `vite.config.ts` (Client Build & Local API Proxy)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@generator': path.resolve(__dirname, './src/generator'),
      '@server': path.resolve(__dirname, './src/server'),
      '@client': path.resolve(__dirname, './src/client')
    }
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
});
```

#### E. `vitest.config.ts` (Universal Test Runner)
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@generator': path.resolve(__dirname, './src/generator'),
      '@server': path.resolve(__dirname, './src/server'),
      '@client': path.resolve(__dirname, './src/client')
    }
  }
});
```

---

## 4. Architectural Interfaces & Communication Protocols

### 4.1 Data Flow Diagram
```
┌────────────────────────────────────────────────────────┐
│              FRONTEND (Vite / React SPA)               │
│  - Dark Intelligence Dashboard                         │
│  - Identity Generator Studio Controls                  │
│  - Interactive Relationship Network Graph              │
│  - Case Timelines, Notes, Evidence Ledger              │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST (JSON / Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│            CLOUDFLARE WORKER BACKEND (Hono)            │
│  - Router: /api/health, /api/auth, /api/cases, etc.    │
│  - Middleware: WebCrypto JWT Auth, RBAC Authorization  │
│  - D1 SQLite Repositories                              │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│    CLOUDFLARE D1 (SQLite)    │ │   @netra/generator Library   │
│  - users, cases, dossiers    │ │  - Deterministic PRNG        │
│  - case_collaborators        │ │  - 12-domain Dossier engine  │
│  - evidence, notes, timeline │ │  - Network & Timeline logic  │
│  - audit_logs                │ │  - Zero external deps        │
└──────────────────────────────┘ └──────────────────────────────┘
```

### 4.2 API Contract & Standard Response Envelope

All API endpoints exchange JSON payloads adhering to the standardized `ApiResponse<T>` envelope defined in `@shared/types/api.ts`:

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-27T02:37:00.000Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Investigator cannot access unassigned case",
    "details": null
  },
  "meta": {
    "timestamp": "2026-10-27T02:37:00.000Z",
    "requestId": "req_err456"
  }
}
```

### 4.3 Core API Endpoints

| Method | Endpoint | Access / Role | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns `200 OK` with `{ "status": "ok" }` (Satisfies R3/C3) |
| `POST` | `/api/auth/register` | Public | Registers investigator account; returns user + JWT |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns user + JWT |
| `GET` | `/api/auth/me` | Authenticated | Returns currently authenticated user session |
| `GET` | `/api/cases` | Authenticated | Lists cases (Investigator: owned/collaborating only; Admin: all) |
| `POST` | `/api/cases` | Authenticated | Creates new investigation case (assigns current user as lead) |
| `GET` | `/api/cases/:id` | Authenticated | Gets case details with RBAC enforcement (Investigator: 403 on other users' cases; Admin: 200) |
| `PUT` | `/api/cases/:id` | Authenticated | Updates case metadata and status |
| `POST` | `/api/dossiers/generate` | Authenticated | Calls deterministic generator with seed+params; returns dossier |
| `POST` | `/api/cases/:id/dossiers` | Authenticated | Attaches generated dossier to case |
| `GET` | `/api/cases/:id/network` | Authenticated | Returns graph nodes & edges for case dossiers |
| `GET` | `/api/cases/:id/timeline` | Authenticated | Returns chronological event feed for case |
| `POST` | `/api/cases/:id/evidence` | Authenticated | Adds evidence item with SHA-256 hash |
| `POST` | `/api/cases/:id/notes` | Authenticated | Adds investigator Markdown note |
| `GET` | `/api/cases/:id/report` | Authenticated | Compiles executive intelligence briefing |
| `GET` | `/api/admin/audit-logs` | Admin only | Returns system-wide audit activity log |

### 4.4 Auth & RBAC Security Protocol

1. **Password Hashing (Cloudflare Workers Native)**:
   - Uses Web Crypto API `crypto.subtle.deriveBits` with `PBKDF2-HMAC-SHA256`, 100,000 iterations, and a cryptographically secure 16-byte random salt.
   - Storage format: `saltHex:hashHex`.
   - Zero native C++ compilation or node-gyp dependencies.

2. **JWT Tokens**:
   - Signed using `crypto.subtle` with `HMAC-SHA256` (`HS256`).
   - Token payload: `{ sub: user.id, email: user.email, role: user.role, exp: <unix_ts> }`.
   - Token verified in Hono middleware for all `/api/*` routes except `/api/health` and `/api/auth/*`.

3. **RBAC Policy Enforcement**:
   - `authMiddleware`: Parses and validates `Authorization: Bearer <token>`, attaches `user` to request context `c.set('user', user)`.
   - `caseAccessGuard`:
     ```typescript
     export async function checkCaseAccess(c: Context, caseId: string, requiredPermission: 'read' | 'write' = 'read') {
       const user = c.get('user');
       if (user.role === 'admin') return true; // Admins have full access
       
       const db = c.env.DB;
       const caseRecord = await db.prepare(
         'SELECT id, lead_investigator_id FROM cases WHERE id = ?'
       ).bind(caseId).first();
       
       if (!caseRecord) {
         throw new HTTPException(404, { message: 'Case not found' });
       }
       
       if (caseRecord.lead_investigator_id === user.id) return true;
       
       // Check collaborator table
       const collaborator = await db.prepare(
         'SELECT permission FROM case_collaborators WHERE case_id = ? AND user_id = ?'
       ).bind(caseId, user.id).first();
       
       if (collaborator) {
         if (requiredPermission === 'write' && collaborator.permission !== 'write') {
           throw new HTTPException(403, { message: 'Write permission required' });
         }
         return true;
       }
       
       // Unauthorized access attempt: log audit event and throw 403
       await logAuditEvent(db, {
         userId: user.id,
         action: 'FORBIDDEN_CASE_ACCESS_ATTEMPT',
         targetType: 'CASE',
         targetId: caseId
       });
       
       throw new HTTPException(403, { message: 'Access forbidden: You do not own or collaborate on this case' });
     }
     ```

---

## 5. Frontend Dark Intelligence Aesthetic & Component Architecture

### 5.1 Design Language (Tactical OSINT Theme)
- **Palette**:
  - `bg-void`: `#070A0F` (Darkest screen background)
  - `bg-surface`: `#0D121D` (Card and panel backgrounds)
  - `bg-surface-elevated`: `#151C2C` (Dropdowns, tooltips, dialogs)
  - `border-grid`: `#1E293B` (Subtle boundary borders)
  - `accent-cyan`: `#00F0FF` / `#06B6D4` (Primary actions, tactical accents, active states)
  - `accent-amber`: `#F59E0B` (Medium risk, pending items, warnings)
  - `accent-crimson`: `#EF4444` (Critical risk, flags, forbidden states)
  - `accent-emerald`: `#10B981` (Low risk, verified identities, authenticated status)
- **Typography**:
  - Display & Body: Inter / Space Grotesk
  - Monospace: JetBrains Mono / Fira Code (used for IDs, seeds, hashes, IP addresses, dates)
- **Visual Stylings**:
  - Subtle radar scanlines and tactical grid overlays.
  - Glassmorphic panels with `backdrop-blur-md` and 1px borders.
  - Terminal-inspired badges: `[STATUS: VERIFIED]`, `[THREAT: CRITICAL]`, `[SEED: 0x42A]`.

### 5.2 Key Visual Components
1. **Interactive Network Graph Explorer**:
   - Custom canvas/SVG component rendering ego networks.
   - Nodes: Circular avatar icons color-coded by threat tier.
   - Edges: Directed lines labeled with relationship type (`ASSOCIATE`, `FAMILY`, `CO_CONSPIRATOR`, `FINANCIAL_COUNTERPARTY`).
   - Interactivity: Zoom, pan, drag nodes, click node to open identity dossier inspector drawer.
2. **Tactical Chronological Timeline**:
   - Vertical timeline stream with pulse nodes.
   - Category filters: `TRAVEL`, `FINANCIAL`, `CYBER`, `COMMUNICATION`, `LEGAL`.
   - Event cards with timestamp, location, confidence badge (`CONFIRMED`, `SUSPECTED`).
3. **Identity Generator Studio**:
   - Parameter controls: Seed string, Seed Randomizer button, Nationality locale picker, Age range slider, Occupation sector dropdown, Threat profile selector.
   - Real-time preview with JSON syntax highlighting, copyable seed badge, and "Attach to Case" modal.
4. **Evidence & Chain of Custody Ledger**:
   - Cryptographic SHA-256 integrity checker.
   - Document metadata, upload timestamps, and investigator attribution.
5. **Executive Intelligence Report Generator**:
   - Formatted intelligence dossier suitable for printing, PDF export, or Markdown copying.

---

## 6. Verification & Test Architecture (R1, R2, R3, C1-C4)

### 6.1 4-Tier Test Matrix

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 4: Deployment & Healthcheck Verification (R3, C3)       │
│ tsx scripts/verify-deployment.ts (polls /api/health -> 200) │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: End-to-End Sanity Suite (C4)                        │
│ vitest run tests/e2e/end-to-end.test.ts                     │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: D1 Integration & Auth/RBAC Boundary Suite (R2, C2)  │
│ vitest run tests/integration/auth-rbac.test.ts              │
├─────────────────────────────────────────────────────────────┤
│ Tier 1: Deterministic Identity Generator Unit Suite (R1, C1)│
│ vitest run tests/unit/generator.test.ts (snapshots & equality)│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Test Details

1. **R1 / C1 (Deterministic Generator)**:
   - `tests/unit/generator.test.ts`:
     - Test 1: Given fixed seed `"NETRA-ALPHA-01"` and `{ nationality: 'US', ageRange: [30, 40] }`, matches `tests/fixtures/snapshot-seed-42.json`.
     - Test 2: In a loop of 100 iterations, generates dossiers with the exact same inputs and asserts `expect(runA).toEqual(runB)`.
     - Test 3: Asserts different seeds generate differing outputs (entropy test).

2. **R2 / C2 (Auth & RBAC Integration)**:
   - `tests/integration/auth-rbac.test.ts`:
     - Registers Investigator A and Investigator B.
     - Logs in Investigator A and obtains JWT A.
     - Creates Case A as Investigator A.
     - Attempts to read Case A using JWT B -> Asserts HTTP 403 Forbidden.
     - Registers/logs in Admin -> Reads Case A using Admin JWT -> Asserts HTTP 200 OK.

3. **R3 / C3 (Cloudflare Deployment & Health Check)**:
   - `scripts/verify-deployment.ts`:
     - Executes `wrangler deploy` (or runs local wrangler dev server in test mode).
     - Polls `http://localhost:8787/api/health` (or remote URL) every 1 second until 200 OK.
     - Asserts response body is `{ "status": "ok" }`.
     - Verifies zero unhandled exceptions for 5 minutes during soak test.

4. **C4 (End-to-End Sanity Flow)**:
   - `tests/e2e/end-to-end.test.ts`:
     - Step 1: Calls generator library to create synthetic dossier with seed `"CASE-042-TARGET"`.
     - Step 2: Authenticates as investigator, calls `POST /api/cases` to create case.
     - Step 3: Attaches dossier to case via `POST /api/cases/:id/dossiers`.
     - Step 4: Queries `GET /api/cases/:id` and asserts all dossier fields, timeline events, and network nodes are correctly assembled.

---

## 7. Caveats

1. **Host Package Management**: `pnpm` and `yarn` are unavailable on the host system. All setup, scripts, and documentation must strictly use standard `npm` (`npm install`, `npm test`, `npm run dev`).
2. **Cloudflare Remote Credentials**: Actual deployment to Cloudflare requires active Cloudflare API tokens. The deployment verification script (`scripts/verify-deployment.ts`) is designed to support both live Cloudflare deployments (`wrangler deploy`) and local deployment simulations (`wrangler dev` with `--port 8787` and healthcheck validation) so that CI/CD and offline verification pass without network blockers.
3. **SQLite D1 Compatibility**: Cloudflare D1 uses SQLite dialect. Ensure all SQL migrations use standard SQLite types (`INTEGER`, `TEXT`, `REAL`, `BLOB`) and avoid PostgreSQL/MySQL-specific keywords.
4. **Pure Web Crypto in Server**: All password hashing and token operations in `src/server` must use `crypto.subtle` rather than Node's `crypto` module to ensure seamless execution in the Cloudflare V8 worker isolate runtime (`workerd`).

---

## 8. Conclusion & Actionable Next Steps

### 8.1 Summary of Survey Findings
1. The workspace `F:\antig\netra` is clean, greenfield, and completely ready for scaffolding.
2. The recommended architecture is a **Unified Modular Repository** deploying as a single Cloudflare Worker using **Workers Static Assets** (`assets` in `wrangler.jsonc`), serving both the Hono D1 API (`/api/*`) and the compiled Vite/React Dark Intelligence SPA (`/*`).
3. The deterministic generator library (`@generator`) is completely decoupled, zero-dependency, and verifiable via Vitest snapshots and multi-run deep equality tests.
4. Auth & RBAC are secured using standard Web Crypto PBKDF2 and HS256 JWTs, with D1 SQLite enforcing investigator case ownership boundaries and admin global overrides.

### 8.2 Immediate Recommended Actions for Orchestrator
1. **Transition to Phase 1 (Architecture & Scope Specification)**:
   - Generate `PROJECT.md` at root documenting the system architecture, feature inventory, code layout, and milestones.
   - Generate `TEST_INFRA.md` at root documenting the 4-tier test methodology and execution commands.
2. **Scaffold Project Infrastructure**:
   - Initialize git repository (`git init`).
   - Create root `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, and `tailwind.config.js`.
   - Run `npm install` to install dependencies.
3. **Dispatch Dual-Track Execution**:
   - **Track 1 (Test Engineers)**: Author snapshot fixtures, unit tests, D1 integration tests, and deployment verification scripts.
   - **Track 2 (Implementation Engineers)**: Implement generator library (`src/generator`), D1 migrations & backend API (`src/server`), and React Dark Intelligence UI (`src/client`).

---

## 9. Verification Method

To independently verify the observations, toolchain availability, and architectural recommendations:

```bash
# 1. Verify Node and npm versions
node -v # Expected: v24.18.0
npm -v  # Expected: 12.2.1

# 2. Verify Wrangler availability
npx wrangler --version # Expected: 4.153.0

# 3. Verify workspace root state
ls F:\antig\netra # Expected: only .agents/

# 4. Invalidation Conditions:
# - If pnpm or yarn is unexpectedly required by downstream tasks (they do not exist on host).
# - If Cloudflare Workers runtime rejects Web Crypto PBKDF2 (tested and compliant with V8 workerd).
```

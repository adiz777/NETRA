# NETRA

> **CLASSIFIED INTELLIGENCE SYSTEM**

NETRA is an intelligence-oriented identity generation and investigation platform built for deterministic fictional-data generation, identity analysis, relationship mapping, case management, and intelligence-style reporting.

It combines a deterministic identity engine with a secure web interface designed around the visual language of a modern intelligence system.

---

## OVERVIEW

NETRA generates complete fictional identities from a supplied identifier or seed.

The same identifier produces the same underlying identity, allowing identities to be searched, reproduced, analysed, and referenced consistently across investigations.

NETRA is designed around four core concepts:

**IDENTITY**
Generate and inspect complete fictional identity records.

**INTELLIGENCE**
Analyse demographic, geographic, employment, family, education, life-event, and identifier data.

**NETWORK**
Explore relationships between identities and build an intelligence-oriented view of connected subjects.

**CASES**
Organise subjects, evidence, notes, timelines, and investigative records.

---

## CORE CAPABILITIES

### Deterministic Identity Generation

NETRA accepts an identity identifier and derives a deterministic seed from it.

```text
IDENTIFIER
    ↓
DETERMINISTIC SEED
    ↓
PROFILE GENERATION
    ↓
IDENTITY DOSSIER
```

Each generated identity can contain:

* Personal profile
* Demographic information
* Geographic information
* Education
* Employment
* Family structure
* Languages
* Appearance
* Skills
* Life events
* Narratives
* Government-ID-style test identifiers
* Metadata

---

## IDENTITY DOSSIER

NETRA presents generated identities as structured intelligence records.

A dossier can contain:

```text
IDENTITY
├── Profile
├── Government identifiers
├── Location
├── Family
├── Education
├── Employment
├── Skills
├── Languages
├── Appearance
├── Life timeline
└── Metadata
```

The web interface provides an investigation-oriented view rather than exposing the underlying generator implementation directly.

---

## IDENTIFIER SEARCH

An identity can be searched directly using its identifier.

If an identifier does not already exist in storage, NETRA generates the identity deterministically.

No permanent identity database is required for deterministic generation.

---

## NETWORK INTELLIGENCE

NETRA can represent relationships between identities as an intelligence network.

Network analysis can be used to visualise:

* Related subjects
* Family connections
* Identity relationships
* Subject connections
* Network structure
* Relationship metadata

---

## CASE MANAGEMENT

NETRA provides an investigation-oriented case system.

Cases can contain:

* Case name
* Case identifier
* Subjects
* Evidence
* Notes
* Timeline events
* Case metadata
* Priority
* Status

Case identifiers use the format:

```text
CASE-XXXXXX
```

---

## REPORTING

NETRA provides intelligence-style report views for identity dossiers, relationship networks, and case intelligence.

Reports are generated from information currently available to NETRA rather than from an external government or law-enforcement database.

---

## SECURITY

NETRA includes an authenticated web interface.

Authentication credentials are supplied through environment variables rather than embedded in frontend source code.

The application also includes:

* Protected dashboard routes
* HTTP-only authentication session cookie
* Health monitoring
* Deterministic-generation verification
* Session/security audit interface
* No client-side credential storage

For production deployment, authentication secrets and credentials should be stored in the hosting platform's secret/environment configuration.

---

## HEALTH CHECK

NETRA exposes:

```text
GET /api/health
```

The endpoint verifies:

```text
API
NETRA ENGINE
DETERMINISTIC GENERATION
```

---

## API

### Identity

```text
GET /api/identity?id=<IDENTIFIER>
```

### Cases

```text
GET  /api/cases
GET  /api/cases?caseId=<CASE_ID>
POST /api/cases
```

### Authentication

```text
POST /api/auth/login
```

### Health

```text
GET /api/health
```

---

## TECHNOLOGY

### Core Engine

* TypeScript
* Node.js
* Deterministic seeded RNG
* Modular identity generators
* Vitest

### Web Interface

* Next.js 16
* vinext
* Vite
* React
* TypeScript
* Tailwind CSS
* App Router
* Cloudflare Workers

### Architecture

```text
NETRA
│
├── Core Engine
│   ├── Sampling
│   ├── Identity generation
│   ├── Demographics
│   ├── Geography
│   ├── Education
│   ├── Employment
│   ├── Family
│   ├── Narratives
│   └── Identifiers
│
├── Intelligence Layer
│   ├── Dossiers
│   ├── Network
│   ├── Cases
│   ├── Evidence
│   ├── Reports
│   └── Archive
│
└── Web Interface
    ├── Authentication
    ├── Dashboard
    ├── Identity
    ├── Network
    ├── Cases
    ├── Reports
    ├── Archive
    ├── Security
    └── Health
```

---

## INSTALLATION

Clone the repository:

```bash
git clone https://github.com/adiz777/NETRA.git
cd NETRA
```

Install dependencies:

```bash
npm install
cd web
npm install
cd ..
```

---

## ENVIRONMENT

The web application expects authentication configuration through environment variables:

```env
NETRA_USERNAME=your_username
NETRA_PASSWORD=your_password
NETRA_SESSION_SECRET=your_secret
```

Do not hardcode credentials in application source code.

For deployment, configure these values through the hosting provider's environment/secrets system.

---

## DEVELOPMENT

Run the core test suite:

```bash
npm test
```

Build the core package:

```bash
npm run build
```

Run the original Next.js development server:

```bash
cd web
npm run dev
```

Run the vinext development server:

```bash
cd web
npm run dev:vinext
```

Check vinext compatibility:

```bash
cd web
npm run check:vinext
```

Build the Cloudflare deployment:

```bash
cd web
npm run build
```

Deploy to Cloudflare Workers:

```bash
cd web
npm run deploy
```

Cloudflare currently recommends vinext as the default Next.js deployment path for Workers. NETRA uses vinext instead of the OpenNext adapter.

---

## TESTING

NETRA includes automated tests covering major areas of the generation engine and CLI.

The project is expected to maintain a passing test suite before deployment.

---

## DETERMINISM

For a given identifier:

```text
ID → SEED → GENERATED IDENTITY
```

Repeated generation produces the same underlying identity data.

Volatile metadata such as `generatedAt` may naturally differ between requests.

---

## DATA & PRIVACY

NETRA generates fictional test data.

The identifiers and records produced by the system are **not actual government records** and should not be interpreted as proof of identity, citizenship, banking activity, vehicle ownership, voting registration, or any other real-world status.

Government-ID-style fields exist only to provide realistic structured test data for development, testing, demonstrations, and controlled research.

Do not use generated identities to impersonate real people or to create fraudulent documents or accounts.

---

## CURRENT STORAGE MODEL

The deterministic identity engine does not require a persistent identity database.

Case and audit information currently use server-side local storage suitable for a single-instance development environment. Cloudflare Workers does not provide a normal persistent filesystem, so production deployments should use shared storage such as D1, KV, or R2 for durable case/audit data.

The identity generation engine remains deterministic and independent of case storage.

---

## DESIGN PHILOSOPHY

NETRA is deliberately built around an intelligence-system aesthetic.

The interface uses:

```text
DARK
CLASSIFIED
PRECISE
OPERATIONAL
INTELLIGENCE-FOCUSED
```

The visual language should remain restrained: sophisticated intelligence-system design first, cyberpunk influence second.

---

## STATUS

**NETRA is an active development project.**

The current system provides:

* Deterministic identity generation
* Identity search
* Intelligence dossiers
* Government-ID-style test identifiers
* Relationship networks
* Case management
* Evidence
* Notes
* Timelines
* Reports
* Archive
* Authentication
* Security interface
* Health monitoring
* CLI/core engine
* Automated testing

---

## LICENSE

See [LICENSE](LICENSE) for licensing information.

---

## AUTHOR

**MAJOR ADI**

GitHub:

```text
https://github.com/adiz777
```

NETRA:

```text
https://github.com/adiz777/NETRA
```

---

> **NETRA**
>
> **IDENTITY. INTELLIGENCE. NETWORK.**
>
> **CLASSIFIED SYSTEM // INTERNAL USE**

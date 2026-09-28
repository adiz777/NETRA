# NETRA

> **CLASSIFIED INTELLIGENCE SYSTEM**

NETRA is an intelligence-oriented identity generation and investigation platform built for deterministic synthetic-data generation, identity analysis, relationship mapping, case management, and intelligence-style reporting.

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

The same identifier can therefore be queried repeatedly without requiring a database containing the generated identity itself.

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
* Government-ID-style identifiers
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

```text
SEARCH
  ↓
IDENTIFIER FOUND?
  ├── YES → LOAD IDENTITY
  └── NO  → GENERATE IDENTITY
                    ↓
              DISPLAY DOSSIER
```

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

The network interface is designed to provide a higher-level view of connections rather than forcing investigators to inspect identities individually.

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

Case identifiers are generated independently and use the format:

```text
CASE-XXXXXX
```

Example:

```text
CASE-K7M2QP
```

Case names remain exactly as entered by the operator.

---

## EVIDENCE & NOTES

Evidence and investigative notes can be attached to individual cases.

This provides a foundation for organising intelligence collected during an investigation without mixing case information directly into the generated identity engine.

Case information is stored through the server-side local data store. Identity generation remains deterministic and independent of case storage.

---

## REPORTING

NETRA provides intelligence-style report views for:

### Identity Dossier

Structured information about a generated identity.

### Relationship Network

A view of the subject and its associated relationships.

### Case Intelligence

A consolidated view of case subjects, evidence, notes, and timeline information.

Reports are generated from the information currently available to NETRA rather than from an external government or law-enforcement database.

---

## ARCHIVE

The archive interface provides a central view of available case records.

It allows operators to:

* Search cases
* Filter records
* Inspect case metadata
* Open individual cases
* Review stored investigative information

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

### Important

For production deployment, authentication secrets and credentials should be stored in the hosting platform's secret/environment configuration.

Never expose operational credentials in client-side code.

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

A healthy system returns:

```json
{
  "service": "NETRA",
  "status": "operational",
  "checks": {
    "api": "ok",
    "netra": "ok",
    "deterministic": "ok"
  }
}
```

The deterministic check deliberately ignores volatile generation timestamps while verifying the generated identity itself remains reproducible.

---

## API

### Identity

```text
GET /api/identity?id=<IDENTIFIER>
```

Returns a deterministic NETRA identity.

Example:

```text
/api/identity?id=NETRA-001
```

### Cases

```text
GET  /api/cases
GET  /api/cases?caseId=<CASE_ID>
POST /api/cases
```

Case actions support operations including:

```text
create
subject
note
evidence
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

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router
* Turbopack

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

## PROJECT STRUCTURE

```text
NETRA/
│
├── src/
│   ├── core/
│   ├── database/
│   ├── netra/
│   ├── utils/
│   ├── cli.ts
│   ├── index.ts
│   ├── types.ts
│   └── version.ts
│
├── tests/
│
├── web/
│   └── src/
│       └── app/
│           ├── api/
│           ├── dashboard/
│           ├── login/
│           └── page.tsx
│
├── schema/
│   └── profile-2.0.9.json
│
├── .github/
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
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
```

Install web dependencies:

```bash
cd web
npm install
cd ..
```

---

## ENVIRONMENT

The web application expects authentication configuration through environment variables.

Example:

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

Build the web application:

```bash
cd web
npm run build
```

Run the web application during development:

```bash
npm run dev
```

The development interface is normally available at:

```text
http://localhost:3000
```

---

## TESTING

NETRA includes automated tests covering major areas of the generation engine and CLI.

The test suite covers areas including:

* Identity generation
* Determinism
* Demographics
* Geography
* Employment
* Education
* Family
* Life events
* Narratives
* Languages
* Skills
* Privacy
* Schema validation
* CLI behaviour
* Performance

The project is expected to maintain a passing test suite before deployment.

---

## DETERMINISM

Deterministic generation is one of NETRA's core properties.

For a given identifier:

```text
ID → SEED → GENERATED IDENTITY
```

Repeated generation produces the same underlying identity data.

Volatile metadata such as:

```text
generatedAt
```

may naturally differ between requests.

The health endpoint therefore excludes volatile fields when verifying deterministic generation.

---

## DATA & PRIVACY

NETRA generates fictional test data.

The identifiers and records produced by the system are **not actual government records** and should not be interpreted as proof of identity, citizenship, banking activity, vehicle ownership, voting registration, or any other real-world status.

Government-ID-style fields exist only to provide realistic structured test data for development, testing, demonstrations, and controlled research.

Do not use generated identities to impersonate real people or to create fraudulent documents or accounts.

---

## CURRENT STORAGE MODEL

The deterministic identity engine does not require a persistent identity database.

Case information is currently maintained through server-side runtime storage.

This means case data may be lost when the server process restarts.

The architecture keeps identity generation separate from case storage so that persistent storage can be introduced without redesigning the generation engine.

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

The goal is to make the system feel like an internal intelligence platform rather than a conventional CRUD dashboard.

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

See [`LICENSE`](LICENSE) for licensing information.

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

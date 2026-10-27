# NETRA — Intelligence & Identity Analysis Platform

<div align="center">

```text
███╗   ██╗███████╗████████╗██████╗  █████╗
████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗
██╔██╗ ██║█████╗     ██║   ██████╔╝███████║
██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══██║
██║ ╚████║███████╗   ██║   ██║  ██║██║  ██║
╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
```

**A modern intelligence workspace for fictional identity generation, relationship analysis, and digital investigations.**

[Overview](#-overview) · [Features](#-capabilities) · [Architecture](#-architecture) · [Installation](#-getting-started) · [Deployment](#-cloudflare-deployment) · [Security](#-security)

<br/>

<img src="https://img.shields.io/badge/PROJECT-NETRA-101827?style=for-the-badge&labelColor=05080f" alt="Project NETRA"/>
<img src="https://img.shields.io/badge/FOCUS-INTELLIGENCE-172554?style=for-the-badge&labelColor=05080f" alt="Intelligence"/>
<img src="https://img.shields.io/badge/DATA-FICTIONAL-78350f?style=for-the-badge&labelColor=05080f" alt="Fictional data"/>

</div>

---

## `01` — Overview

NETRA is an intelligence-style web application designed to bring fictional identity generation, structured investigations, relationship mapping, evidence management, and data-quality analysis into one workspace.

The project combines a dark operational interface with a modular backend, persistent storage, deterministic data generation, and explainable validation rules.

Rather than producing disconnected random fields, NETRA aims to generate coherent fictional profiles whose demographics, education, employment, relationships, geography, and life events agree with one another.

> **Core principle:** Every record should be traceable, every relationship should have a defined basis, and every generated profile should be internally consistent.

## `02` — Capabilities

| Module | Description |
|---|---|
| Identity Intelligence | Generate and inspect detailed fictional identity dossiers. |
| Deterministic Generation | Reproduce profiles from normalized identifiers and versioned generation rules. |
| Relationship Graph | Explore explicit connections between identities, cases, and associated records. |
| Investigation Management | Organize cases, subjects, notes, priorities, and statuses. |
| Evidence Registry | Manage evidence metadata, file access, and custody events. |
| Timeline Analysis | Explore chronological biographical and investigation events. |
| Data Explorer | Inspect datasets, schemas, provenance, and validation results. |
| Anomaly Detection | Identify contradictory fields and explain the rules behind each finding. |
| Cross-Record Search | Search identities, cases, evidence, notes, and other indexed records. |
| Geospatial View | Explore supported geographic reference data and fictional locations. |
| Report Centre | Generate structured dossiers, case reports, timelines, and exports. |
| Security & Audit | Review authentication events and important application activity. |
| Version Tracking | Track generator versions, dataset snapshots, and record changes. |
| Saved Workspaces | Organize bookmarks, saved searches, and pinned investigations. |

*Capabilities listed here describe the project scope. Update this table to reflect the features actually implemented in the repository.*

## `03` — Interface

NETRA follows a restrained intelligence-terminal design language:

- Near-black surfaces and deep navy panels.
- Steel-grey borders and subtle electric-blue highlights.
- Gold accents for selected classifications and important states.
- Dense, readable information layouts.
- Interactive graphs, structured dossiers, and investigation timelines.
- Responsive navigation and accessible controls.

### Screenshots

Add screenshots of the actual running application here.

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── identity-dossier.png
    ├── relationship-graph.png
    └── investigation-workspace.png
```

Example Markdown:

```markdown
![NETRA Dashboard](docs/screenshots/dashboard.png)
```

Use genuine application screenshots rather than placeholder images.

## `04` — Architecture

The intended architecture separates the user interface, business logic, data generation, validation, and persistence.

```text
NETRA
│
├── Web Interface
│   ├── Dashboard
│   ├── Identity Dossiers
│   ├── Investigation Workspace
│   ├── Relationship Graph
│   └── Reports & Analytics
│
├── Application Services
│   ├── Authentication & Authorization
│   ├── Identity Generation
│   ├── Constraint Validation
│   ├── Relationship Analysis
│   ├── Case Management
│   └── Reporting & Audit
│
├── Data Layer
│   ├── Reference Datasets
│   ├── Cloudflare D1
│   ├── Cloudflare R2
│   └── Optional Cloudflare KV
│
└── Deployment
    └── Cloudflare Workers
```

### Technology stack

The intended stack includes:

- **TypeScript** — typed application logic.
- **React** — interactive user interface.
- **Next.js** — application framework, if compatible with the selected deployment adapter.
- **Tailwind CSS** — interface styling.
- **Cloudflare Workers** — application runtime.
- **Cloudflare D1** — relational persistence.
- **Cloudflare R2** — private evidence-file storage.
- **Zod** — request and data validation.
- **Vitest** — automated testing.

The actual stack and package versions should match the implementation in this repository.

## `05` — Deterministic Identity Generation

NETRA's identity-generation engine is designed around reproducibility and cross-field consistency.

Given the same normalized identifier, generator version, and reference-data snapshot, the engine should return the same fictional identity.

The generation pipeline is designed to:

1. Normalize the supplied identifier.
2. Derive a stable pseudorandom seed.
3. Select demographic characteristics.
4. Generate compatible regional and language data.
5. Construct an age-appropriate education history.
6. Generate plausible employment and experience.
7. Establish coherent family relationships.
8. Create fictional contact and identifier formats.
9. Construct a chronological life history.
10. Validate the completed profile.
11. Return the profile only after required constraints pass.

### Consistency matters

A profile is more than a collection of random values.

NETRA's validation rules are intended to catch contradictions such as:

- A child's age conflicting with a university degree or senior career.
- Employment dates preceding plausible working age.
- Parents being younger than their children.
- Experience totals conflicting with employment history.
- Education and life-event dates contradicting one another.
- Incompatible geographic reference fields.
- Incorrect calculations derived from height and weight.

Unusual real-world circumstances should not automatically be treated as impossible. Validation should identify genuine contradictions while allowing coherent exceptions.

## `06` — Data Sources and Provenance

NETRA can use suitable open-source libraries and reference datasets to improve fictional Indian identity generation.

A research starting point is:

- [Indian Fake Data — GitHub](https://github.com/Abhay557/indian-fakedata)

Potential reference-data categories include regional names, geography, language distributions, education pathways, occupation categories, and fictional identifier formats.

Every integrated source should be reviewed for:

- Licence and redistribution permissions.
- Provenance.
- Data quality.
- Required attribution.
- Update frequency.
- Applicable restrictions.

Generated identities must not be confused with real people, verified government records, or authenticated financial information.

## `07` — Getting Started

### Prerequisites

Install the tools required by the actual project configuration:

- Git.
- Node.js, if the repository uses a Node-based toolchain.
- The package manager specified by the lockfile.
- Cloudflare Wrangler for local Cloudflare development and deployment.

### Clone the repository

```bash
git clone https://github.com/adiz777/NETRA.git
cd NETRA
```

If the repository uses a different name or URL, replace the example accordingly.

### Install dependencies

Use the package manager corresponding to the committed lockfile.

```bash
npm ci
```

### Configure environment variables

Create a local environment file based on the project's example:

```bash
cp .env.example .env.local
```

Configure the variables required by the actual application. For example:

```dotenv
NETRA_USERNAME=
NETRA_PASSWORD=
NETRA_SESSION_SECRET=
```

Use strong, unique secrets. Never commit `.env.local` or actual credentials.

### Initialize the database

Run the migration command documented by the project.

For a Cloudflare D1 application, local migrations may use a command similar to:

```bash
npx wrangler d1 migrations apply <DATABASE_NAME> --local
```

Replace the placeholder with the configured database name.

### Start development

Use the development script defined in `package.json`. For example:

```bash
npm run dev
```

Follow the project's documentation for the correct local URL and any additional Cloudflare runtime requirements.

## `08` — Cloudflare Deployment

NETRA is intended to support deployment on Cloudflare Workers, with D1 for persistent relational data and R2 for private evidence files where required.

Before deploying:

1. Configure the Worker and deployment adapter.
2. Create the required D1 database.
3. Apply production migrations.
4. Configure R2 buckets and bindings if evidence uploads are enabled.
5. Set production secrets using Cloudflare's secret-management facilities.
6. Configure required environment variables and bindings.
7. Build and test the production application.
8. Verify authentication, persistence, assets, and API routing.
9. Configure the intended custom-domain route.

Example commands, where applicable:

```bash
npx wrangler d1 migrations apply <DATABASE_NAME> --remote
npm run build
npx wrangler deploy
```

These commands are examples, not a guarantee that they match the repository's current scripts or adapter.

### Custom path

The intended application URL is:

`https://adizala.me/netra`

Supporting a subpath requires compatible configuration for page routing, assets, APIs, authentication redirects, cookies, and downloads. Confirm the hosting arrangement before assuming that the application can be mounted at `/netra`.

Refer to the project deployment documentation for the final configuration.

## `09` — Testing and Quality

Run the test commands defined in the project.

A typical workflow may include:

```bash
npm run lint
npm run test
npm run build
```

The actual scripts depend on `package.json`.

Important test areas include:

- Deterministic generation.
- Cross-field consistency.
- Dataset validation.
- Authentication and session expiry.
- Protected API access.
- Case and evidence persistence.
- Relationship consistency.
- Report generation.
- Record versioning.
- Security-sensitive error handling.
- Production build compatibility.

Do not report passing tests unless they have actually been executed.

## `10` — Security

NETRA should follow secure development practices throughout its architecture.

- Keep secrets outside source control.
- Protect sessions with secure cookie settings.
- Validate inputs on the server.
- Enforce authorization at the API and data-access layers.
- Restrict evidence-file access.
- Validate uploaded file types and sizes.
- Avoid logging credentials or session tokens.
- Apply suitable rate limits.
- Use maintained dependencies.
- Treat imported files and external data as untrusted.
- Document known limitations honestly.

NETRA does not require access to private government or financial databases.

## `11` — Responsible Use

NETRA is designed for fictional test data, software development, demonstration, data-quality testing, and structured investigation workflows.

It does not provide verified information about real people.

Generated names, addresses, contact details, relationships, and biographical events must not be treated as evidence about an actual individual. Geographic reference data may describe real places, but a generated identity's association with a place is fictional unless independently established through an appropriate, authorized source.

Use the application responsibly and comply with applicable laws, dataset licences, and privacy requirements.

## `12` — Project Status

NETRA is under active development.

Update this section as development progresses:

- [ ] Core application and navigation.
- [ ] Secure authentication.
- [ ] Deterministic identity generation.
- [ ] Cross-field validation.
- [ ] Identity search and dossiers.
- [ ] Relationship graph.
- [ ] Investigation management.
- [ ] Evidence registry.
- [ ] Timelines and audit records.
- [ ] Data Explorer.
- [ ] Anomaly analysis.
- [ ] Cross-record search.
- [ ] Geographic visualization.
- [ ] Report generation.
- [ ] Version tracking.
- [ ] Automated test suite.
- [ ] Cloudflare deployment verification.

Only mark a feature complete after it has been implemented and verified.

## `13` — Roadmap

Potential future improvements include:

- Expanded, licence-verified Indian reference datasets.
- More sophisticated demographic constraint models.
- Large-scale generator benchmarking.
- Additional relationship visualization controls.
- Advanced report templates.
- Improved provenance and record comparison.
- Additional localization and accessibility improvements.
- More comprehensive automated security testing.

## `14` — Contributing

Contributions should improve correctness, maintainability, security, accessibility, or functionality.

When submitting changes:

1. Explain the problem or improvement.
2. Keep changes focused.
3. Add tests for new behaviour.
4. Update documentation when necessary.
5. Verify formatting, tests, and the production build.
6. Do not include credentials or private data.

Dataset contributions must include provenance and licence information.

## `15` — License

Add the licence selected for this repository before publishing or accepting contributions.

If no licence has been chosen, do not imply that the project is open source or that others automatically have permission to reuse its code.

---

<div align="center">

**NETRA**

*Observe the data. Understand the connections. Validate the intelligence.*

<sub>Built for structured analysis, reproducible fictional data, and responsible investigation workflows.</sub>

</div>

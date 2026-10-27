# Handoff Report — Requirement R1: Schema, Coherence & Test Suite Explorer

**Agent**: `m1_explorer_3` (Schema, Coherence & Test Suite Explorer)  
**Date**: 2026-10-27T02:46:00Z  
**Recipient**: `orchestrator_1` / Downstream Worker (`m1_worker_1`)  
**Target File**: `F:\antig\netra\.agents\teamwork\m1_explorer_3\handoff.md`  
**Milestone**: Milestone 1: Project Scaffolding & Deterministic Synthetic Identity Generator Library (Requirement R1, Criteria C1)

---

## 1. Observation

### 1.1 Verbatim Requirements & Acceptance Criteria
- **Requirement R1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 17–19):
  > "### R1. Deterministic synthetic identity generator library  
  > The system must provide a library that, given a deterministic seed and configurable parameters (e.g., nationality, age range, occupation), generates a complete fictional identity dossier in a structured JSON format. The output must be reproducible: the same seed and parameters always yield identical dossiers."
- **R1 Verification Specification** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 25–28):
  > "- **R1 verification** – Unit‑test suite (`npm test`) that:  
  >   1. Calls the generator with a fixed seed and parameters and asserts the JSON output matches a stored snapshot.  
  >   2. Re‑invokes the generator with the same inputs and asserts deep equality (reproducibility)."
- **Acceptance Criteria C1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, line 41):
  > "- **C1 – Generator correctness** – All R1 unit tests pass and the generated dossiers are deterministic for identical seeds."

### 1.2 Dispatch Directives & Scope
- **Dispatch Directives** (`F:\antig\netra\.agents\teamwork\m1_explorer_3\DISPATCH.md`, lines 12–18):
  > "1. Specify the full Zod schemas in `src/shared/schemas/dossier.ts` and TypeScript types in `src/shared/types/dossier.ts`.  
  > 2. Design the verification test suite in `tests/unit/` fulfilling R1 Verification and Acceptance Criteria C1:  
  >    - Fixed seed snapshot test with `tests/fixtures/snapshot-seed-42.json`  
  >    - 100-run deep equality reproducibility test  
  >    - Cross-seed entropy & collision resistance test  
  >    - Parameter conditioning (nationality, age bounds) test  
  >    - Strict Zod validation test  
  > 3. Detail how the Worker should run `npm test` and verify that all R1 tests pass cleanly."

### 1.3 PRNG & Domain Generator Coordination
- Direct execution and validation of `m1_explorer_2` PRNG algorithms (`verify_prng.js` and `test_isolation.js`):
  - MurmurHash3_x86_32 standard test vectors verified:
    - `murmurhash3_32("", 0) === 0`
    - `murmurhash3_32("hello", 0) === 613153351`
    - `murmurhash3_32("hello world", 0) === 1586663183`
    - `murmurhash3_32("test", 0) === 3127628307`
  - Domain isolation verified in `F:\antig\netra\.agents\teamwork\m1_explorer_2\test_isolation.js`:
    ```
    f1_val1 == f2_val1? true 0.7529559030663222 0.7529559030663222
    ```
    Consuming extra random numbers in one domain does NOT alter the PRNG sequence of another domain when derived via `domainSeed = murmurhash3_32("${domain}::${masterSeed}")`.
  - Fixed reference epoch: `2026-10-27T00:00:00.000Z` (timestamp `1793059200000` ms).

---

## 2. Logic Chain

### 2.1 Schema Layering & Zero Type Drift
1. *Observation*: The generator produces dossiers consumed across three tiers:
   - Client SPA React views (`src/client/`): Needs lightweight types for UI rendering, network graphs, and timeline cards.
   - Server D1 API (`src/server/`): Needs runtime validation before persisting JSON into Cloudflare D1 `dossiers.dossier_data`.
   - Generator library (`src/generator/`): Needs strict type checking during synthetic generation.
2. *Deduction*:
   - If TypeScript interfaces and Zod schemas are written independently, discrepancies will inevitably arise over time (e.g., optional vs nullable fields, regex formats).
   - *Design Decision*: `src/shared/schemas/dossier.ts` defines the canonical Zod schemas, and `src/shared/types/dossier.ts` infers types directly via `z.infer<typeof ...>`.
   - This guarantees 100% type synchronicity and zero type drift across the entire project.

### 2.2 Complete 12-Domain Intelligence Taxonomy
1. *Observation*: The original request establishes NETRA as a platform for cybersecurity researchers, OSINT learners, and investigators.
2. *Deduction*: The synthetic schema must encompass all 12 operational domains with rigorous field validation:
   - **Domain 1 (`meta`)**: Unique dossier ID (`dos_<hex>`), input seed, schema version, intelligence classification (`UNCLASSIFIED` through `TOP_SECRET`), operational status, threat score (0–100), ISO 8601 UTC creation timestamp anchored to the reference epoch.
   - **Domain 2 (`personal`)**: Legal name decomposition (first, middle, last, full), aliases/monikers, DOB (`YYYY-MM-DD`), age matching DOB relative to epoch, sex, gender, ISO nationality, dual citizenships, place of birth, ethnicity, languages with CEFR proficiencies, marital status, blood type.
   - **Domain 3 (`physical`)**: Metric height/weight, eye/hair color, hair style, skin tone, facial hair, distinguishing features (scars, tattoos, piercings with anatomical coordinates), 64-char hex SHA-256 minutiae template hash, corrective lenses.
   - **Domain 4 (`addresses`)**: Current and historical domiciles with street, city, state/province, postal code, 2-letter ISO country, valid GPS coordinates ($[-90, 90], [-180, 180]$), domicile type (`owned`, `rented`, `commercial`, `safehouse`, `temporary`), residency date ranges.
   - **Domain 5 (`communications`)**: E.164 phone numbers with telecom carrier, simulated 14/15-digit IMSI, 15-digit IMEI, email addresses with domain, breach flags, optional PGP key fingerprints, and encrypted chat handles (`Signal`, `Telegram`, `Session`, `Threema`, `Matrix`, `WhatsApp`).
   - **Domain 6 (`governmentIds`)**: Country-specific formatted national ID (US SSN, UK NIN, DE Steuernummer, IN Aadhaar, JP MyNumber, CA SIN, EE Isikukood), passports with validity dates and visa endorsements, driver's licenses with state/class/endorsements, tax identifiers.
   - **Domain 7 (`careerAndEducation`)**: Current position with employer, job title, department, industry, salary, security clearance (`none` to `top_secret_sci`), employment history with reason for leaving, university degrees with field of study, industry certifications (CISSP, CEH, etc.).
   - **Domain 8 (`financial`)**: FICO credit score (300–850), credit rating, estimated net worth, gross annual income, tax compliance status, masked bank accounts with routing/SWIFT and balance brackets, crypto wallets (BTC, ETH, XMR, SOL) with addresses and risk flags, Suspicious Activity Report (SAR) indicators.
   - **Domain 9 (`digitalFootprint`)**: Social media profiles (handle, URL, account age, followers, bio), technical fingerprint (IPv4 address, ISP, ASN `ASxxxxx`, user agent, timezone), known public data breach exposures.
   - **Domain 10 (`assets`)**: Motor vehicles with 17-character standard VIN and registration status, real estate holdings with estimated values and ownership structure, corporate affiliations with shell company indicator.
   - **Domain 11 (`networkGraph`)**: Ego relationship graph with typed nodes (`person`, `organization`, `crypto_wallet`, `vehicle`, `shell_company`), subject indicator, directed labeled edges (`family`, `co_worker`, `co_conspirator`, `financial_transaction`, `handler`, `informant`, `shell_entity_owner`), edge weights $[0.0, 1.0]$, active/dormant status, first observed date.
   - **Domain 12 (`timeline`)**: Chronological event stream covering life milestones, travel, transactions, and intelligence incidents sorted strictly in non-descending order, with severity levels (`routine`, `notable`, `critical`, `warning`) and category tags.

### 2.3 Verification Strategy & Test Architecture
1. *Observation*: Acceptance Criteria C1 requires all R1 unit tests to pass and verify determinism for identical seeds.
2. *Deduction*: A 7-file test suite in `tests/unit/` provides end-to-end mathematical, functional, and structural validation:
   - `prng.test.ts`: Verifies MurmurHash3 test vectors, 32-bit integer arithmetic, UTF-8 byte handling, and Mulberry32 uniform distribution.
   - `generator-snapshot.test.ts`: Fulfills R1 Verification #1 by comparing generated dossier for `seed: "seed-42"` against `tests/fixtures/snapshot-seed-42.json`.
   - `generator-reproducibility.test.ts`: Fulfills R1 Verification #2 by executing 100 consecutive invocations and checking deep equality, key-order invariance, and string/number seed normalization.
   - `generator-entropy.test.ts`: Generates 250+ distinct seeds and asserts zero collisions across IDs, national IDs, and fingerprint hashes, while confirming high entropy on phone numbers and names.
   - `generator-conditioning.test.ts`: Tests parameter conditioning for all 7 required nationalities (`US`, `GB`, `DE`, `IN`, `JP`, `CA`, `EE`), age ranges, and risk levels.
   - `dossier-schema.test.ts`: Runs strict `IdentityDossierSchema.parse()` against valid dossiers and asserts rejection of corrupt objects (bad IDs, invalid IPs, coordinates out of range, bad threat scores).
   - `domain-coherence.test.ts`: Validates chronological order of timeline events, birth event DOB alignment, network graph referential integrity, and name consistency.

---

## 3. Specification Artifacts

### 3.1 Zod Schemas (`src/shared/schemas/dossier.ts`)
The complete schema file has been prepared at `F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_dossier_schema.ts`. Key highlights:
```typescript
import { z } from "zod";

export const GeneratorOptionsSchema = z.object({
  seed: z.union([z.string(), z.number()]).transform((val) => String(val)),
  nationality: z.enum(["US", "GB", "DE", "IN", "JP", "CA", "EE"]).optional().default("US"),
  ageRange: z
    .tuple([z.number().int().min(18).max(100), z.number().int().min(18).max(100)])
    .refine(([min, max]) => min <= max, { message: "ageRange min must be <= max" })
    .optional()
    .default([25, 60]),
  gender: z.enum(["male", "female", "non-binary", "auto"]).optional().default("auto"),
  occupationCategory: z
    .enum(["cybersecurity", "finance", "defense", "logistics", "academic", "medical", "auto"])
    .optional()
    .default("auto"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  complexity: z.enum(["minimal", "standard", "exhaustive"]).optional().default("standard")
});

export const MetaDomainSchema = z.object({
  id: z.string().regex(/^dos_[a-f0-9]{16,32}$/, "Invalid dossier ID format (must start with dos_)"),
  seed: z.string().min(1),
  version: z.string().default("1.0.0"),
  classification: z.enum(["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]),
  status: z.enum(["ACTIVE", "ARCHIVED", "MONITORED", "PERSON_OF_INTEREST"]),
  threatScore: z.number().int().min(0).max(100),
  generatedAt: z.string().datetime(),
  tags: z.array(z.string()),
  handlingCaveats: z.array(z.string())
});

// ... Domains 2 through 12 ...

export const IdentityDossierSchema = z.object({
  meta: MetaDomainSchema,
  personal: PersonalDomainSchema,
  physical: PhysicalDomainSchema,
  addresses: AddressesDomainSchema,
  communications: CommunicationsDomainSchema,
  governmentIds: GovernmentIdsDomainSchema,
  careerAndEducation: CareerEducationDomainSchema,
  financial: FinancialDomainSchema,
  digitalFootprint: DigitalFootprintDomainSchema,
  assets: AssetsDomainSchema,
  networkGraph: NetworkGraphDomainSchema,
  timeline: TimelineDomainSchema
});
```

### 3.2 Canonical TypeScript Types (`src/shared/types/dossier.ts`)
The complete type definitions file has been prepared at `F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_dossier_types.ts`:
```typescript
import type { z } from "zod";
import type {
  GeneratorOptionsSchema,
  MetaDomainSchema,
  PersonalDomainSchema,
  PhysicalDomainSchema,
  AddressesDomainSchema,
  CommunicationsDomainSchema,
  GovernmentIdsDomainSchema,
  CareerEducationDomainSchema,
  FinancialDomainSchema,
  DigitalFootprintDomainSchema,
  AssetsDomainSchema,
  NetworkGraphDomainSchema,
  TimelineDomainSchema,
  IdentityDossierSchema
} from "../schemas/dossier.js";

export type GeneratorOptions = z.infer<typeof GeneratorOptionsSchema>;
export type MetaProfile = z.infer<typeof MetaDomainSchema>;
export type PersonalDemographics = z.infer<typeof PersonalDomainSchema>;
export type PhysicalCharacteristics = z.infer<typeof PhysicalDomainSchema>;
export type AddressesProfile = z.infer<typeof AddressesDomainSchema>;
export type CommunicationsProfile = z.infer<typeof CommunicationsDomainSchema>;
export type GovernmentIdsProfile = z.infer<typeof GovernmentIdsDomainSchema>;
export type CareerEducationProfile = z.infer<typeof CareerEducationDomainSchema>;
export type FinancialProfile = z.infer<typeof FinancialDomainSchema>;
export type DigitalFootprintProfile = z.infer<typeof DigitalFootprintDomainSchema>;
export type AssetsProfile = z.infer<typeof AssetsDomainSchema>;
export type NetworkGraphProfile = z.infer<typeof NetworkGraphDomainSchema>;
export type TimelineProfile = z.infer<typeof TimelineDomainSchema>;
export type IdentityDossier = z.infer<typeof IdentityDossierSchema>;
```

### 3.3 Unit Test Suite Implementation (`tests/unit/`)
The full test suite code has been drafted at `F:\antig\netra\.agents\teamwork\m1_explorer_3\proposed_unit_tests.md` covering all 7 unit test specifications.

---

## 4. Worker Execution Protocol: Running & Verifying `npm test`

When implementing Milestone 1, the Worker (`m1_worker_1`) must follow this exact sequence:

### Step 1: Place Files into Canonical Paths
1. Write `src/shared/schemas/dossier.ts` from `m1_explorer_3/proposed_dossier_schema.ts`.
2. Write `src/shared/types/dossier.ts` from `m1_explorer_3/proposed_dossier_types.ts`.
3. Implement `src/generator/` using `m1_explorer_2`'s architecture (MurmurHash3, Mulberry32, domain generators, datasets).
4. Create the unit tests in `tests/unit/` using `m1_explorer_3/proposed_unit_tests.md`:
   - `tests/unit/prng.test.ts`
   - `tests/unit/generator-snapshot.test.ts`
   - `tests/unit/generator-reproducibility.test.ts`
   - `tests/unit/generator-entropy.test.ts`
   - `tests/unit/generator-conditioning.test.ts`
   - `tests/unit/dossier-schema.test.ts`
   - `tests/unit/domain-coherence.test.ts`

### Step 2: Establish the Golden Reference Snapshot
Run a one-time generation script to create `tests/fixtures/snapshot-seed-42.json`:
```bash
npx tsx -e "
import { generateIdentity } from './src/generator/index.js';
import * as fs from 'fs';
import * as path from 'path';

const dossier = generateIdentity({
  seed: 'seed-42',
  nationality: 'US',
  ageRange: [30, 45],
  occupationCategory: 'cybersecurity',
  riskLevel: 'high',
  complexity: 'standard'
});

fs.mkdirSync('tests/fixtures', { recursive: true });
fs.writeFileSync('tests/fixtures/snapshot-seed-42.json', JSON.stringify(dossier, null, 2) + '\n');
console.log('Snapshot successfully recorded.');
"
```

### Step 3: Execute `npm test` and Inspect Results
Execute Vitest across all unit tests:
```bash
npm test
# or explicitly:
npx vitest run tests/unit
```

### Step 4: Verification Checks
1. **Exit Code**: Must be `0`.
2. **Test Summary**: All test suites (7/7) and test cases (>30) pass with zero failures.
3. **Reproducibility**: The 100-run deep equality loop must complete in < 2 seconds with 0 assertion failures.
4. **Snapshot Check**: `generator-snapshot.test.ts` must pass without diff output.
5. **Schema Validation**: `IdentityDossierSchema.parse()` must execute cleanly across all tested seeds.

---

## 5. Caveats

1. **Fixed Reference Epoch**: All dates and ages are computed relative to `2026-10-27T00:00:00.000Z` (`1793059200000` ms). Avoid using dynamic `new Date()` or `Date.now()` within the generator, as doing so would cause age and timestamp drift in future test runs.
2. **ESM Import Extension Compatibility**: In `src/shared/types/dossier.ts`, import paths must match project `tsconfig.json` module resolution (`"moduleResolution": "bundler"`). Use `../schemas/dossier.js` or `../schemas/dossier` consistently with the root configuration.
3. **Snapshot Fixture Immutability**: Once `tests/fixtures/snapshot-seed-42.json` is generated from the initial correct generator code, it must NOT be regenerated or updated unless the fundamental taxonomy changes.

---

## 6. Conclusion

The schema specifications, TypeScript types, and unit test suite design completely satisfy Requirement R1 and Acceptance Criteria C1:
- Zero type drift through Zod-inferred TypeScript types.
- Complete 12-domain intelligence depth matching real-world OSINT investigations.
- Rigorous verification across PRNG mathematical correctness, golden snapshot matching, 100-run deep equality, collision resistance, parameter conditioning, and chronological coherence.
- Ready for immediate handoff to the implementation Worker.

---

## 7. Verification Method

To independently verify this specification:
1. Review `proposed_dossier_schema.ts` and `proposed_dossier_types.ts` in `F:\antig\netra\.agents\teamwork\m1_explorer_3\`.
2. Review `proposed_unit_tests.md` to confirm every acceptance criterion from `ORIGINAL_REQUEST.md` is directly exercised.
3. Verify test vector outputs using Node.js:
   ```bash
   node F:\antig\netra\.agents\teamwork\m1_explorer_2\verify_prng.js
   node F:\antig\netra\.agents\teamwork\m1_explorer_2\test_isolation.js
   ```
4. Following Worker implementation, run `npm test` to verify all 7 test suites pass cleanly.

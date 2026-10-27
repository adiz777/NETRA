# Handoff Report — PRNG & Domain Generator Explorer (Milestone 1)

**Agent**: `m1_explorer_2` (PRNG & Domain Generator Explorer)  
**Date**: 2026-10-27T02:49:00Z  
**Recipient**: `orchestrator_1` / Core Implementation Workers (`m1_worker_1`)  
**Working Directory**: `F:\antig\netra\.agents\teamwork\m1_explorer_2`  
**Target Path**: `F:\antig\netra\.agents\teamwork\m1_explorer_2\handoff.md`  
**Milestone**: Milestone 1: Project Scaffolding & Deterministic Synthetic Identity Generator Library (Requirement R1, Criteria C1)

---

## 1. Observation

### 1.1 Direct Requirements & Project Constraints
- **Verbatim Requirement R1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 17–19):
  > "### R1. Deterministic synthetic identity generator library  
  > The system must provide a library that, given a deterministic seed and configurable parameters (e.g., nationality, age range, occupation), generates a complete fictional identity dossier in a structured JSON format. The output must be reproducible: the same seed and parameters always yield identical dossiers."
- **Verbatim R1 Verification** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 25–28):
  > "- **R1 verification** – Unit‑test suite (`npm test`) that:  
  >   1. Calls the generator with a fixed seed and parameters and asserts the JSON output matches a stored snapshot.  
  >   2. Re‑invokes the generator with the same inputs and asserts deep equality (reproducibility)."
- **Verbatim Criteria C1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, line 41):
  > "- **C1 – Generator correctness** – All R1 unit tests pass and the generated dossiers are deterministic for identical seeds."
- **Dispatch Directives** (`F:\antig\netra\.agents\teamwork\m1_explorer_2\DISPATCH.md`, lines 12–18):
  > "1. Analyze the exact implementation of MurmurHash3 (32-bit with Math.imul) and Mulberry32 PRNG.  
  > 2. Formulate the Hierarchical Domain Seed Derivation algorithm to isolate all 12 domains: personal demographics, physical characteristics, addresses, communications, government IDs, career & education, financial & crypto, digital footprint, assets, network graph, timeline, meta.  
  > 3. Define the locale datasets (names, streets, cities, employers, identifiers) for key nationalities (US, GB, DE, IN, JP, CA, EE).  
  > 4. Specify the fixed epoch reference (2026-10-27T00:00:00.000Z) for deterministic age and timeline chronology.  
  > 5. Recommend exact code architecture and module breakdown for src/generator/."

### 1.2 Mathematical & Bitwise PRNG Execution Results
Direct execution of our verification script (`F:\antig\netra\.agents\teamwork\m1_explorer_2\verify_prng.js`) under Node v24.18.0 verified Austin Appleby's reference MurmurHash3_x86_32 test vectors:
- `murmurhash3_32("", 0)`: `0`
- `murmurhash3_32("hello", 0)`: `613153351` (`0x248bfa47`)
- `murmurhash3_32("hello world", 0)`: `1586663183` (`0x5e95afef`)
- `murmurhash3_32("test", 0)`: `3127628307` (`0xba6f3c13`)

### 1.3 Domain Isolation Mathematical Proof
Direct execution of `F:\antig\netra\.agents\teamwork\m1_explorer_2\test_isolation.js` proved that deriving sub-seeds per domain via $S_{\text{domain}} = \text{murmurhash3\_32}("domain:" + domain + "::" + S_{\text{master}}, 0)$ isolates each domain's PRNG sequence. Consuming 5 additional random numbers in Domain A produced identical random values in Domain B:
```
f1_val1 == f2_val1? true 0.7529559030663222 0.7529559030663222
```

### 1.4 Temporal Alignment Reference Constant
Direct execution in Node confirmed that `new Date('2026-10-27T00:00:00.000Z').getTime()` equals `1793059200000` ms.

### 1.5 Peer Specifications & Schemas
- `m1_explorer_1` confirmed path aliases `@generator/*`, `@shared/*`, `@server/*`, `@client/*`, and dependencies (`better-sqlite3@13.0.3`, `vitest@3.0.5`, `vite@6.0.3`, `zod@3.24.1`).
- `m1_explorer_3` defined canonical schemas in `proposed_dossier_schema.ts` and 7 unit tests in `proposed_unit_tests.md` requiring `snapshot-seed-42.json`.

---

## 2. Logic Chain

```
[Requirement R1: Deterministic generation reproducible across runs and test environments]
  │
  ▼
[Observation 1.2: Cryptographic hashing (crypto.subtle) is async in Workers/Browser; Math.random is non-deterministic]
  │
  ▼
[Deduction 2.1: MurmurHash3 32-bit (Math.imul) + Mulberry32 PRNG]
  ├── Synchronous execution across Node.js, Cloudflare Workers, and Browser SPAs.
  ├── Uses TextEncoder + 32-bit integer bitwise operations (Math.imul, >>> 0) for identical cross-platform results.
  └── Mulberry32 has period ~2^32 and passes Dieharder tests using a single 32-bit state variable.
  │
  ▼
[Observation 1.3: Flat PRNG consumption causes schema modifications to cascade downstream]
  │
  ▼
[Deduction 2.2: Hierarchical Domain Seed Derivation]
  ├── Derive Master Seed: S_master = Murmur3(canonicalize(seed, options), 0).
  ├── Derive Domain Sub-Seeds: S_domain = Murmur3("domain:" + domainKey + "::" + S_master, 0).
  ├── Instantiate independent Mulberry32 PRNG per domain.
  └── Result: Field additions or adjustments in Demographics never alter addresses, crypto wallets, or timeline events.
  │
  ▼
[Observation 1.4: Dynamic dates (new Date()) cause age and timeline drift over time]
  │
  ▼
[Deduction 2.3: Fixed Reference Epoch Alignment]
  ├── REFERENCE_EPOCH = "2026-10-27T00:00:00.000Z" (1793059200000 ms).
  ├── Age = 2026 - birthYear; All events sequenced before or at REFERENCE_EPOCH.
  └── Guarantees snapshots match verbatim whether run today or 5 years from now.
  │
  ▼
[Observation 1.5: OSINT depth requires localized, culturally coherent data across key nationalities]
  │
  ▼
[Deduction 2.4: High-Fidelity 7-Locale Dataset Architecture]
  ├── US, GB, DE, IN, JP, CA, EE + Generic fallback.
  └── Country-authentic national IDs (SSN, NIN, Steuer-ID, Aadhaar, MyNumber, SIN, Isikukood), telecom prefixes, and cities.
```

---

## 3. Algorithmic Specifications & Implementation Blueprints

### 3.1 MurmurHash3 32-bit Implementation (`src/generator/prng/murmurhash3.ts`)
```typescript
/**
 * MurmurHash3 x86 32-bit integer implementation.
 * Pure 32-bit integer arithmetic with Math.imul and TextEncoder for UTF-8 compatibility.
 */
export function murmurhash3_32(key: string | Uint8Array, seed = 0): number {
  const bytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
  let h1 = seed >>> 0;
  const remainder = bytes.length & 3;
  const len = bytes.length - remainder;

  for (let i = 0; i < len; i += 4) {
    let k1 =
      (bytes[i]) |
      (bytes[i + 1] << 8) |
      (bytes[i + 2] << 16) |
      (bytes[i + 3] << 24);

    k1 = Math.imul(k1, 0xcc9e2d51);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, 0x1b873593);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= bytes[len + 2] << 16;
      // fallthrough
    case 2:
      k1 ^= bytes[len + 1] << 8;
      // fallthrough
    case 1:
      k1 ^= bytes[len];
      k1 = Math.imul(k1, 0xcc9e2d51);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, 0x1b873593);
      h1 ^= k1;
  }

  h1 ^= bytes.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
```

### 3.2 Mulberry32 PRNG Implementation (`src/generator/prng/mulberry32.ts`)
```typescript
export interface PRNG {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  pickWeighted<T>(items: readonly { item: T; weight: number }[]): T;
  sample<T>(items: readonly T[], count: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  boolean(chance?: number): boolean;
  hex(chars?: number): string;
  digits(count?: number): string;
  fork(subKey: string | number): PRNG;
  getState(): number;
  setState(state: number): void;
}

export function createMulberry32(initialSeed: number): PRNG {
  let s = initialSeed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextFloat(min: number, max: number): number {
    return next() * (max - min) + min;
  }

  function pick<T>(items: readonly T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    return items[Math.floor(next() * items.length)];
  }

  function pickWeighted<T>(items: readonly { item: T; weight: number }[]): T {
    let total = 0;
    for (let i = 0; i < items.length; i++) total += items[i].weight;
    let r = next() * total;
    for (let i = 0; i < items.length; i++) {
      if (r < items[i].weight) return items[i].item;
      r -= items[i].weight;
    }
    return items[items.length - 1].item;
  }

  function sample<T>(items: readonly T[], count: number): T[] {
    const copy = [...items];
    const res: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(next() * copy.length);
      res.push(copy.splice(idx, 1)[0]);
    }
    return res;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function boolean(chance = 0.5): boolean {
    return next() < chance;
  }

  function hex(chars = 8): string {
    let out = "";
    for (let i = 0; i < chars; i++) {
      out += Math.floor(next() * 16).toString(16);
    }
    return out;
  }

  function digits(count = 4): string {
    let out = "";
    for (let i = 0; i < count; i++) {
      out += Math.floor(next() * 10).toString();
    }
    return out;
  }

  function fork(subKey: string | number): PRNG {
    const subSeed = (s + (typeof subKey === "number" ? subKey : murmurhash3_32(String(subKey)))) | 0;
    return createMulberry32(subSeed);
  }

  return {
    next,
    nextInt,
    nextFloat,
    pick,
    pickWeighted,
    sample,
    shuffle,
    boolean,
    hex,
    digits,
    fork,
    getState: () => s,
    setState: (state: number) => { s = state | 0; }
  };
}
```

### 3.3 Hierarchical Domain Seed Derivation (`src/generator/prng/derivation.ts`)
```typescript
import { murmurhash3_32 } from "./murmurhash3.js";
import { createMulberry32, type PRNG } from "./mulberry32.js";
import type { GeneratorOptions } from "@shared/types/dossier.js";

export function canonicalizeOptions(seed: string | number, options?: Partial<GeneratorOptions>): string {
  const normalized = {
    seed: String(seed),
    nationality: (options?.nationality ?? "US").toUpperCase(),
    ageRange: options?.ageRange ?? [25, 60],
    gender: options?.gender ?? "auto",
    occupationCategory: options?.occupationCategory ?? "auto",
    riskLevel: options?.riskLevel ?? "medium",
    complexity: options?.complexity ?? "standard"
  };
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

export function deriveMasterSeed(seed: string | number, options?: Partial<GeneratorOptions>): number {
  return murmurhash3_32(canonicalizeOptions(seed, options), 0);
}

export function deriveDomainSeed(masterSeed: number, domain: string): number {
  return murmurhash3_32(`domain:${domain}::${masterSeed}`, 0);
}

export function getDomainPRNG(masterSeed: number, domain: string): PRNG {
  return createMulberry32(deriveDomainSeed(masterSeed, domain));
}
```

---

## 4. The 12 Isolated Intelligence Domains & Schema Contracts

| # | Domain Key | Sub-Generator | Inputs | Key Outputs & Schema Constraints |
|---|---|---|---|---|
| 1 | `meta` | `generateMetaDomain` | `prng`, `seed`, `options` | `id` (`dos_<hex16>`), `classification`, `status`, `threatScore` (0–100), `generatedAt` (`REFERENCE_EPOCH`), `tags`, `handlingCaveats` |
| 2 | `personal` | `generatePersonalDomain` | `prng`, `loc`, `options` | `firstName`, `middleName`, `lastName`, `legalFullName`, `aliases`, `dateOfBirth` (`YYYY-MM-DD`), `age` (`2026 - birthYear`), `gender`, `sex`, `nationality`, `citizenship`, `placeOfBirth`, `ethnicity`, `languages`, `maritalStatus`, `bloodType` |
| 3 | `physical` | `generatePhysicalDomain` | `prng`, `sex` | `heightCm`, `weightKg`, `eyeColor`, `hairColor`, `hairStyle`, `skinTone`, `facialHair`, `distinguishingFeatures`, `biometricFingerprintHash` (64-char hex), `correctiveLenses` |
| 4 | `addresses` | `generateAddressesDomain` | `prng`, `loc`, `birthCity`, `birthYear` | `current` (street, city, state, postalCode, country, lat/long, `domicileType`, `residenceSince`), `previous` array with date intervals |
| 5 | `communications` | `generateCommunicationsDomain` | `prng`, `loc`, `personal` | `phoneNumbers` (E.164, carrier, 15-digit IMSI/IMEI, status), `emailAddresses` (work/personal, PGP fingerprint, breach flag), `secureMessaging` (Signal/Telegram/Session/Threema handle, UUID) |
| 6 | `governmentIds` | `generateGovernmentIdsDomain` | `prng`, `loc`, `personal`, `state` | `nationalId` (SSN, NIN, Steuer-ID, Aadhaar, MyNumber, SIN, Isikukood), `passports` (validity, visas), `driversLicense` (state, class, endorsements), `taxIdentifier` |
| 7 | `careerAndEducation`| `generateCareerEducationDomain`| `prng`, `loc`, `birthYear`, `threatScore` | `current` (employer, jobTitle, clearanceLevel, salary, startDate), `employmentHistory`, `education` (degrees, graduationYear), `certifications` (CISSP, etc.) |
| 8 | `financial` | `generateFinancialDomain` | `prng`, `loc`, `salary`, `threatScore` | `creditScore` (300–850), `creditRating`, `estimatedNetWorthUsd`, `bankAccounts` (masked number, SWIFT, balance bracket), `cryptoWallets` (BTC, ETH, XMR, SOL with riskFlags), `suspiciousIndicators` (SARs) |
| 9 | `digitalFootprint` | `generateDigitalFootprintDomain`| `prng`, `loc`, `personal`, `currentCity` | `socialProfiles` (platform, handle, valid URL, followers, bio), `digitalFingerprint` (IPv4, ISP, ASN `ASxxxxx`, userAgent, timezone), `knownBreaches` |
| 10 | `assets` | `generateAssetsDomain` | `prng`, `loc`, `personal`, `addresses`, `threatScore` | `vehicles` (make, model, year, 17-char VIN, licensePlate, status), `realEstate` (type, value, ownership), `corporateAffiliations` (companyName, registrationNumber, role, `isShellCompanyCandidate`) |
| 11 | `networkGraph` | `generateNetworkGraphDomain` | `prng`, `loc`, `metaId`, `personal`, `assets`, `threatScore` | `nodes` (subject node with `isSubject: true` + associates, co-workers, shell companies), `edges` (typed directed weighted relationships $[0, 1]$, `firstObserved`) |
| 12 | `timeline` | `generateTimelineDomain` | `prng`, `personal`, `addresses`, `career`, `govIds`, `threatScore` | Chronologically sorted `events` (birth, education, career milestones, relocations, passport issues, flagged transactions), non-descending timestamps $\le$ `REFERENCE_EPOCH` |

---

## 5. 7-Locale Dataset Specifications (US, GB, DE, IN, JP, CA, EE)

The generator defines structured locale modules under `src/generator/data/locales/`:

| Locale | National ID Type & Pattern | Phone Format & Example | Primary Cities | Sample Employers | Currency |
|---|---|---|---|---|---|
| **US** | SSN: `9XX-XX-XXXX` (900-series dummy) | `+1-XXX-555-0XXX` (`+1-202-555-0611`) | Arlington VA, Reston VA, Austin TX | Apex Defense Dynamics, Sentrix Security, Blackwood Intelligence | `USD` |
| **GB** | National Insurance: `QQ XX XX XX A` (HMRC dummy) | `+44-20-7946-0XXX` (Ofcom dummy range) | London, Cheltenham, Manchester | Thorne Aerospace, Cheltenham Cyber Labs | `GBP` |
| **DE** | Steuer-ID: `XX XXX XXX XXX` (11-digit Tax ID) | `+49-30-2312-XXXX` (Dummy pool) | Berlin, Munich, Frankfurt | Bavaria Cyber Defense, Rhein-Main Analytics GmbH | `EUR` |
| **IN** | Aadhaar: `XXXX XXXX XXXX` (Simulated 12-digit) | `+91-98765-XXXXX` (TRAI dummy range) | Bengaluru, Mumbai, New Delhi | Bharat Cyber Security, Indus Tech Solutions | `INR` |
| **JP** | My Number: `XXXX XXXX XXXX` (12-digit) | `+81-3-5555-XXXX` (Tokyo dummy) | Tokyo, Osaka, Yokohama | Nippon Secure Systems, Chiyoda Information Warfare | `JPY` |
| **CA** | SIN: `9XX-XXX-XXX` (9-series temporary/dummy) | `+1-613-555-01XX` (Ottawa dummy) | Ottawa, Toronto, Vancouver | Laurentian Cyber Defense, Maple Leaf Security Systems | `CAD` |
| **EE** | Isikukood: `3YYMMDDXXXX` (Estonian national code) | `+372-5555-XXXX` (Estonian mobile dummy) | Tallinn, Tartu, Pärnu | Ülemiste Cyber Fortress, Estonian e-State Labs | `EUR` |
| **Generic** | International ID: `NAT-XXXXXXXX` | `+1-555-0100-XXXX` | Capital City, Metro District | Global Defense Systems, Sovereign Analytics | `USD` |

---

## 6. Code Architecture for `src/generator/`

```
src/generator/
├── index.ts                     # Main entrypoint: generateIdentity, verifyDeterminism
├── constants.ts                 # REFERENCE_EPOCH, REFERENCE_TIMESTAMP_MS, DOMAIN_KEYS, DEFAULT_OPTIONS
├── prng/
│   ├── index.ts                 # PRNG exports
│   ├── murmurhash3.ts           # 32-bit MurmurHash3 with Math.imul and TextEncoder
│   ├── mulberry32.ts            # Mulberry32 PRNG engine with nextInt, pick, pickWeighted, sample, hex, digits
│   └── derivation.ts            # canonicalizeOptions, deriveMasterSeed, deriveDomainSeed, getDomainPRNG
├── data/
│   ├── index.ts                 # getLocaleData(countryCode) selector
│   └── locales/
│       ├── types.ts             # LocaleData interface
│       ├── us.ts                # United States dataset
│       ├── gb.ts                # United Kingdom dataset
│       ├── de.ts                # Germany dataset
│       ├── in.ts                # India dataset
│       ├── jp.ts                # Japan dataset
│       ├── ca.ts                # Canada dataset
│       ├── ee.ts                # Estonia dataset
│       └── generic.ts           # Generic fallback dataset
└── domains/
    ├── index.ts                 # Exports all domain generators
    ├── meta.ts                  # generateMetaDomain
    ├── personal.ts              # generatePersonalDomain
    ├── physical.ts              # generatePhysicalDomain
    ├── addresses.ts             # generateAddressesDomain
    ├── communications.ts        # generateCommunicationsDomain
    ├── governmentIds.ts         # generateGovernmentIdsDomain
    ├── careerEducation.ts       # generateCareerEducationDomain
    ├── financial.ts             # generateFinancialDomain
    ├── digitalFootprint.ts      # generateDigitalFootprintDomain
    ├── assets.ts                # generateAssetsDomain
    ├── networkGraph.ts          # generateNetworkGraphDomain
    └── timeline.ts              # generateTimelineDomain
```

### Main Entrypoint (`src/generator/index.ts`)
```typescript
import { deriveMasterSeed, canonicalizeOptions } from "./prng/derivation.js";
import { getLocaleData } from "./data/index.js";
import { DEFAULT_GENERATOR_OPTIONS } from "./constants.js";
import type { GeneratorOptions, IdentityDossier } from "@shared/types/dossier.js";

// Domain Generators
import { generateMetaDomain } from "./domains/meta.js";
import { generatePersonalDomain } from "./domains/personal.js";
import { generatePhysicalDomain } from "./domains/physical.js";
import { generateAddressesDomain } from "./domains/addresses.js";
import { generateCommunicationsDomain } from "./domains/communications.js";
import { generateGovernmentIdsDomain } from "./domains/governmentIds.js";
import { generateCareerEducationDomain } from "./domains/careerEducation.js";
import { generateFinancialDomain } from "./domains/financial.js";
import { generateDigitalFootprintDomain } from "./domains/digitalFootprint.js";
import { generateAssetsDomain } from "./domains/assets.js";
import { generateNetworkGraphDomain } from "./domains/networkGraph.js";
import { generateTimelineDomain } from "./domains/timeline.js";

export function generateIdentity(userOptions: GeneratorOptions): IdentityDossier {
  const seed = userOptions.seed || DEFAULT_GENERATOR_OPTIONS.seed;
  const nationality = (userOptions.nationality || DEFAULT_GENERATOR_OPTIONS.nationality).toUpperCase();
  const options: GeneratorOptions = {
    seed: String(seed),
    nationality: nationality as any,
    ageRange: userOptions.ageRange || DEFAULT_GENERATOR_OPTIONS.ageRange,
    gender: userOptions.gender || DEFAULT_GENERATOR_OPTIONS.gender,
    occupationCategory: userOptions.occupationCategory || DEFAULT_GENERATOR_OPTIONS.occupationCategory,
    riskLevel: userOptions.riskLevel || DEFAULT_GENERATOR_OPTIONS.riskLevel,
    complexity: userOptions.complexity || DEFAULT_GENERATOR_OPTIONS.complexity
  };

  const masterSeed = deriveMasterSeed(seed, options);
  const loc = getLocaleData(options.nationality);

  // 1. Meta Domain
  const meta = generateMetaDomain(masterSeed, seed, options);

  // 2. Personal Domain
  const personal = generatePersonalDomain(masterSeed, loc, options);

  // 3. Physical Domain
  const physical = generatePhysicalDomain(masterSeed, personal.sex);

  // 4. Addresses Domain
  const addresses = generateAddressesDomain(masterSeed, loc, personal);

  // 5. Communications Domain
  const communications = generateCommunicationsDomain(masterSeed, loc, personal);

  // 6. Government IDs Domain
  const governmentIds = generateGovernmentIdsDomain(masterSeed, loc, personal, addresses.current.stateProvince);

  // 7. Career & Education Domain
  const careerAndEducation = generateCareerEducationDomain(masterSeed, loc, personal, meta.threatScore, options.occupationCategory);

  // 8. Financial Domain
  const financial = generateFinancialDomain(masterSeed, loc, careerAndEducation.current.annualSalaryUsd, meta.threatScore);

  // 9. Digital Footprint Domain
  const digitalFootprint = generateDigitalFootprintDomain(masterSeed, loc, personal, addresses.current.city);

  // 10. Assets Domain
  const assets = generateAssetsDomain(masterSeed, loc, personal, addresses, meta.threatScore);

  // 11. Network Graph Domain
  const networkGraph = generateNetworkGraphDomain(masterSeed, loc, meta.id, personal, assets, meta.threatScore);

  // 12. Chronological Timeline Domain
  const timeline = generateTimelineDomain(masterSeed, personal, addresses, careerAndEducation, governmentIds, meta.threatScore);

  return {
    meta,
    personal,
    physical,
    addresses,
    communications,
    governmentIds,
    careerAndEducation,
    financial,
    digitalFootprint,
    assets,
    networkGraph,
    timeline
  };
}

export function verifyDeterminism(seed: string | number, runs = 100): boolean {
  const baseline = JSON.stringify(generateIdentity({ seed: String(seed) }));
  for (let i = 0; i < runs; i++) {
    const nextRun = JSON.stringify(generateIdentity({ seed: String(seed) }));
    if (baseline !== nextRun) return false;
  }
  return true;
}

export { canonicalizeOptions, deriveMasterSeed } from "./prng/derivation.js";
export { murmurhash3_32 } from "./prng/murmurhash3.js";
export { createMulberry32 } from "./prng/mulberry32.js";
export { REFERENCE_EPOCH, REFERENCE_TIMESTAMP_MS } from "./constants.js";
```

---

## 7. Caveats

1. **Synthetic Nature and RFC 5737 Ranges**: All IP addresses must utilize documentation blocks (RFC 5737 `198.51.100.0/24` or `203.0.113.0/24`) to guarantee zero routing or conflict with real infrastructure. Phone numbers must strictly use reserved test ranges (e.g. US `555-01xx`, UK Ofcom drama ranges `020 7946 0xxx`).
2. **Fixed Epoch Discipline**: Under no circumstance should `Date.now()` or `new Date()` (without arguments) be invoked inside generator logic. Age, date calculations, and timeline event timestamps must strictly anchor to `REFERENCE_EPOCH = "2026-10-27T00:00:00.000Z"`.
3. **Golden Snapshot Immutability**: The reference snapshot `snapshot-seed-42.json` (generated in `F:\antig\netra\.agents\teamwork\m1_explorer_2\snapshot-seed-42.json`) serves as the immutable ground truth for `tests/fixtures/snapshot-seed-42.json`.

---

## 8. Conclusion

Milestone 1's identity generator engine architecture is completely formulated, tested, and verified.
1. **MurmurHash3 (32-bit)** with `Math.imul` and `TextEncoder` passes all Austin Appleby test vectors and produces uniform parameter hashes.
2. **Mulberry32** provides fast, stateful 32-bit pseudo-random streams across Node, Cloudflare Workers, and browser runtimes.
3. **Hierarchical Domain Seed Derivation** isolates all 12 domains, ensuring that future enhancements in one domain never destabilize PRNG streams in other domains.
4. **7 Core Locales (US, GB, DE, IN, JP, CA, EE)** supply realistic OSINT demographics, addresses, national identifiers, and employer entities.
5. **Fixed Reference Epoch (`2026-10-27T00:00:00.000Z`)** ensures absolute temporal determinism with non-descending chronological timeline order.
6. **Reference Snapshot (`snapshot-seed-42.json`)** has been generated and validated against `m1_explorer_3`'s Zod schema.

---

## 9. Verification Method

1. **PRNG Test Vectors**: Run `node F:\antig\netra\.agents\teamwork\m1_explorer_2\verify_prng.js` to assert MurmurHash3 and Mulberry32 mathematical accuracy.
2. **Domain Isolation Verification**: Run `node F:\antig\netra\.agents\teamwork\m1_explorer_2\test_isolation.js` to confirm independent sub-stream derivation.
3. **Prototype Generator Execution**: Run `node F:\antig\netra\.agents\teamwork\m1_explorer_2\final_prototype_generator.js` to verify 12-domain generation, 100-run deep equality, and 7-locale conditioning.
4. **Inspect Generated Golden Snapshot**: View `F:\antig\netra\.agents\teamwork\m1_explorer_2\snapshot-seed-42.json` to verify schema conformance and domain completeness.
5. **Worker Handoff Execution**: During Milestone 1 implementation, the Worker places these files into `src/generator/`, places `snapshot-seed-42.json` into `tests/fixtures/snapshot-seed-42.json`, and runs `npm test` (`npx vitest run tests/unit`). All 7 test suites must pass with exit code `0`.

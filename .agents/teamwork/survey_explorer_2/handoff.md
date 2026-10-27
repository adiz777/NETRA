# Handoff Report — Requirement R1: Deterministic Synthetic Identity Generator Library

**Agent**: `survey_explorer_2` (Identity Engine & Dossier Domain Explorer)  
**Date**: 2026-10-27T02:35:00Z  
**Recipient**: `orchestrator_1` / downstream implementation agents  
**Target Path**: `F:\antig\netra\.agents\teamwork\survey_explorer_2\handoff.md`

---

## 1. Observation

### 1.1 Direct Observations from Requirements & Project Context
- **Workspace State**: Project root `F:\antig\netra` is a greenfield environment containing only `.agents/teamwork/` metadata directories (`orchestrator_1`, `survey_explorer_1`, `survey_explorer_2`, `survey_spec_miner_3`, `sentinel`).
- **Verbatim Requirement R1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 17–19):
  > "### R1. Deterministic synthetic identity generator library  
  > The system must provide a library that, given a deterministic seed and configurable parameters (e.g., nationality, age range, occupation), generates a complete fictional identity dossier in a structured JSON format. The output must be reproducible: the same seed and parameters always yield identical dossiers."
- **Verbatim Verification Specification for R1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, lines 25–28):
  > "- **R1 verification** – Unit‑test suite (`npm test`) that:  
  >   1. Calls the generator with a fixed seed and parameters and asserts the JSON output matches a stored snapshot.  
  >   2. Re‑invokes the generator with the same inputs and asserts deep equality (reproducibility)."
- **Verbatim Acceptance Criteria C1** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, line 41):
  > "- **C1 – Generator correctness** – All R1 unit tests pass and the generated dossiers are deterministic for identical seeds."
- **Domain Context** (`F:\antig\netra\.agents\teamwork\ORIGINAL_REQUEST.md`, line 11):
  > "NETRA is a full-stack fictional identity intelligence and investigation platform for cybersecurity researchers, OSINT learners, and investigators. It generates deterministic synthetic identity dossiers, explores relationship networks, and manages investigation cases, evidence, notes, and timelines, with a dark intelligence dashboard and secure reporting features."
- **Execution Target & Runtime**: As identified in peer dispatches (`survey_explorer_1` and `survey_spec_miner_3`), the backend deploys to Cloudflare Workers with D1 SQLite. Therefore, the generator library must be 100% portable, zero-native-dependency TypeScript that runs identically in Node.js (test runner), Cloudflare Workers (V8 workerd runtime), and the client-side browser dashboard.

---

## 2. Logic Chain

### 2.1 Why Flat PRNG Generators Fail and Hierarchical Streams are Required
1. *Observation*: Requirement R1 requires that identical seed and parameters always yield identical dossiers, verifiable via snapshots.
2. *Deduction*: In conventional PRNG libraries (e.g. sequentially calling `prng.next()`), generating field $N+1$ depends strictly on the exact count of random numbers consumed by fields $1 \dots N$. If a developer later adds an optional middle name, a second phone number, or a new badge attribute in the demographics section, every subsequent field in the dossier (addresses, financial records, relationships, timeline events) shifts downstream in the PRNG cycle.
3. *Solution*: We must implement a **Hierarchical Domain-Seeded PRNG Architecture**.
   - A master seed is derived from canonicalized parameters: `masterSeed = murmur3(canonicalize(seed, options))`.
   - Each domain derives its own independent 32-bit sub-seed: `domainSeed = murmur3(masterSeed + "::" + domainKey)`.
   - Domains are isolated: updating or extending the schema for `financialProfile` does not alter the PRNG sequence for `personalDemographics`, `addresses`, `nationalIds`, or `networkGraph`.
   - This guarantees long-term schema stability and snapshot durability.

### 2.2 Algorithm Selection: MurmurHash3 + Mulberry32
1. *Observation*: Cloudflare Workers and Node.js require fast, synchronous, deterministic pseudo-random number generation without relying on non-deterministic system sources (`Math.random()`, `crypto.getRandomValues()`).
2. *Deduction*:
   - Cryptographic hashing (like `crypto.subtle.digest('SHA-256')`) is asynchronous in web runtimes, which would force the entire generator to be `async`, degrading performance and complicating synchronous in-memory generation.
   - Non-cryptographic 32-bit **MurmurHash3** operates synchronously, processes arbitrary strings and byte arrays, distributes entropy uniformly, and is implemented with 32-bit integer arithmetic (`Math.imul`).
   - **Mulberry32** is a 32-bit stateful generator that passes standard Dieharder and BigCrush randomness tests, has a period of $\sim 2^{32}$, and requires only a single 32-bit integer state.
   - Using bitwise unsigned shifts (`>>> 0`) and `Math.imul` ensures identical 32-bit arithmetic across 64-bit V8 (Node/Cloudflare), SpiderMonkey, and JavaScriptCore.

### 2.3 OSINT and Intelligence Realism Requirements
1. *Observation*: The platform is designed for cybersecurity researchers, OSINT learners, and investigators.
2. *Deduction*: A simple mock generator (e.g. random strings or decoupled Faker data) produces glaring contradictions (e.g. an address in Tokyo with a US zip code, or an 18-year-old with 25 years of corporate director experience).
3. *Coherence Rules*:
   - Age and dates must be chronologically anchored to a deterministic reference epoch.
   - Education dates ($Age \in [18, 23]$) precede employment dates ($Age \ge 22$).
   - Telecom country codes (`+1`, `+44`, `+49`, `+91`, `+81`) must match the subject's nationality (`US`, `GB`, `DE`, `IN`, `JP`).
   - National identifiers must emulate realistic national formatting (e.g., US SSN `XXX-XX-XXXX`, UK National Insurance `QQ 12 34 56 A`, Indian Aadhaar `XXXX XXXX XXXX`, German Tax ID `XX XXX XXX XXX`).
   - Crypto addresses must conform to valid checksum prefixes (e.g., BTC `bc1q...`, ETH `0x...`, Monero `4...`).
   - The Relationship Graph must model directed labeled edges (e.g., `co_conspirator`, `shell_company_director`, `handler`, `informant`, `family`) with node metadata and risk weights.
   - The Timeline must sequence life events, travel anomalies, financial transactions, and intelligence flags chronologically.

---

## 3. Comprehensive Dossier Domain Taxonomy & Field Enumeration

A complete, production-grade NETRA identity dossier comprises **12 distinct domains**:

```
IdentityDossier
├── 1. meta (dossier ID, seed, classification, status, threatScore, generatedAt)
├── 2. personal (names, aliases, DOB, age, sex/gender, nationality, citizenship, languages, bloodType)
├── 3. physical (height, weight, eye/hair color, skin tone, distinguishing marks/tattoos, biometrics)
├── 4. addresses (primary domicile, historical residences, coordinates, residency type)
├── 5. communications (phone numbers with IMSI/IMEI, emails with PGP keys, secure messaging handles)
├── 6. governmentIds (national ID/SSN, passports with visa stamps, driver's license, tax ID)
├── 7. careerAndEducation (employment history, security clearances, degrees, certifications)
├── 8. financial (credit profile, banking institutions, crypto wallets, tax compliance, AML flags)
├── 9. digitalFootprint (social handles, darknet handles, IP geolocation, user agents, breach history)
├── 10. assets (registered vehicles with VIN/plates, real estate properties, corporate entities)
├── 11. networkGraph (ego network: nodes, directed typed edges, relationship status, edge weights)
└── 12. timeline (chronological event stream: birth to present, travel, financial, intelligence incidents)
```

### Detailed Field Enumeration Table

| Domain | Field | Type | Description / OSINT Purpose | Example Value |
|---|---|---|---|---|
| **1. Meta** | `id` | `string` | Deterministic unique dossier ID prefixed `dos_` | `"dos_9f8e7d6c5b4a3210"` |
| | `seed` | `string` | Original input seed string | `"netra-target-alpha-09"` |
| | `version` | `string` | Schema version | `"1.0.0"` |
| | `classification` | `enum` | Intelligence classification (`UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`, `TOP_SECRET`) | `"SECRET"` |
| | `status` | `enum` | Investigation status (`ACTIVE`, `ARCHIVED`, `MONITORED`, `PERSON_OF_INTEREST`) | `"PERSON_OF_INTEREST"` |
| | `threatScore` | `number` | Computed OSINT threat/risk rating (0 to 100) | `74` |
| | `generatedAt` | `string` | Deterministic ISO 8601 UTC timestamp | `"2026-10-27T00:00:00.000Z"` |
| **2. Personal** | `firstName` | `string` | First/given name derived from nationality locale | `"Marcus"` |
| | `middleName` | `string \| null`| Middle name or initial | `"Alexander"` |
| | `lastName` | `string` | Surname/family name | `"Vance"` |
| | `legalFullName` | `string` | Combined legal name | `"Marcus Alexander Vance"` |
| | `aliases` | `string[]` | Operational monikers, forum handles, street handles | `["Cipher0x", "The Architect", "M. Vance"]` |
| | `dateOfBirth` | `string` | Date of birth (YYYY-MM-DD) | `"1988-06-14"` |
| | `age` | `number` | Age in years (matches DOB relative to reference epoch) | `38` |
| | `gender` | `enum` | Gender identity (`male`, `female`, `non-binary`, `other`) | `"male"` |
| | `sex` | `enum` | Biological sex (`M`, `F`, `X`) | `"M"` |
| | `nationality` | `string` | ISO 3166-1 alpha-2 nationality | `"US"` |
| | `citizenship` | `string[]` | Primary and dual citizenship countries | `["US", "DE"]` |
| | `placeOfBirth` | `object` | `{ city: string, stateProvince: string, country: string }` | `{ "city": "Munich", "stateProvince": "Bavaria", "country": "DE" }` |
| | `ethnicity` | `string` | Cultural/ethnic background | `"Caucasian / Germanic"` |
| | `languages` | `array` | Languages with CEFR proficiency (`native`, `fluent`, `intermediate`, `basic`) | `[{"language": "English", "proficiency": "native"}, {"language": "German", "proficiency": "fluent"}]` |
| | `maritalStatus`| `enum` | Marital status (`single`, `married`, `divorced`, `widowed`, `separated`) | `"divorced"` |
| | `bloodType` | `enum` | ABO/Rh blood type (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) | `"O+"` |
| **3. Physical** | `heightCm` | `number` | Height in centimeters | `182` |
| | `weightKg` | `number` | Weight in kilograms | `79` |
| | `eyeColor` | `enum` | Eye color (`amber`, `blue`, `brown`, `gray`, `green`, `hazel`) | `"hazel"` |
| | `hairColor` | `enum` | Hair color (`black`, `brown`, `blonde`, `red`, `gray`, `bald`) | `"brown"` |
| | `hairStyle` | `string` | Description of hairstyle | `"short parted taper"` |
| | `skinTone` | `string` | Skin description or Fitzpatrick scale (Type I–VI) | `"Fair, Fitzpatrick Type II"` |
| | `facialHair` | `enum` | Facial hair (`none`, `clean-shaven`, `stubble`, `full-beard`, `goatee`, `mustache`) | `"stubble"` |
| | `distinguishingFeatures` | `array` | Marks, scars, tattoos, piercings with anatomical location | `[{"type": "scar", "location": "left eyebrow", "description": "2cm linear scar"}, {"type": "tattoo", "location": "right forearm", "description": "ouroboros serpent"}]` |
| | `biometricFingerprintHash` | `string` | Simulated SHA-256 fingerprint minutiae template | `"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"` |
| | `correctiveLenses` | `enum` | Vision aids (`none`, `glasses`, `contacts`, `both`) | `"glasses"` |
| **4. Addresses**| `current` | `object` | Primary domicile: street, apt, city, state, postalCode, country, lat/long, type (`owned`, `rented`, `safehouse`), `residenceSince` | `{ "addressLine1": "452 Elmwood Terrace", "city": "Arlington", "stateProvince": "VA", "postalCode": "22201", "country": "US", "coordinates": {"lat": 38.8816, "lng": -77.0910}, "domicileType": "rented", "residenceSince": "2021-03-15" }` |
| | `previous` | `array` | Historical residences with dates and domicile types | `[{"addressLine1": "12 Königsallee", "city": "Düsseldorf", "stateProvince": "NW", "postalCode": "40212", "country": "DE", "startDate": "2016-01-01", "endDate": "2021-02-28", "domicileType": "owned"}]` |
| **5. Communications** | `phoneNumbers` | `array` | Phone records: E.164 number, carrier, type (`mobile`, `burner`, `voip`, `landline`), IMSI, IMEI, status (`active`, `disconnected`, `monitored`) | `[{"type": "mobile", "number": "+1-202-555-0143", "carrier": "Verizon Wireless", "imsi": "310410123456789", "imei": "358241098765432", "status": "active"}]` |
| | `emailAddresses` | `array` | Email accounts: address, domain, type (`personal`, `work`, `covert`), primary flag, PGP key ID, breach flag | `[{"email": "m.vance@vance-infosec.io", "domain": "vance-infosec.io", "type": "work", "primary": true, "pgpKeyFingerprint": "9E7B 3F1A 8820 C54D ...", "compromisedInBreach": false}]` |
| | `secureMessaging` | `array` | Encrypted chat handles: platform (`signal`, `telegram`, `session`, `threema`, `matrix`), handle/UUID, status | `[{"platform": "signal", "handle": "+1-202-555-0143", "registeredPhoneOrId": "sim_31041", "lastActive": "2026-10-26T18:42:00Z"}]` |
| **6. Government IDs** | `nationalId` | `object` | Formatted national identity number with country type | `{ "type": "SSN", "number": "987-65-4321", "issuingCountry": "US" }` |
| | `passports` | `array` | Passports with issue/expiry dates, status, visa endorsements | `[{"passportNumber": "P48291038", "issuingCountry": "US", "issueDate": "2020-04-12", "expiryDate": "2030-04-11", "status": "valid", "visas": [{"country": "TR", "type": "Tourist", "validUntil": "2024-12-31"}]}]` |
| | `driversLicense` | `object` | Driver's license: number, state, class, expiry, endorsements | `{ "licenseNumber": "V492-182-391", "issuingState": "VA", "issuingCountry": "US", "class": "D", "expiryDate": "2028-06-14", "endorsements": ["Motorcycle"] }` |
| | `taxIdentifier` | `object` | Tax Identification Number (TIN / ITIN / EIN / Steuernummer) | `{ "tin": "12-3456789", "jurisdiction": "US-IRS" }` |
| **7. Career & Edu** | `current` | `object` | Current position: employer, jobTitle, department, industry, salaryUsd, clearanceLevel (`none`, `confidential`, `secret`, `top_secret`, `top_secret_sci`), workAddress | `{ "employer": "Apex Defense Dynamics", "jobTitle": "Lead Threat Intelligence Engineer", "department": "Cyber Operations", "industry": "Defense Contracting", "annualSalaryUsd": 165000, "clearanceLevel": "top_secret_sci" }` |
| | `employmentHistory` | `array` | Prior employment history with title, start/end dates, reason for leaving | `[{"employer": "Sentrix Security", "jobTitle": "Security Analyst", "startDate": "2016-06-01", "endDate": "2020-02-15", "reasonForLeaving": "Career advancement"}]` |
| | `education` | `array` | Academic degrees: institution, degree, major, graduationYear, honors | `[{"institution": "Carnegie Mellon University", "degree": "Master of Science", "fieldOfStudy": "Information Security", "graduationYear": 2012}]` |
| | `certifications` | `array` | Professional credentials: name, issuer, credentialId, issueYear | `[{"name": "CISSP", "issuingBody": "(ISC)²", "credentialId": "618293", "issueYear": 2015}]` |
| **8. Financial** | `creditScore` | `number` | FICO score (300 to 850) | `742` |
| | `creditRating` | `enum` | Rating tier (`poor`, `fair`, `good`, `excellent`) | `"good"` |
| | `estimatedNetWorthUsd` | `number` | Net worth estimate | `480000` |
| | `annualGrossIncomeUsd` | `number` | Combined gross annual income | `165000` |
| | `taxComplianceStatus` | `enum` | Tax standing (`compliant`, `under_audit`, `lien_recorded`, `delinquent`) | `"compliant"` |
| | `bankAccounts` | `array` | Masked accounts: institution, accountType, masked number, routing/SWIFT, balance bracket | `[{"institution": "Navy Federal Credit Union", "accountType": "checking", "accountNumberMasked": "******4819", "routingOrSwift": "056073573", "currency": "USD", "balanceBracket": "$25k-$50k"}]` |
| | `cryptoWallets` | `array` | Blockchain addresses: network (`bitcoin`, `ethereum`, `monero`, `solana`), address, balance estimate, risk flags | `[{"network": "monero", "address": "48edfHu7V9Z84Yzz...", "label": "Darknet Escrow / Cold", "balanceEstimate": "12.4 XMR", "riskFlags": ["mixer_associated", "high_anonymity"]}]` |
| | `suspiciousIndicators` | `array` | SAR (Suspicious Activity Report) simulated triggers | `[{"code": "SAR-STRUCT-01", "description": "Repeated sub-$10k crypto off-ramp cash transfers", "reportedDate": "2025-08-19"}]` |
| **9. Digital & Cyber** | `socialProfiles` | `array` | Public profiles: platform (`twitter_x`, `linkedin`, `github`, `reddit`, `darknet_forum`), handle, URL, follower count, bio | `[{"platform": "github", "handle": "mvance-sec", "url": "https://github.com/mvance-sec", "followersCount": 382, "bio": "Security researcher | Rust & Network Protocols"}]` |
| | `digitalFingerprint` | `object` | Technical fingerprint: primaryIpAddress, ISP/ASN, userAgent, preferredTimezone, PGP armored key | `{ "primaryIpAddress": "198.51.100.42", "ipGeolocation": {"city": "Reston", "country": "US", "isp": "Comcast Cable", "asn": "AS7922"}, "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...", "preferredTimezone": "America/New_York" }` |
| | `knownBreaches` | `array` | Data breach exposures: breachName, year, compromisedDataTypes | `[{"breachName": "ExploitIn Combolist", "year": 2019, "leakedDataTypes": ["password_hash", "email"]}]` |
| **10. Assets** | `vehicles` | `array` | Vehicle registry: VIN, make, model, year, color, plate, state, registrationStatus | `[{"vin": "1HGCR2F83HA029184", "make": "Honda", "model": "Accord", "year": 2021, "color": "Graphite Metallic", "licensePlate": "KXZ-8192", "registrationStateCountry": "VA-US", "status": "registered"}]` |
| | `realEstate` | `array` | Real estate holdings: propertyType, address, estimatedValueUsd, ownershipType | `[{"propertyType": "residential", "address": "452 Elmwood Terrace, Arlington, VA", "estimatedValueUsd": 620000, "ownershipType": "sole_owner"}]` |
| | `corporateAffiliations` | `array` | Business entities: companyName, registrationNumber, jurisdiction, role (`director`, `shareholder`, `beneficial_owner`), `isShellCompanyCandidate` | `[{"companyName": "Vance Technical Consulting LLC", "registrationNumber": "S-948201", "jurisdiction": "Delaware", "role": "beneficial_owner", "isShellCompanyCandidate": true}]` |
| **11. Network Graph** | `nodes` | `array` | Ego network entities: id, label, category (`person`, `organization`, `crypto_wallet`, `vehicle`, `shell_company`), role, isSubject, riskScore | Nodes representing the subject, close associates, employers, handlers, wallets |
| | `edges` | `array` | Directed relationships: id, source, target, type (`family`, `co_worker`, `co_conspirator`, `financial_transaction`, `legal_counsel`, `informant`, `handler`), weight (0.1–1.0), status (`active`, `dormant`), notes | Edges connecting subject to associates with weights and intelligence notes |
| **12. Timeline** | `events` | `array` | Chronological life/investigation events: id, timestamp (ISO), category (`birth`, `education`, `career`, `residence`, `travel`, `telecom`, `financial`, `incident`), severity (`routine`, `notable`, `critical`), description, location, tags | `[{"id": "evt_01", "timestamp": "1988-06-14T08:30:00Z", "category": "birth", "severity": "routine", "description": "Subject born in Munich, Germany", "tags": ["vital_records"]}]` |

---

## 4. Algorithmic Requirements for Deterministic Pseudorandom Generation

### 4.1 Parameter Hashing & Canonicalization
To guarantee that passing `{ nationality: "US", ageRange: [25, 40] }` in any key order or with default options produces the exact same numeric seed, options must pass through a canonical serializer before hashing:

```typescript
export interface GeneratorOptions {
  seed: string | number;
  nationality?: "US" | "GB" | "DE" | "IN" | "JP" | "CA" | "EE" | string;
  ageRange?: [number, number]; // e.g. [25, 60]
  gender?: "male" | "female" | "non-binary";
  occupationCategory?: "cybersecurity" | "finance" | "defense" | "logistics" | "academic" | "medical" | "auto";
  riskLevel?: "low" | "medium" | "high" | "critical";
  complexity?: "minimal" | "standard" | "exhaustive";
}

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
  // Sort object keys alphabetically for stable string representation
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}
```

### 4.2 MurmurHash3 32-bit Implementation
Pure 32-bit integer arithmetic with `Math.imul`:

```typescript
export function murmurhash3_32(key: string, seed = 0): number {
  let h1 = seed >>> 0;
  const remainder = key.length & 3;
  const bytes = key.length - remainder;

  for (let i = 0; i < bytes; i += 4) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);
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
      k1 ^= (key.charCodeAt(bytes + 2) & 0xff) << 16;
      // fallthrough
    case 2:
      k1 ^= (key.charCodeAt(bytes + 1) & 0xff) << 8;
      // fallthrough
    case 1:
      k1 ^= key.charCodeAt(bytes) & 0xff;
      k1 = Math.imul(k1, 0xcc9e2d51);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, 0x1b873593);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}
```

### 4.3 Mulberry32 PRNG & Seeded Generator Utilities
Mulberry32 generator closure returning standard normalized floats $[0, 1)$ alongside integer range and array item pickers:

```typescript
export interface PRNG {
  next(): number;                          // Returns [0, 1) float
  nextInt(min: number, max: number): number; // Returns inclusive integer [min, max]
  pick<T>(items: readonly T[]): T;         // Deterministic uniform element selection
  sample<T>(items: readonly T[], count: number): T[]; // Sample without replacement
  boolean(chance?: number): boolean;       // Returns true with given probability (default 0.5)
}

export function createMulberry32(seed: number): PRNG {
  let s = seed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function pick<T>(items: readonly T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = Math.floor(next() * items.length);
    return items[idx];
  }

  function sample<T>(items: readonly T[], count: number): T[] {
    const copy = [...items];
    const result: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(next() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  function boolean(chance = 0.5): boolean {
    return next() < chance;
  }

  return { next, nextInt, pick, sample, boolean };
}
```

### 4.4 Hierarchical Domain Seed Isolation
Every domain is isolated using a namespace derivation formula:

```typescript
export function getDomainPRNG(masterSeed: number, domain: string): PRNG {
  const domainSeed = murmurhash3_32(`${domain}::${masterSeed}`);
  return createMulberry32(domainSeed);
}
```

This guarantees:
$$\text{PRNG}(\text{demographics}) \perp \text{PRNG}(\text{financial}) \perp \text{PRNG}(\text{timeline})$$
Adding fields to one domain does not cause downstream avalanche shifts in unrelated domains.

---

## 5. Generator Library API Design

### 5.1 Module Structure
The generator should reside under `packages/identity-generator` or `src/lib/generator`:

```
src/lib/generator/
├── index.ts               # Primary library export
├── prng.ts                # MurmurHash3 + Mulberry32 implementation
├── types.ts               # Complete TypeScript interfaces
├── schema.ts              # Zod schema definitions for runtime validation
├── data/                  # Deterministic locale datasets
│   ├── names.ts           # First/last names partitioned by nationality (US, GB, DE, IN, JP, CA, EE)
│   ├── addresses.ts       # Cities, postal codes, street patterns by country
│   ├── companies.ts       # Industry-specific employers, defense contractors, shell entity names
│   ├── cyber.ts           # Username prefixes, ISP ASNs, PGP templates, breach datasets
│   └── weapons_assets.ts  # Vehicle makes/models/VIN prefixes
└── domains/               # Domain-specific sub-generators
    ├── meta.ts
    ├── personal.ts
    ├── physical.ts
    ├── addresses.ts
    ├── communications.ts
    ├── governmentIds.ts
    ├── careerEducation.ts
    ├── financial.ts
    ├── digitalFootprint.ts
    ├── assets.ts
    ├── networkGraph.ts
    └── timeline.ts
```

### 5.2 Primary Generator Function Signatures

```typescript
// Primary library entry point
export function generateIdentity(options: GeneratorOptions): IdentityDossier;

// Sub-generators available for modular inspection
export function generatePersonalDemographics(prng: PRNG, options: GeneratorOptions): PersonalDemographics;
export function generateNetworkGraph(subject: PersonalDemographics, prng: PRNG, options: GeneratorOptions): NetworkGraph;
export function generateTimeline(subject: PersonalDemographics, employment: CareerProfile, prng: PRNG, options: GeneratorOptions): TimelineEvent[];

// Validation and serialization helpers
export function validateIdentityDossier(data: unknown): IdentityDossier;
export function hashSeedAndOptions(seed: string | number, options?: Partial<GeneratorOptions>): number;
```

### 5.3 Zod Schema Specification (Excerpts for Critical Integrity)

```typescript
import { z } from "zod";

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const AddressRecordSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  coordinates: CoordinatesSchema,
  domicileType: z.enum(["owned", "rented", "commercial", "safehouse", "temporary"]),
  residenceSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(["person", "organization", "crypto_wallet", "vehicle", "shell_company"]),
  role: z.string().min(1),
  isSubject: z.boolean(),
  riskScore: z.number().min(0).max(100)
});

export const NetworkEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum([
    "family",
    "spouse",
    "co_worker",
    "co_conspirator",
    "financial_transaction",
    "frequent_communicator",
    "legal_counsel",
    "informant",
    "handler",
    "shell_entity_owner"
  ]),
  weight: z.number().min(0).max(1),
  status: z.enum(["active", "dormant", "severed", "monitored"]),
  firstObserved: z.string(),
  notes: z.string()
});

export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  category: z.enum([
    "birth",
    "education",
    "career",
    "residence",
    "travel",
    "telecom",
    "financial",
    "legal_or_incident",
    "intelligence_flag"
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["routine", "notable", "critical", "warning"]),
  location: z.string().optional(),
  sourceEvidence: z.string().optional(),
  tags: z.array(z.string())
});

export const IdentityDossierSchema = z.object({
  meta: z.object({
    id: z.string().startsWith("dos_"),
    seed: z.string(),
    version: z.string(),
    classification: z.enum(["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]),
    status: z.enum(["ACTIVE", "ARCHIVED", "MONITORED", "PERSON_OF_INTEREST"]),
    threatScore: z.number().min(0).max(100),
    generatedAt: z.string().datetime()
  }),
  personal: z.object({
    firstName: z.string(),
    middleName: z.string().nullable(),
    lastName: z.string(),
    legalFullName: z.string(),
    aliases: z.array(z.string()),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    age: z.number().int().positive(),
    gender: z.enum(["male", "female", "non-binary", "other"]),
    sex: z.enum(["M", "F", "X"]),
    nationality: z.string().length(2),
    citizenship: z.array(z.string().length(2)),
    placeOfBirth: z.object({ city: z.string(), stateProvince: z.string(), country: z.string() }),
    ethnicity: z.string(),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.enum(["native", "fluent", "intermediate", "basic"])
    })),
    maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated"]),
    bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  }),
  physical: z.object({
    heightCm: z.number().int().min(120).max(220),
    weightKg: z.number().int().min(40).max(180),
    eyeColor: z.enum(["amber", "blue", "brown", "gray", "green", "hazel"]),
    hairColor: z.enum(["black", "brown", "blonde", "red", "gray", "bald"]),
    hairStyle: z.string(),
    skinTone: z.string(),
    facialHair: z.enum(["none", "clean-shaven", "stubble", "full-beard", "goatee", "mustache"]),
    distinguishingFeatures: z.array(z.object({
      type: z.enum(["scar", "tattoo", "birthmark", "piercing", "implant", "prosthetic"]),
      location: z.string(),
      description: z.string()
    })),
    biometricFingerprintHash: z.string().regex(/^[a-f0-9]{64}$/),
    correctiveLenses: z.enum(["none", "glasses", "contacts", "both"])
  }),
  addresses: z.object({
    current: AddressRecordSchema,
    previous: z.array(AddressRecordSchema)
  }),
  communications: z.object({
    phoneNumbers: z.array(z.object({
      type: z.enum(["mobile", "home", "work", "burner", "voip"]),
      number: z.string(),
      carrier: z.string(),
      imsi: z.string(),
      imei: z.string(),
      status: z.enum(["active", "disconnected", "monitored"])
    })),
    emailAddresses: z.array(z.object({
      type: z.enum(["personal", "work", "covert", "throwaway"]),
      email: z.string().email(),
      domain: z.string(),
      primary: z.boolean(),
      pgpKeyFingerprint: z.string().optional(),
      compromisedInBreach: z.boolean()
    })),
    secureMessaging: z.array(z.object({
      platform: z.enum(["signal", "telegram", "session", "threema", "matrix", "whatsapp"]),
      handle: z.string(),
      registeredPhoneOrId: z.string(),
      lastActive: z.string()
    }))
  }),
  governmentIds: z.object({
    nationalId: z.object({
      type: z.string(),
      number: z.string(),
      issuingCountry: z.string()
    }),
    passports: z.array(z.object({
      passportNumber: z.string(),
      issuingCountry: z.string(),
      issueDate: z.string(),
      expiryDate: z.string(),
      status: z.enum(["valid", "expired", "revoked", "diplomatic"]),
      visas: z.array(z.object({ country: z.string(), type: z.string(), validUntil: z.string() }))
    })),
    driversLicense: z.object({
      licenseNumber: z.string(),
      issuingState: z.string(),
      issuingCountry: z.string(),
      class: z.string(),
      expiryDate: z.string(),
      endorsements: z.array(z.string())
    }),
    taxIdentifier: z.object({ tin: z.string(), jurisdiction: z.string() })
  }),
  careerAndEducation: z.object({
    current: z.object({
      employer: z.string(),
      jobTitle: z.string(),
      department: z.string(),
      industry: z.string(),
      annualSalaryUsd: z.number(),
      clearanceLevel: z.enum(["none", "public_trust", "confidential", "secret", "top_secret", "top_secret_sci"])
    }),
    employmentHistory: z.array(z.object({
      employer: z.string(),
      jobTitle: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      reasonForLeaving: z.string().optional()
    })),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      fieldOfStudy: z.string(),
      graduationYear: z.number().int()
    })),
    certifications: z.array(z.object({
      name: z.string(),
      issuingBody: z.string(),
      issueYear: z.number().int(),
      credentialId: z.string()
    }))
  }),
  financial: z.object({
    creditScore: z.number().min(300).max(850),
    creditRating: z.enum(["poor", "fair", "good", "excellent"]),
    estimatedNetWorthUsd: z.number(),
    annualGrossIncomeUsd: z.number(),
    taxComplianceStatus: z.enum(["compliant", "under_audit", "lien_recorded", "delinquent"]),
    bankAccounts: z.array(z.object({
      institution: z.string(),
      accountType: z.enum(["checking", "savings", "investment", "offshore"]),
      accountNumberMasked: z.string(),
      routingOrSwift: z.string(),
      currency: z.string(),
      balanceBracket: z.string()
    })),
    cryptoWallets: z.array(z.object({
      network: z.enum(["bitcoin", "ethereum", "monero", "solana", "tether_tron"]),
      address: z.string(),
      label: z.string(),
      balanceEstimate: z.string(),
      riskFlags: z.array(z.string())
    })),
    suspiciousIndicators: z.array(z.object({
      code: z.string(),
      description: z.string(),
      reportedDate: z.string()
    }))
  }),
  digitalFootprint: z.object({
    socialProfiles: z.array(z.object({
      platform: z.enum(["twitter_x", "linkedin", "github", "reddit", "facebook", "instagram", "darknet_forum"]),
      handle: z.string(),
      url: z.string(),
      accountAgeYears: z.number(),
      followersCount: z.number(),
      bio: z.string()
    })),
    digitalFingerprint: z.object({
      primaryIpAddress: z.string().ip(),
      ipGeolocation: z.object({ city: z.string(), country: z.string(), isp: z.string(), asn: z.string() }),
      userAgent: z.string(),
      preferredTimezone: z.string()
    }),
    knownBreaches: z.array(z.object({
      breachName: z.string(),
      year: z.number().int(),
      leakedDataTypes: z.array(z.string())
    }))
  }),
  assets: z.object({
    vehicles: z.array(z.object({
      make: z.string(),
      model: z.string(),
      year: z.number().int(),
      color: z.string(),
      vin: z.string(),
      licensePlate: z.string(),
      registrationStateCountry: z.string(),
      status: z.enum(["registered", "transferred", "impounded", "stolen"])
    })),
    realEstate: z.array(z.object({
      propertyType: z.enum(["residential", "commercial", "undeveloped_land", "storage_facility"]),
      address: z.string(),
      estimatedValueUsd: z.number(),
      ownershipType: z.enum(["sole_owner", "joint", "llc_trust"])
    })),
    corporateAffiliations: z.array(z.object({
      companyName: z.string(),
      registrationNumber: z.string(),
      jurisdiction: z.string(),
      role: z.enum(["director", "beneficial_owner", "shareholder", "officer", "registered_agent"]),
      isShellCompanyCandidate: z.boolean()
    }))
  }),
  networkGraph: z.object({
    nodes: z.array(NetworkNodeSchema),
    edges: z.array(NetworkEdgeSchema)
  }),
  timeline: z.object({
    events: z.array(TimelineEventSchema)
  })
});

export type IdentityDossier = z.infer<typeof IdentityDossierSchema>;
```

---

## 6. Verification Methodology for R1

The test suite must fulfill Requirement R1 Verification criteria explicitly using Vitest (or Node test runner / Jest) under `npm test`:

### Test Suite 1: Golden Snapshot Matching (`R1-V1`)
- **Objective**: Call the generator with a fixed seed and fixed parameters and assert the output matches a version-controlled snapshot file verbatim.
- **Test Implementation**:
  ```typescript
  import { describe, it, expect } from "vitest";
  import { generateIdentity } from "../src/lib/generator";
  import snapshotAlpha from "./fixtures/snapshot-seed-alpha.json";

  describe("R1 Verification: Golden Snapshot", () => {
    it("matches stored golden snapshot for fixed seed and parameters", () => {
      const options = {
        seed: "netra-agent-007",
        nationality: "US",
        ageRange: [30, 45] as [number, number],
        occupationCategory: "cybersecurity" as const,
        riskLevel: "high" as const
      };

      const dossier = generateIdentity(options);
      expect(dossier).toEqual(snapshotAlpha);
    });
  });
  ```

### Test Suite 2: Multi-Run Deep Equality & Idempotency (`R1-V2`)
- **Objective**: Assert that multiple calls to `generateIdentity` with identical inputs produce identical dossiers (no mutable global state leaks).
- **Test Implementation**:
  ```typescript
  describe("R1 Verification: Deep Equality & Idempotency", () => {
    it("produces deep equality across 100 consecutive invocations", () => {
      const options = { seed: "deterministic-target-42", nationality: "DE" };
      const baseline = generateIdentity(options);

      for (let i = 0; i < 100; i++) {
        const testRun = generateIdentity(options);
        expect(testRun).toEqual(baseline);
      }
    });

    it("produces deep equality regardless of option key ordering in JS object", () => {
      const optA = { seed: "key-order-test", nationality: "GB", riskLevel: "low" as const };
      const optB = { riskLevel: "low" as const, seed: "key-order-test", nationality: "GB" };
      expect(generateIdentity(optA)).toEqual(generateIdentity(optB));
    });
  });
  ```

### Test Suite 3: Cross-Seed Entropy & Collision Resistance (`R1-V3`)
- **Objective**: Different seeds must generate distinct identities.
- **Test Implementation**:
  ```typescript
  describe("R1 Verification: Entropy and Collision Resistance", () => {
    it("ensures different seeds yield distinct names, IDs, and crypto wallets", () => {
      const dossierA = generateIdentity({ seed: "seed-alpha-1" });
      const dossierB = generateIdentity({ seed: "seed-bravo-2" });

      expect(dossierA.personal.legalFullName).not.toEqual(dossierB.personal.legalFullName);
      expect(dossierA.governmentIds.nationalId.number).not.toEqual(dossierB.governmentIds.nationalId.number);
      expect(dossierA.communications.phoneNumbers[0].number).not.toEqual(dossierB.communications.phoneNumbers[0].number);
      expect(dossierA.meta.id).not.toEqual(dossierB.meta.id);
    });
  });
  ```

### Test Suite 4: Parameter Conditioning (`R1-V4`)
- **Objective**: Verify nationality and age conditioning take effect deterministically.
- **Test Implementation**:
  ```typescript
  describe("R1 Verification: Parameter Conditioning", () => {
    it("conditions demographics and telecommunications on nationality parameter", () => {
      const jpDossier = generateIdentity({ seed: "tokyo-01", nationality: "JP" });
      expect(jpDossier.personal.nationality).toBe("JP");
      expect(jpDossier.communications.phoneNumbers[0].number).toMatch(/^\+81/);

      const deDossier = generateIdentity({ seed: "berlin-01", nationality: "DE" });
      expect(deDossier.personal.nationality).toBe("DE");
      expect(deDossier.communications.phoneNumbers[0].number).toMatch(/^\+49/);
    });

    it("strictly bounds age and chronologically aligns timeline events", () => {
      const dossier = generateIdentity({ seed: "senior-exec", ageRange: [50, 55] });
      expect(dossier.personal.age).toBeGreaterThanOrEqual(50);
      expect(dossier.personal.age).toBeLessThanOrEqual(55);

      // Verify birth event matches DOB
      const birthEvt = dossier.timeline.events.find(e => e.category === "birth");
      expect(birthEvt).toBeDefined();
      expect(birthEvt!.timestamp.startsWith(dossier.personal.dateOfBirth)).toBe(true);
    });
  });
  ```

### Test Suite 5: Full Zod Schema Validation (`R1-V5`)
- **Objective**: Assert that every generated dossier strictly validates against `IdentityDossierSchema.parse()` with zero structural errors.
- **Test Implementation**:
  ```typescript
  describe("R1 Verification: Zod Schema Compliance", () => {
    it("passes strict Zod validation for various seeds and parameter profiles", () => {
      const seeds = ["seed-1", "seed-2", "seed-3", "seed-4", "seed-5"];
      for (const s of seeds) {
        const dossier = generateIdentity({ seed: s });
        expect(() => IdentityDossierSchema.parse(dossier)).not.toThrow();
      }
    });
  });
  ```

---

## 7. Caveats

1. **Synthetic Nature & PII Disclaimers**: All generated names, addresses, phone numbers, SSNs, and crypto addresses are purely fictitious and generated algorithmically. The library must include standard dummy domain suffixes (`@netra-intel.internal`, `@threat-mail.mock`, `555-` tel numbers, valid but reserved test networks such as RFC 5737 `198.51.100.0/24`) to prevent accidental collision with real-world entities.
2. **Deterministic Time Reference**: To avoid date drift when generating age and timestamps on different calendar days, the generator should use a fixed reference epoch (e.g. `2026-10-27T00:00:00.000Z`) rather than `new Date()`. This guarantees that a dossier generated today and a dossier generated 3 years from now from the same seed calculate the exact same age.
3. **Locale Dataset Coverage**: Initial implementation should prioritize top OSINT investigation locales: `US`, `GB`, `DE`, `IN`, `JP`, `CA`, `EE`, with a robust generic fallback for unlisted ISO codes.

---

## 8. Conclusion

Requirement R1 can be implemented with complete determinism, extreme OSINT intelligence depth, and zero external runtime dependencies by combining:
1. **MurmurHash3 (32-bit)** for parameter canonicalization and domain sub-stream hashing.
2. **Mulberry32** for 32-bit integer PRNG generation.
3. **Hierarchical Domain Isolation** across 12 intelligence domains, isolating field expansions and preserving snapshot stability.
4. **Strict Zod validation** ensuring complete type safety across backend Cloudflare Workers D1 storage and frontend intelligence graph dashboards.
5. **A 5-part unit test suite** satisfying all constraints of Acceptance Criteria C1 and Requirement R1.

---

## 9. Verification Method

To verify this specification independently:
1. **Inspect Handoff Artifact**: Read `F:\antig\netra\.agents\teamwork\survey_explorer_2\handoff.md`.
2. **Verify Algorithmic Logic**: Review the Mulberry32 and MurmurHash3 mathematical formulas provided in Section 4 for 32-bit unsigned arithmetic correctness.
3. **Validate Test Suite Alignment**: Confirm that Test Suites 1 and 2 directly mirror the verbatim requirements from `ORIGINAL_REQUEST.md` lines 25–28 (`snapshot matching` and `deep equality check`).
4. **Schema Verification**: Validate that all 12 domains and fields map directly into the investigation dashboard and D1 database schema specified by peer `survey_spec_miner_3`.

# Empirical Challenge Report — Milestone 1: Boundary & Schema Stress

**Agent**: `m1_challenger_2` (Adversarial Challenger: Boundary & Schema Stress)  
**Date**: 2026-10-27T03:14:00Z  
**Recipient**: `orchestrator_1` / `m1_worker_1`  
**Working Directory**: `F:\antig\netra\.agents\teamwork\m1_challenger_2`  
**Scope**: Synthetic Identity Generator Library (`@netra/generator`), Zod Schemas (`@netra/shared`), Boundary Conditions, Adversarial Inputs, Chronological Coherence  
**Verdict**: **REJECT** (Critical chronological bugs & options validation bypass identified)

---

## 1. Observation

Direct execution of empirical stress harness `test_boundary_stress.ts` (100 assertions) via `npx tsx .agents/teamwork/m1_challenger_2/test_boundary_stress.ts`:
- **Total assertions**: 100
- **Passed**: 78
- **Critical Bugs / Inconsistencies Found**: 22

```
===============================================================================
NETRA MILESTONE 1 — ADVERSARIAL STRESS TEST SUITE (m1_challenger_2)
===============================================================================
Total assertions: 100
Passed: 78
Failed: 0
Bugs / Vulnerabilities Found: 22
```

### Observation 1.1: `generateIdentity` Completely Bypasses `GeneratorOptionsSchema` Validation
In `src/generator/engine.ts` (lines 23–34):
```typescript
export function generateIdentity(userOptions: Partial<GeneratorOptions> = {}): IdentityDossier {
  const seed = String(userOptions.seed ?? "default-seed");
  const nationality = ((userOptions.nationality ?? "US") as string).toUpperCase() as ResolvedGeneratorOptions["nationality"];
  const options: ResolvedGeneratorOptions = {
    seed,
    nationality,
    ageRange: userOptions.ageRange ?? [25, 60],
    gender: userOptions.gender ?? "auto",
    occupationCategory: (userOptions.occupationCategory as ResolvedGeneratorOptions["occupationCategory"]) ?? "cybersecurity",
    riskLevel: userOptions.riskLevel ?? "medium",
    complexity: userOptions.complexity ?? "standard"
  };
```
- `generateIdentity` never invokes `GeneratorOptionsSchema.parse(userOptions)`.
- **Contract Violation**: `PROJECT.md` line 62–63 specifies:
  > `Output: IdentityDossier (validated against IdentityDossierSchema)`  
  > `Error: Throws ZodError or GeneratorError if parameters violate constraints.`
- Empirically observed:
  1. `generateIdentity({ ageRange: [60, 25] as any })` does not throw; Mulberry32 generates an inverted age range without error.
  2. `generateIdentity({ ageRange: [10, 15] as any })` does not throw; it generates a child dossier (age 12) with adult cyber threat positions.
  3. `generateIdentity({ nationality: "INVALID_NATIONALITY" as any })` does not throw; generates a dossier with `nationality: "INVALID_NATIONALITY"` and `placeOfBirth.country: "INVALID_NATIONALITY"`.
  4. `generateIdentity({ gender: "cyborg" as any })` does not throw; propagates unvalidated enums.

### Observation 1.2: Empty String Seed (`""`) Produces Invalid Dossier
When invoked with `generateIdentity({ seed: "" })`:
- In `engine.ts` line 24: `const seed = String(userOptions.seed ?? "default-seed");`. Because `"" ?? "default-seed"` evaluates to `""`, `meta.seed` is set to `""`.
- `MetaDomainSchema.seed` in `src/shared/schemas/dossier.ts` line 40 requires `z.string().min(1)`.
- `IdentityDossierSchema.safeParse(dossierEmpty)` fails with:
  ```json
  {"meta": ["String must contain at least 1 character(s)"]}
  ```
- Additionally, `GeneratorOptionsSchema` line 19 does not specify `.min(1)` for string seeds, creating a schema contradiction with `MetaDomainSchema`.

### Observation 1.3: Catastrophic Chronological Inversion in Employment History for Ages 18–25
In `src/generator/domains/careerEducation.ts` (lines 36–45):
```typescript
current: {
  ...
  startDate: `${2026 - 3}-06-01` // Fixed: "2023-06-01"
},
employmentHistory: [
  {
    employer: prng.pick(loc.employers),
    jobTitle: "Senior Security Analyst",
    startDate: `${birthYear + 23}-07-01`, // birthYear + 23!
    endDate: `${2026 - 3}-05-30`,         // Fixed: "2023-05-30"
    reasonForLeaving: "Career advancement"
  }
]
```
- For any subject with `age < 26` (which includes 8 full age years: 18, 19, 20, 21, 22, 23, 24, 25), `birthYear + 23 > 2023`:
  - **Age 18** (`birthYear = 2008`): `startDate = "2031-07-01"`, `endDate = "2023-05-30"`. **`startDate` is 8 years AFTER `endDate`!**
  - **Age 20** (`birthYear = 2006`): `startDate = "2029-07-01"`, `endDate = "2023-05-30"`. **`startDate` is 6 years AFTER `endDate`!**
  - **Age 22** (`birthYear = 2004`): `startDate = "2027-07-01"`, `endDate = "2023-05-30"`. **`startDate` is 4 years AFTER `endDate`!**
  - **Age 25** (`birthYear = 2001`): `startDate = "2024-07-01"`, `endDate = "2023-05-30"`. **`startDate` is 14 months AFTER `endDate`!**
- Note: Age 25 is within the generator's **default** `ageRange: [25, 60]`. Whenever Mulberry32 rolls 25, the default generator produces an employment record where the job started in July 2024 and ended in May 2023.

### Observation 1.4: Chronological Inversion in Residence History for Ages 18–22
In `src/generator/domains/addresses.ts` (lines 16, 49–50):
```typescript
const residenceYear = 2026 - prng.nextInt(2, 6); // 2020 through 2024
...
previous: [
  {
    ...
    residenceSince: `${birthYear + 18}-09-01`,
    residenceUntil: `${residenceYear}-08-31`
  }
]
```
- For an 18-year-old (`birthYear = 2008`):
  `residenceSince = "2026-09-01"`, `residenceUntil = "2020-08-31"` to `"2024-08-31"`.
- **`residenceSince` is up to 6 years AFTER `residenceUntil`!** The subject stops residing at the previous residence years before they move in.

### Observation 1.5: Future Timeline Events & Future Credentials for Young Subjects
In `src/generator/domains/timeline.ts` (lines 39, 49, 59):
- Event 3 ("Bachelor's Degree Conferred"): `timestamp = "${birthYear + 22}-06-20T10:00:00.000Z"`
- Event 4 ("First Professional Appointment"): `timestamp = "${career.employmentHistory[0].startDate}T09:00:00.000Z"`
- In `src/generator/domains/careerEducation.ts` (lines 52, 59):
  - `graduationYear: birthYear + 22`
  - `issueYear: birthYear + 25`
- For an 18-year-old in 2026:
  - Bachelor's degree event is recorded on `2030-06-20` (in the future!).
  - First professional appointment is recorded on `2031-07-01` (in the future!).
  - CISSP certification issueYear is `2033` (in the future!).
  - Current employment started on `2023-06-01` (when the subject was 15 years old).
- Relative to the project's canonical `REFERENCE_EPOCH = "2026-10-27T00:00:00.000Z"` (`PROJECT.md` line 17), generating events dated in 2030 and 2031 is a critical temporal coherence failure.

### Observation 1.6: Schema Strictness and Error Handling Successes
- Direct schema testing against `IdentityDossierSchema.parse` confirmed that 17 individual corruption vectors (invalid dossier ID format, regex failures, coordinates > 90/180, invalid fingerprint hash length, threat score bounds, invalid IP, empty arrays for nodes and timeline) **all threw structured `ZodError` exceptions with exact field paths**.
- Unicode seeds (`"日本語シード"`, `"🔐-cyber-target-§123"`, `"مرحبا_بالعالم"`, `"🚀🔥💥"`, `"\u0000\u0001\u0002"`, XSS/SQL vectors) are handled properly by MurmurHash3's `TextEncoder` and Mulberry32 without throwing or losing determinism.
- Extreme length seeds (1-char and 10,000-char) and numeric seeds (`0`, `-42`, `MAX_SAFE_INTEGER`) are handled deterministically.

---

## 2. Logic Chain

```
[Contract: PROJECT.md lines 59-63 defines input GeneratorOptions, output IdentityDossier, and throws ZodError/GeneratorError]
  │
  ▼
[Observation 1.1: engine.ts does not call GeneratorOptionsSchema.parse(userOptions)]
  │
  ▼
[Deduction 2.1: Invalid inputs (inverted age [60, 25], sub-18 [10, 15], invalid nationality "INVALID") bypass validation]
  ├── generateIdentity proceeds into generation logic with unvalidated inputs
  └── Output dossiers contain invalid fields that fail IdentityDossierSchema or produce absurd outputs
  │
  ▼
[Observation 1.2: Empty seed "" bypasses nullish coalescing userOptions.seed ?? "default-seed"]
  │
  ▼
[Deduction 2.2: meta.seed becomes "" which violates MetaDomainSchema min(1)]
  ├── IdentityDossierSchema.safeParse fails on empty string seed
  └── No exception was thrown at entrypoint despite contract requirement
  │
  ▼
[Observation 1.3, 1.4, 1.5: Domains use hardcoded offsets (birthYear + 23, birthYear + 22, 2026 - 3)]
  │
  ▼
[Deduction 2.3: For any subject age <= 25 (which includes default age 25):]
  ├── startDate (birthYear + 23) > endDate (2023) -> Employment started AFTER it ended!
  ├── For age <= 22: residenceSince (birthYear + 18) > residenceUntil (2020-2024) -> Residence started after it ended!
  ├── For age <= 21: graduationYear (2027-2030) > 2026 Reference Epoch -> Future degree conferred!
  └── Timeline events are dated up to 2031-07-01 -> Future timeline events in an intelligence dossier!
  │
  ▼
[Deduction 2.4: Requirement R1 & Criteria C1 cannot be certified as production-ready in this state]
  └── Milestone 1 must be REJECTED until input validation and chronological coherence are fixed
```

---

## 3. Caveats

1. **Deterministic PRNG Quality**: The core MurmurHash3 and Mulberry32 algorithms are mathematically sound, uniform, and cleanly isolated by sub-domain keys. Unicode encoding in `TextEncoder` handles multi-byte characters and NUL bytes cleanly.
2. **Golden Snapshot Integrity**: The golden snapshot for `seed-42` was generated for a 42-year-old subject (`birthYear = 1984`), so the young-adult chronological inversion bug was masked in that specific snapshot. Fixing young-adult chronology must preserve snapshot-seed-42 determinism for subjects of age 42.
3. **No Code Edits Performed**: In strict adherence to the EMPIRICAL CHALLENGER role and Review-Only constraints, no source code in `src/` was modified.

---

## 4. Conclusion & Verdict

### Final Verdict: **REJECT**

While the PRNG and schema definition architectures are well structured, the generator currently fails under adversarial, boundary, and young-adult operational conditions:
1. **Critical Vulnerability 1**: Input parameter validation is completely bypassed (`generateIdentity` does not invoke `GeneratorOptionsSchema.parse`).
2. **Critical Vulnerability 2**: Empty string seeds generate dossiers that fail `IdentityDossierSchema`.
3. **Critical Vulnerability 3**: Temporal inversion bug for young adults (ages 18–25, including default age 25): `startDate > endDate` in employment history, `residenceSince > residenceUntil` in residence history, and timeline events dated up to 5 years into the future beyond the 2026 reference epoch.

### Actionable Remediation Plan for `m1_worker_1`:
1. **Validate inputs in `src/generator/engine.ts`**:
   ```typescript
   export function generateIdentity(userOptions: Partial<GeneratorOptions> = {}): IdentityDossier {
     const parsedOptions = GeneratorOptionsSchema.parse(userOptions ?? {});
     // use parsedOptions internally
     ...
     const dossier = { meta, personal, ... };
     return IdentityDossierSchema.parse(dossier); // Validate output before return
   }
   ```
2. **Align `GeneratorOptionsSchema.seed`**:
   Add `.min(1)` to `seed: z.union([z.string().min(1), z.number()])` in `GeneratorOptionsSchema` so empty seeds trigger a structured `ZodError`.
3. **Condition Career & Education dynamically on `age`**:
   In `src/generator/domains/careerEducation.ts`:
   - If `age < 22`: The subject is an undergraduate or early career entry; set `graduationYear: null` or in-progress, or compute `graduationYear = Math.min(2026, birthYear + 22)`.
   - Compute employment dates relative to age and graduation:
     `startDate` must be `<= endDate`. For a 20-year-old, prior employment should be an internship or junior role (e.g. `startDate: ${birthYear + 18}-06-01`, `endDate: ${birthYear + 19}-08-31`).
     `current.startDate` should be after prior employment `endDate` and `<= 2026-10-27`.
   - Certifications: only assign if `birthYear + 25 <= 2026`, or scale down certification age to `Math.max(birthYear + 19, 2026 - 1)`.
4. **Condition Previous Residence dynamically on `age`**:
   In `src/generator/domains/addresses.ts`:
   - Ensure `residenceSince < residenceUntil` always holds. If `age < 24`, set previous residence `residenceSince: ${birthYear + 16}-09-01` and `residenceUntil: ${residenceYear}-08-31` with `residenceYear = Math.max(birthYear + 17, 2026 - 2)`.
5. **Cap Timeline Events at `REFERENCE_EPOCH`**:
   In `src/generator/domains/timeline.ts`:
   - Filter or adjust timeline events so that no event has `timestamp > REFERENCE_EPOCH` (`2026-10-27T00:00:00.000Z`). Only include events that have already occurred in the subject's life.

---

## 5. Verification Method

To independently reproduce all 22 findings and verify fixes:

1. **Run the Adversarial Stress Test Suite**:
   ```powershell
   npx tsx .agents/teamwork/m1_challenger_2/test_boundary_stress.ts
   ```
   **Expected Outcome on Current Baseline**: 100 assertions, 78 passed, 22 critical findings logged.  
   **Invalidation Condition (Pass Condition after Worker Fix)**: Must output `Bugs / Vulnerabilities Found: 0` and exit code 0.

2. **Verify Input Options Validation**:
   ```powershell
   npx tsx -e "
   import { generateIdentity } from './src/generator/index.js';
   try {
     generateIdentity({ ageRange: [60, 25] as any });
     console.error('FAILED: Inverted age range was accepted!');
   } catch (e) {
     console.log('PASSED: Inverted age range was rejected with error:', e.message);
   }
   "
   ```

3. **Verify Young-Adult Chronological Sanity (Age 18 & 22)**:
   ```powershell
   npx tsx -e "
   import { generateIdentity } from './src/generator/index.js';
   const d18 = generateIdentity({ seed: 'young-adult-18', ageRange: [18, 18] });
   const emp = d18.careerAndEducation.employmentHistory[0];
   console.log('Age 18 Employment Start:', emp.startDate, 'End:', emp.endDate);
   if (new Date(emp.startDate) > new Date(emp.endDate)) {
     console.error('FAILED: startDate is after endDate!');
   } else {
     console.log('PASSED: Chronology sound.');
   }
   "
   ```

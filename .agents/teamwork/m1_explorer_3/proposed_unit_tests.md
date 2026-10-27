# Proposed Unit Test Suite for NETRA Milestone 1 (Requirement R1)

## File Structure
```
tests/
├── fixtures/
│   └── snapshot-seed-42.json          # Reference golden snapshot for seed "seed-42"
└── unit/
    ├── prng.test.ts                   # MurmurHash3 & Mulberry32 mathematical validation
    ├── generator-snapshot.test.ts     # R1 Verification #1: Stored snapshot matching
    ├── generator-reproducibility.test.ts # R1 Verification #2: 100-run deep equality & idempotency
    ├── generator-entropy.test.ts      # Cross-seed entropy & collision resistance
    ├── generator-conditioning.test.ts # Parameter conditioning (locales, age bounds, occupation)
    ├── dossier-schema.test.ts         # Strict Zod schema compliance & negative validation
    └── domain-coherence.test.ts       # Chronology, graph referential integrity, cross-domain logic
```

---

### 1. `tests/unit/prng.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { murmurhash3_32, createMulberry32, canonicalizeOptions } from "@generator/prng.js";

describe("PRNG Mathematical Correctness", () => {
  describe("MurmurHash3 32-bit (x86)", () => {
    it("matches standard test vectors for known strings", () => {
      expect(murmurhash3_32("", 0)).toBe(0);
      expect(murmurhash3_32("hello", 0)).toBe(613153351);
      expect(murmurhash3_32("hello world", 0)).toBe(1586663183);
      expect(murmurhash3_32("test", 0)).toBe(3127628307);
    });

    it("handles multi-byte UTF-8 encoding identically to ASCII", () => {
      const hash1 = murmurhash3_32("München", 0);
      const hash2 = murmurhash3_32("東京", 0);
      expect(typeof hash1).toBe("number");
      expect(typeof hash2).toBe("number");
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(0xffffffff);
    });

    it("demonstrates strong avalanche effect on 1-character difference", () => {
      const h1 = murmurhash3_32("netra-seed-001", 0);
      const h2 = murmurhash3_32("netra-seed-002", 0);
      // Bitwise difference count
      const diffBits = (h1 ^ h2).toString(2).replace(/0/g, "").length;
      expect(diffBits).toBeGreaterThanOrEqual(10); // At least 10 bit flips out of 32
    });
  });

  describe("Mulberry32 Generator", () => {
    it("generates deterministic float stream for fixed seed", () => {
      const prng1 = createMulberry32(123456789);
      const prng2 = createMulberry32(123456789);

      const seq1 = [prng1.next(), prng1.next(), prng1.next(), prng1.next()];
      const seq2 = [prng2.next(), prng2.next(), prng2.next(), prng2.next()];

      expect(seq1).toEqual(seq2);
    });

    it("generates floats strictly in [0, 1)", () => {
      const prng = createMulberry32(987654321);
      for (let i = 0; i < 1000; i++) {
        const val = prng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it("nextInt produces integers inclusive of min and max bounds", () => {
      const prng = createMulberry32(42);
      const min = 18;
      const max = 65;
      const observed = new Set<number>();
      for (let i = 0; i < 2000; i++) {
        const val = prng.nextInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
        expect(Number.isInteger(val)).toBe(true);
        observed.add(val);
      }
      expect(observed.has(min)).toBe(true);
      expect(observed.has(max)).toBe(true);
    });
  });

  describe("Parameter Canonicalization", () => {
    it("produces identical serialized representation regardless of key order", () => {
      const s1 = canonicalizeOptions("target-1", { nationality: "US", riskLevel: "high" });
      const s2 = canonicalizeOptions("target-1", { riskLevel: "high", nationality: "US" });
      expect(s1).toBe(s2);
    });
  });
});
```

---

### 2. `tests/unit/generator-snapshot.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";
import type { GeneratorOptions } from "@shared/types/dossier.js";
import snapshotSeed42 from "../fixtures/snapshot-seed-42.json";

describe("R1 Verification: Golden Snapshot Matching", () => {
  const SNAPSHOT_OPTIONS: GeneratorOptions = {
    seed: "seed-42",
    nationality: "US",
    ageRange: [30, 45],
    occupationCategory: "cybersecurity",
    riskLevel: "high",
    complexity: "standard"
  };

  it("matches stored golden snapshot verbatim for seed 'seed-42'", () => {
    const generated = generateIdentity(SNAPSHOT_OPTIONS);
    expect(generated).toEqual(snapshotSeed42);
  });

  it("contains all 12 domains populated with valid data in snapshot", () => {
    const generated = generateIdentity(SNAPSHOT_OPTIONS);
    expect(generated.meta).toBeDefined();
    expect(generated.personal).toBeDefined();
    expect(generated.physical).toBeDefined();
    expect(generated.addresses).toBeDefined();
    expect(generated.communications).toBeDefined();
    expect(generated.governmentIds).toBeDefined();
    expect(generated.careerAndEducation).toBeDefined();
    expect(generated.financial).toBeDefined();
    expect(generated.digitalFootprint).toBeDefined();
    expect(generated.assets).toBeDefined();
    expect(generated.networkGraph).toBeDefined();
    expect(generated.timeline).toBeDefined();
  });
});
```

---

### 3. `tests/unit/generator-reproducibility.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";

describe("R1 Verification & C1: Deep Equality & Reproducibility", () => {
  it("produces deep equality across 100 consecutive invocations", () => {
    const options = {
      seed: "NETRA-REPRODUCIBILITY-42",
      nationality: "DE" as const,
      ageRange: [28, 52] as [number, number],
      occupationCategory: "defense" as const,
      riskLevel: "critical" as const
    };

    const baseline = generateIdentity(options);

    for (let i = 0; i < 100; i++) {
      const run = generateIdentity(options);
      expect(run).toEqual(baseline);
    }
  });

  it("guarantees idempotency and zero state leakage across interleaved calls", () => {
    const optA = { seed: "stream-A", nationality: "US" as const };
    const optB = { seed: "stream-B", nationality: "JP" as const };

    const firstA = generateIdentity(optA);
    const firstB = generateIdentity(optB);

    // Interleave calls
    const secondA = generateIdentity(optA);
    const secondB = generateIdentity(optB);

    expect(firstA).toEqual(secondA);
    expect(firstB).toEqual(secondB);
    expect(firstA).not.toEqual(firstB);
  });

  it("normalizes numeric and string seeds identically", () => {
    const dos1 = generateIdentity({ seed: "42" });
    const dos2 = generateIdentity({ seed: 42 });
    expect(dos1).toEqual(dos2);
  });

  it("yields identical output regardless of options object key ordering", () => {
    const opt1 = { seed: "order-test", nationality: "GB" as const, riskLevel: "low" as const };
    const opt2 = { riskLevel: "low" as const, seed: "order-test", nationality: "GB" as const };
    expect(generateIdentity(opt1)).toEqual(generateIdentity(opt2));
  });
});
```

---

### 4. `tests/unit/generator-entropy.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";

describe("R1 Verification: Cross-Seed Entropy & Collision Resistance", () => {
  it("generates distinct dossiers across 250 distinct seeds without primary collisions", () => {
    const NUM_SEEDS = 250;
    const ids = new Set<string>();
    const fullNames = new Set<string>();
    const nationalIds = new Set<string>();
    const phoneNumbers = new Set<string>();
    const cryptoAddresses = new Set<string>();
    const fingerprintHashes = new Set<string>();

    for (let i = 0; i < NUM_SEEDS; i++) {
      const dossier = generateIdentity({ seed: `seed-batch-${i}` });

      ids.add(dossier.meta.id);
      fullNames.add(dossier.personal.legalFullName);
      nationalIds.add(dossier.governmentIds.nationalId.number);
      if (dossier.communications.phoneNumbers[0]) {
        phoneNumbers.add(dossier.communications.phoneNumbers[0].number);
      }
      if (dossier.financial.cryptoWallets[0]) {
        cryptoAddresses.add(dossier.financial.cryptoWallets[0].address);
      }
      fingerprintHashes.add(dossier.physical.biometricFingerprintHash);
    }

    // Zero collisions expected on unique identifiers
    expect(ids.size).toBe(NUM_SEEDS);
    expect(nationalIds.size).toBe(NUM_SEEDS);
    expect(fingerprintHashes.size).toBe(NUM_SEEDS);

    // High entropy on generated demographic and communication attributes
    expect(fullNames.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.9);
    expect(phoneNumbers.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.95);
    expect(cryptoAddresses.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.95);
  });
});
```

---

### 5. `tests/unit/generator-conditioning.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";

describe("R1 Verification: Parameter Conditioning", () => {
  describe("Nationality Conditioning across Core Locales", () => {
    const locales = [
      { code: "US", phonePrefix: "+1", currency: "USD" },
      { code: "GB", phonePrefix: "+44", currency: "GBP" },
      { code: "DE", phonePrefix: "+49", currency: "EUR" },
      { code: "IN", phonePrefix: "+91", currency: "INR" },
      { code: "JP", phonePrefix: "+81", currency: "JPY" },
      { code: "CA", phonePrefix: "+1", currency: "CAD" },
      { code: "EE", phonePrefix: "+372", currency: "EUR" }
    ] as const;

    for (const loc of locales) {
      it(`correctly conditions locale attributes for nationality: ${loc.code}`, () => {
        const dossier = generateIdentity({ seed: `locale-test-${loc.code}`, nationality: loc.code });
        expect(dossier.personal.nationality).toBe(loc.code);
        expect(dossier.personal.citizenship).toContain(loc.code);
        expect(dossier.addresses.current.country).toBe(loc.code);
        expect(dossier.communications.phoneNumbers[0].number.startsWith(loc.phonePrefix)).toBe(true);
        expect(dossier.financial.bankAccounts[0].currency).toBe(loc.currency);
      });
    }
  });

  describe("Age Bounds Conditioning", () => {
    it("strictly bounds age to [18, 24] and sets consistent DOB", () => {
      const dossier = generateIdentity({ seed: "young-target", ageRange: [18, 24] });
      expect(dossier.personal.age).toBeGreaterThanOrEqual(18);
      expect(dossier.personal.age).toBeLessThanOrEqual(24);

      // Verify reference epoch 2026-10-27
      const birthYear = parseInt(dossier.personal.dateOfBirth.split("-")[0], 10);
      expect(2026 - birthYear).toBe(dossier.personal.age);
    });

    it("strictly bounds age to [65, 75]", () => {
      const dossier = generateIdentity({ seed: "senior-target", ageRange: [65, 75] });
      expect(dossier.personal.age).toBeGreaterThanOrEqual(65);
      expect(dossier.personal.age).toBeLessThanOrEqual(75);
    });
  });

  describe("Risk Level Conditioning", () => {
    it("assigns threat score <= 35 for 'low' risk level", () => {
      const dossier = generateIdentity({ seed: "low-risk", riskLevel: "low" });
      expect(dossier.meta.threatScore).toBeLessThanOrEqual(35);
    });

    it("assigns threat score >= 70 for 'critical' risk level", () => {
      const dossier = generateIdentity({ seed: "critical-risk", riskLevel: "critical" });
      expect(dossier.meta.threatScore).toBeGreaterThanOrEqual(70);
      expect(dossier.financial.suspiciousIndicators.length).toBeGreaterThan(0);
    });
  });
});
```

---

### 6. `tests/unit/dossier-schema.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";
import { IdentityDossierSchema } from "@shared/schemas/dossier.js";

describe("R1 Verification: Strict Zod Validation", () => {
  it("validates 50 randomly seeded dossiers successfully against IdentityDossierSchema", () => {
    for (let i = 0; i < 50; i++) {
      const dossier = generateIdentity({ seed: `schema-audit-${i}` });
      const parsed = IdentityDossierSchema.safeParse(dossier);
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects corrupted dossier objects", () => {
    const valid = generateIdentity({ seed: "valid-seed" });

    // Test 1: Corrupted dossier ID
    const badId = { ...valid, meta: { ...valid.meta, id: "usr_123" } };
    expect(IdentityDossierSchema.safeParse(badId).success).toBe(false);

    // Test 2: Invalid coordinates
    const badCoord = {
      ...valid,
      addresses: {
        ...valid.addresses,
        current: {
          ...valid.addresses.current,
          coordinates: { latitude: 999, longitude: 0 }
        }
      }
    };
    expect(IdentityDossierSchema.safeParse(badCoord).success).toBe(false);

    // Test 3: Invalid fingerprint hash length
    const badFingerprint = {
      ...valid,
      physical: { ...valid.physical, biometricFingerprintHash: "abcd" }
    };
    expect(IdentityDossierSchema.safeParse(badFingerprint).success).toBe(false);

    // Test 4: Threat score out of range
    const badThreat = {
      ...valid,
      meta: { ...valid.meta, threatScore: 150 }
    };
    expect(IdentityDossierSchema.safeParse(badThreat).success).toBe(false);
  });
});
```

---

### 7. `tests/unit/domain-coherence.test.ts`
```typescript
import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";

describe("Dossier Cross-Domain & Chronological Coherence", () => {
  it("orders timeline events in non-descending chronological order", () => {
    const dossier = generateIdentity({ seed: "timeline-test" });
    const events = dossier.timeline.events;
    expect(events.length).toBeGreaterThan(1);

    for (let i = 1; i < events.length; i++) {
      const prevTime = new Date(events[i - 1].timestamp).getTime();
      const currTime = new Date(events[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it("anchors birth event to dateOfBirth", () => {
    const dossier = generateIdentity({ seed: "birth-test" });
    const birthEvent = dossier.timeline.events.find((e) => e.category === "birth");
    expect(birthEvent).toBeDefined();
    expect(birthEvent!.timestamp.startsWith(dossier.personal.dateOfBirth)).toBe(true);
  });

  it("ensures network graph edges connect to valid nodes and subject exists", () => {
    const dossier = generateIdentity({ seed: "graph-coherence-test" });
    const { nodes, edges } = dossier.networkGraph;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const subjectNode = nodes.find((n) => n.isSubject);

    expect(subjectNode).toBeDefined();

    for (const edge of edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
      expect(edge.weight).toBeGreaterThanOrEqual(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it("ensures legalFullName is composed of firstName, middleName (if any), and lastName", () => {
    const dossier = generateIdentity({ seed: "name-coherence-test" });
    const { firstName, middleName, lastName, legalFullName } = dossier.personal;

    if (middleName) {
      expect(legalFullName).toBe(`${firstName} ${middleName} ${lastName}`);
    } else {
      expect(legalFullName).toBe(`${firstName} ${lastName}`);
    }
  });
});
```

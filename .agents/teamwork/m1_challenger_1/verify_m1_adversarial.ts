import { murmurhash3_32 } from "../../../src/generator/prng/murmur3.js";
import { createMulberry32 } from "../../../src/generator/prng/mulberry32.js";
import {
  canonicalizeOptions,
  deriveMasterSeed,
  deriveDomainSeed,
  getDomainPRNG
} from "../../../src/generator/prng/domain_isolation.js";
import { generateIdentity, verifyDeterminism } from "../../../src/generator/engine.js";
import { IdentityDossierSchema, GeneratorOptionsSchema } from "../../../src/shared/schemas/dossier.js";
import type { GeneratorOptions } from "../../../src/shared/types/dossier.js";

// ============================================================================
// Adversarial Challenger Test Harness for NETRA Milestone 1
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  metrics?: Record<string, unknown>;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details: string, metrics?: Record<string, unknown>) {
  results.push({ name, passed, details, metrics });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}: ${details}`);
}

console.log("=== STARTING ADVERSARIAL PRNG & DETERMINISM VERIFICATION ===");

// ----------------------------------------------------------------------------
// SUITE 1: PRNG Mathematical Correctness & Statistical Distribution
// ----------------------------------------------------------------------------
console.log("\n--- Suite 1: PRNG Mathematical Properties & Uniformity ---");

// Test 1.1: Mulberry32 Chi-Squared Uniformity Test (1,000,000 iterations x 5 seeds)
{
  const SAMPLE_SIZE = 1_000_000;
  const BUCKETS = 100;
  const EXPECTED_PER_BUCKET = SAMPLE_SIZE / BUCKETS;
  const testSeeds = [0, 42, 123456789, 0x7fffffff, 0xffffffff];
  let allUniform = true;
  const chiSquaredValues: Record<number, number> = {};

  for (const s of testSeeds) {
    const prng = createMulberry32(s);
    const bins = new Uint32Array(BUCKETS);

    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const val = prng.next();
      if (val < 0 || val >= 1.0) {
        allUniform = false;
        console.error(`Boundary violation at seed ${s}: val = ${val}`);
        break;
      }
      const b = Math.floor(val * BUCKETS);
      bins[b]++;
    }

    let chi2 = 0;
    for (let b = 0; b < BUCKETS; b++) {
      const diff = bins[b] - EXPECTED_PER_BUCKET;
      chi2 += (diff * diff) / EXPECTED_PER_BUCKET;
    }
    chiSquaredValues[s] = Math.round(chi2 * 100) / 100;

    // Degrees of freedom = 99. Critical value at alpha = 0.001 is 148.23
    if (chi2 >= 148.23) {
      allUniform = false;
    }
  }

  record(
    "Mulberry32 Chi-Squared Uniformity (1M samples x 5 seeds)",
    allUniform,
    `Chi-squared values across 99 DoF (threshold 148.23): ${JSON.stringify(chiSquaredValues)}`,
    { chiSquaredValues, degreesOfFreedom: 99, criticalAlpha001: 148.23 }
  );
}

// Test 1.2: Mulberry32 Strict Float Range [0, 1) and Edge Array Bounds
{
  const prng = createMulberry32(42);
  let strictlyUnderOne = true;
  for (let i = 0; i < 500_000; i++) {
    const n = prng.next();
    if (n >= 1.0 || n < 0 || Number.isNaN(n)) {
      strictlyUnderOne = false;
      break;
    }
  }

  // Check pick with 1 element
  let pickSafe = true;
  const singleArr = ["only-element"];
  for (let i = 0; i < 1000; i++) {
    if (prng.pick(singleArr) !== "only-element") {
      pickSafe = false;
      break;
    }
  }

  record(
    "Mulberry32 Boundary & Edge Bounds",
    strictlyUnderOne && pickSafe,
    `Strict float interval [0, 1): ${strictlyUnderOne}, Single element pick: ${pickSafe}`
  );
}

// Test 1.3: MurmurHash3 32-bit Avalanche Effect
{
  const testPairs = 1000;
  let totalBitFlips = 0;
  const bitFlipDist: number[] = [];

  for (let i = 0; i < testPairs; i++) {
    const baseStr = `netra-avalanche-test-vector-item-${i}-alpha-beta`;
    // Flip 1 character
    const flippedStr = `netra-avalanche-test-vector-item-${i}-alpha-bety`;
    const h1 = murmurhash3_32(baseStr, 0);
    const h2 = murmurhash3_32(flippedStr, 0);

    const xor = (h1 ^ h2) >>> 0;
    // Count set bits
    let count = 0;
    let temp = xor;
    while (temp > 0) {
      count += temp & 1;
      temp >>>= 1;
    }
    totalBitFlips += count;
    bitFlipDist.push(count);
  }

  const avgBitFlips = totalBitFlips / testPairs;
  const avalanchePassed = avgBitFlips >= 14.0 && avgBitFlips <= 18.0;

  record(
    "MurmurHash3 Avalanche Effect (1000 1-char perturbation pairs)",
    avalanchePassed,
    `Mean bit flips: ${avgBitFlips.toFixed(2)} / 32 bits (${((avgBitFlips / 32) * 100).toFixed(1)}%). Ideal is 16.0 (50%).`,
    { avgBitFlips, testPairs }
  );
}

// Test 1.4: MurmurHash3 Unicode, Null Byte, and Long String Robustness
{
  const edgeCases = [
    { name: "empty string", input: "", expected: 0 },
    { name: "null bytes", input: "\0\0\0\0" },
    { name: "surrogate pairs emoji", input: "🕵️‍♂️🔒⚡" },
    { name: "cjk unicode", input: "日本語のテキスト" },
    { name: "long string (100k chars)", input: "A".repeat(100_000) },
    { name: "prototype pollution key", input: "__proto__" },
    { name: "constructor key", input: "constructor" }
  ];

  let edgeCasesPassed = true;
  const hashOutputs: Record<string, number> = {};

  for (const tc of edgeCases) {
    try {
      const h = murmurhash3_32(tc.input, 0);
      if (typeof h !== "number" || Number.isNaN(h) || h < 0 || h > 0xffffffff) {
        edgeCasesPassed = false;
        console.error(`Edge case failed ${tc.name}: invalid output ${h}`);
      }
      if (tc.expected !== undefined && h !== tc.expected) {
        edgeCasesPassed = false;
        console.error(`Edge case ${tc.name}: expected ${tc.expected}, got ${h}`);
      }
      hashOutputs[tc.name] = h;
    } catch (err) {
      edgeCasesPassed = false;
      console.error(`Edge case threw on ${tc.name}:`, err);
    }
  }

  record(
    "MurmurHash3 Edge Case Robustness",
    edgeCasesPassed,
    `Tested ${edgeCases.length} edge cases including null bytes, surrogate pairs, and 100KB payload`,
    { hashOutputs }
  );
}

// ----------------------------------------------------------------------------
// SUITE 2: Massive Multi-Run Determinism (500+ diverse runs)
// ----------------------------------------------------------------------------
console.log("\n--- Suite 2: Massive Multi-Run Determinism (500+ Runs) ---");

{
  const TOTAL_CONFIGS = 520;
  let matchesCount = 0;
  let schemaValidCount = 0;
  const failures: string[] = [];

  const nationalities = ["US", "GB", "DE", "IN", "JP", "CA", "EE"] as const;
  const riskLevels = ["low", "medium", "high", "critical"] as const;
  const genders = ["male", "female", "non-binary", "auto"] as const;

  for (let i = 0; i < TOTAL_CONFIGS; i++) {
    let seed: string | number;
    let options: Partial<GeneratorOptions>;

    if (i < 100) {
      // Alphanumeric seeds
      seed = `seed-alpha-${i}-${Math.imul(i, 31337).toString(16)}`;
      options = {
        seed,
        nationality: nationalities[i % nationalities.length],
        riskLevel: riskLevels[i % riskLevels.length]
      };
    } else if (i < 150) {
      // Numeric seeds (including 0, negative, max safe integer)
      const numSeeds = [0, 1, 42, -1, -42, 2147483647, -2147483648, 4294967295, Number.MAX_SAFE_INTEGER];
      seed = numSeeds[i % numSeeds.length];
      options = { seed };
    } else if (i < 200) {
      // Unicode / International seeds
      const unicodeSeeds = [
        "東京-新宿-001",
        "München-Bavaria-42",
        "القاهرة-مصر",
        "Москва-Кремль",
        "Bengaluru-560001",
        "Tallinn-Ülemiste-Cyber",
        "🎯🕵️‍♂️⚡🔑"
      ];
      seed = unicodeSeeds[i % unicodeSeeds.length] + `-${i}`;
      options = { seed, nationality: nationalities[i % nationalities.length] };
    } else if (i < 250) {
      // Edge string seeds
      const edgeSeeds = ["", " ", "   ", "null", "undefined", "NaN", "0", "[object Object]", "{\"id\":1}", "<script>"];
      seed = edgeSeeds[i % edgeSeeds.length];
      options = { seed };
    } else if (i < 350) {
      // Boundary age ranges
      const ageRanges: [number, number][] = [
        [18, 18],
        [18, 24],
        [25, 60],
        [65, 75],
        [80, 95],
        [18, 100]
      ];
      seed = `age-range-test-${i}`;
      options = {
        seed,
        ageRange: ageRanges[i % ageRanges.length],
        nationality: nationalities[i % nationalities.length]
      };
    } else if (i < 450) {
      // All combinations of gender and risk level
      seed = `gender-risk-${i}`;
      options = {
        seed,
        gender: genders[i % genders.length],
        riskLevel: riskLevels[i % riskLevels.length],
        nationality: nationalities[i % nationalities.length]
      };
    } else {
      // Complex multi-attribute options with key shuffling
      seed = `complex-shuffle-${i}`;
      options = {
        seed,
        nationality: nationalities[i % nationalities.length],
        ageRange: [22, 55],
        gender: genders[i % genders.length],
        riskLevel: riskLevels[i % riskLevels.length],
        complexity: "standard"
      };
    }

    // Run 1
    const run1 = generateIdentity(options);
    const json1 = JSON.stringify(run1);

    // Run 2
    const run2 = generateIdentity(options);
    const json2 = JSON.stringify(run2);

    // Run 3
    const run3 = generateIdentity(options);
    const json3 = JSON.stringify(run3);

    if (json1 === json2 && json2 === json3) {
      matchesCount++;
    } else {
      failures.push(`Config ${i} (seed=${seed}): mismatch between consecutive runs`);
    }

    // Schema validation check on Run 1
    const parseRes = IdentityDossierSchema.safeParse(run1);
    if (parseRes.success) {
      schemaValidCount++;
    } else {
      failures.push(`Config ${i} (seed=${seed}): schema validation failed: ${JSON.stringify(parseRes.error.errors)}`);
    }
  }

  record(
    `Massive Multi-Run Determinism (${TOTAL_CONFIGS} distinct configs, 3 runs each = ${TOTAL_CONFIGS * 3} runs)`,
    matchesCount === TOTAL_CONFIGS,
    `Identical runs: ${matchesCount}/${TOTAL_CONFIGS}. Schema valid: ${schemaValidCount}/${TOTAL_CONFIGS}. Failures: ${failures.length}`,
    { totalConfigs: TOTAL_CONFIGS, totalInvocations: TOTAL_CONFIGS * 3, failures: failures.slice(0, 5) }
  );
}

// Test 2.2: Interleaved Call Isolation
{
  const seedA = "stream-ALPHA";
  const seedB = "stream-BETA";
  const baselineA = JSON.stringify(generateIdentity({ seed: seedA }));
  const baselineB = JSON.stringify(generateIdentity({ seed: seedB }));

  let interleavedMatches = true;
  for (let i = 0; i < 200; i++) {
    const runA = JSON.stringify(generateIdentity({ seed: seedA }));
    const runB = JSON.stringify(generateIdentity({ seed: seedB }));
    if (runA !== baselineA || runB !== baselineB) {
      interleavedMatches = false;
      break;
    }
  }

  record(
    "Interleaved Invocations Isolation (200 cross-invocations)",
    interleavedMatches,
    `State does not leak across interleaved invocations of distinct seeds`
  );
}

// ----------------------------------------------------------------------------
// SUITE 3: Domain Seed Isolation & Entropy Leakage
// ----------------------------------------------------------------------------
console.log("\n--- Suite 3: Domain Seed Isolation & Entropy Leakage ---");

// Test 3.1: Domain Sub-Seed Uniqueness
{
  const DOMAINS = [
    "meta",
    "personal",
    "physical",
    "addresses",
    "communications",
    "governmentIds",
    "careerAndEducation",
    "financial",
    "digitalFootprint",
    "assets",
    "networkGraph",
    "timeline"
  ];

  let allSeedsUnique = true;
  let testedMasterSeeds = 0;

  for (let m = 0; m < 500; m++) {
    const masterSeed = (m * 0x45d9f3b + 0x12345) >>> 0;
    const subSeeds = new Set<number>();
    for (const d of DOMAINS) {
      const s = deriveDomainSeed(masterSeed, d);
      subSeeds.add(s);
    }
    if (subSeeds.size !== DOMAINS.length) {
      allSeedsUnique = false;
      console.error(`Sub-seed collision detected for masterSeed ${masterSeed}!`);
      break;
    }
    testedMasterSeeds++;
  }

  record(
    "12-Domain Sub-Seed Mutual Exclusivity (500 master seeds)",
    allSeedsUnique,
    `Tested ${testedMasterSeeds} master seeds x 12 domains (6,000 derivations). Sub-seed collisions: 0`
  );
}

// Test 3.2: Domain PRNG Isolation (Consuming numbers in Domain A has zero effect on Domain B)
{
  const masterSeed = 987654321;
  const prngMetaBaseline = getDomainPRNG(masterSeed, "meta");
  const baselineMetaSeq = [prngMetaBaseline.next(), prngMetaBaseline.next(), prngMetaBaseline.next()];

  const prngPersonalBaseline = getDomainPRNG(masterSeed, "personal");
  const baselinePersonalSeq = [prngPersonalBaseline.next(), prngPersonalBaseline.next(), prngPersonalBaseline.next()];

  // Now create new instance of personal PRNG, consume 1,000,000 numbers from it
  const prngPersonalDirty = getDomainPRNG(masterSeed, "personal");
  for (let i = 0; i < 1_000_000; i++) {
    prngPersonalDirty.next();
  }

  // Now create meta PRNG and check if sequence is unaffected
  const prngMetaFresh = getDomainPRNG(masterSeed, "meta");
  const freshMetaSeq = [prngMetaFresh.next(), prngMetaFresh.next(), prngMetaFresh.next()];

  const noLeakage =
    JSON.stringify(baselineMetaSeq) === JSON.stringify(freshMetaSeq) &&
    baselineMetaSeq[0] !== baselinePersonalSeq[0];

  record(
    "Domain PRNG Zero Cross-Domain Leakage",
    noLeakage,
    `Consuming 1,000,000 samples from 'personal' domain leaves 'meta' domain PRNG completely unaffected`
  );
}

// Test 3.3: In-Depth Analysis of Default Option Divergence: canonicalizeOptions vs engine defaults
{
  // Investigation: Does deriveMasterSeed('seed-1') match generateIdentity({ seed: 'seed-1' })'s internal master seed?
  const testSeed = "adversarial-check-default-options";
  const masterDirect = deriveMasterSeed(testSeed, {});

  // Trace what engine.ts does
  const optionsEngine: GeneratorOptions = {
    seed: testSeed,
    nationality: "US",
    ageRange: [25, 60],
    gender: "auto",
    occupationCategory: "cybersecurity" as const,
    riskLevel: "medium",
    complexity: "standard"
  };
  const masterInEngine = deriveMasterSeed(testSeed, optionsEngine);

  // Trace what GeneratorOptionsSchema.parse does
  const parsedSchema = GeneratorOptionsSchema.parse({ seed: testSeed });
  const masterWithParsed = deriveMasterSeed(testSeed, parsedSchema);

  const directMatchesEngine = masterDirect === masterInEngine;
  const schemaMatchesEngine = masterWithParsed === masterInEngine;

  record(
    "Option Default Consistency (canonicalizeOptions vs engine.ts vs GeneratorOptionsSchema)",
    schemaMatchesEngine, // If false, this is a documented defect/discrepancy!
    `direct=${masterDirect}, inEngine=${masterInEngine}, withParsedSchema=${masterWithParsed}. directMatchesEngine=${directMatchesEngine}, schemaMatchesEngine=${schemaMatchesEngine}`,
    { masterDirect, masterInEngine, masterWithParsed, directMatchesEngine, schemaMatchesEngine }
  );
}

// ----------------------------------------------------------------------------
// SUITE 4: Cross-Seed Entropy & Collision Resistance
// ----------------------------------------------------------------------------
console.log("\n--- Suite 4: Cross-Seed Entropy & Collision Resistance (1,000 Seeds) ---");

{
  const SAMPLE_SIZE = 1000;
  const ids = new Set<string>();
  const fingerprintHashes = new Set<string>();
  const nationalIds = new Set<string>();
  const phoneNumbers = new Set<string>();
  const cryptoAddresses = new Set<string>();
  const fullNames = new Set<string>();
  const passports = new Set<string>();
  const taxIds = new Set<string>();
  const emails = new Set<string>();

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const dossier = generateIdentity({ seed: `entropy-sample-seed-#${i}` });

    ids.add(dossier.meta.id);
    fingerprintHashes.add(dossier.physical.biometricFingerprintHash);
    nationalIds.add(dossier.governmentIds.nationalId.number);
    if (dossier.communications.phoneNumbers[0]) {
      phoneNumbers.add(dossier.communications.phoneNumbers[0].number);
    }
    if (dossier.financial.cryptoWallets[0]) {
      cryptoAddresses.add(dossier.financial.cryptoWallets[0].address);
    }
    if (dossier.governmentIds.passports[0]) {
      passports.add(dossier.governmentIds.passports[0].passportNumber);
    }
    taxIds.add(dossier.governmentIds.taxIdentifier.tin);
    fullNames.add(dossier.personal.legalFullName);
    if (dossier.communications.emailAddresses[0]) {
      emails.add(dossier.communications.emailAddresses[0].email);
    }
  }

  // Calculate Shannon entropy on first 1000 dossier IDs
  let charFreq: Record<string, number> = {};
  let totalChars = 0;
  for (const id of ids) {
    for (const ch of id.slice(4)) {
      // Skip "dos_"
      charFreq[ch] = (charFreq[ch] || 0) + 1;
      totalChars++;
    }
  }
  let shannonEntropy = 0;
  for (const ch in charFreq) {
    const p = charFreq[ch] / totalChars;
    shannonEntropy -= p * Math.log2(p);
  }

  const zeroPrimaryCollisions =
    ids.size === SAMPLE_SIZE &&
    fingerprintHashes.size === SAMPLE_SIZE &&
    nationalIds.size === SAMPLE_SIZE &&
    taxIds.size === SAMPLE_SIZE;

  const phoneUniqueness = phoneNumbers.size / SAMPLE_SIZE;
  const cryptoUniqueness = cryptoAddresses.size / SAMPLE_SIZE;
  const nameUniqueness = fullNames.size / SAMPLE_SIZE;
  const emailUniqueness = emails.size / SAMPLE_SIZE;

  record(
    `Primary Identifier Zero-Collision Resistance (${SAMPLE_SIZE} dossiers)`,
    zeroPrimaryCollisions,
    `Unique Dossier IDs: ${ids.size}/${SAMPLE_SIZE}, Fingerprint hashes: ${fingerprintHashes.size}/${SAMPLE_SIZE}, National IDs: ${nationalIds.size}/${SAMPLE_SIZE}, Tax IDs: ${taxIds.size}/${SAMPLE_SIZE}`,
    {
      sampleSize: SAMPLE_SIZE,
      uniqueIds: ids.size,
      uniqueFingerprints: fingerprintHashes.size,
      uniqueNationalIds: nationalIds.size,
      uniqueTaxIds: taxIds.size
    }
  );

  record(
    "Secondary Attribute Entropy & Cardinality",
    phoneUniqueness >= 0.9 && cryptoUniqueness >= 0.9 && nameUniqueness >= 0.65,
    `Phone uniqueness: ${(phoneUniqueness * 100).toFixed(1)}%, Crypto uniqueness: ${(cryptoUniqueness * 100).toFixed(1)}%, Email uniqueness: ${(emailUniqueness * 100).toFixed(1)}%, Name uniqueness: ${(nameUniqueness * 100).toFixed(1)}% (catalog bounded). ID Shannon Entropy: ${shannonEntropy.toFixed(3)} bits/hex (ideal: 4.0).`,
    {
      phoneUniqueness,
      cryptoUniqueness,
      emailUniqueness,
      nameUniqueness,
      shannonEntropyHex: shannonEntropy
    }
  );
}

// ----------------------------------------------------------------------------
// SUITE 5: Cross-Locale Attribute Conformance & Edge Validation
// ----------------------------------------------------------------------------
console.log("\n--- Suite 5: Cross-Locale Conformance & Boundary Audit ---");

{
  const locales = ["US", "GB", "DE", "IN", "JP", "CA", "EE"] as const;
  let allLocalesConform = true;
  const localeReport: Record<string, unknown> = {};

  for (const loc of locales) {
    const d = generateIdentity({ seed: `locale-deep-audit-${loc}`, nationality: loc });
    const parsed = IdentityDossierSchema.safeParse(d);

    const nationalIdMatches = d.governmentIds.nationalId.issuingCountry === loc;
    const countryMatches = d.addresses.current.country === loc;
    const passportValid = d.governmentIds.passports.length > 0 && d.governmentIds.passports[0].issuingCountry === loc;

    if (!parsed.success || !nationalIdMatches || !countryMatches || !passportValid) {
      allLocalesConform = false;
      console.error(`Locale conformance failed for ${loc}:`, parsed.error?.errors);
    }

    localeReport[loc] = {
      valid: parsed.success,
      nationalIdType: d.governmentIds.nationalId.type,
      currency: d.financial.bankAccounts[0]?.currency,
      phoneSample: d.communications.phoneNumbers[0]?.number
    };
  }

  record(
    "7 Country Locales Deep Conformance Audit",
    allLocalesConform,
    `All 7 locales (US, GB, DE, IN, JP, CA, EE) pass full schema validation and country code consistency`,
    { localeReport }
  );
}

// ----------------------------------------------------------------------------
// Summary & Exit
// ----------------------------------------------------------------------------
console.log("\n=== VERIFICATION RESULTS SUMMARY ===");
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log("\nFailed tests details:");
  for (const r of results.filter((r) => !r.passed)) {
    console.log(` - ${r.name}: ${r.details}`);
  }
}

// Output JSON summary for automated reporting
console.log("\n--- JSON OUTPUT ---");
console.log(JSON.stringify({ totalTests, passedTests, failedTests, results }, null, 2));

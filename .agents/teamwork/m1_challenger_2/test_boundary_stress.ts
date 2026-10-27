import { generateIdentity, verifyDeterminism } from "../../../src/generator/index.js";
import {
  GeneratorOptionsSchema,
  IdentityDossierSchema
} from "../../../src/shared/schemas/dossier.js";
import { ZodError } from "zod";

interface TestResult {
  category: string;
  testName: string;
  status: "PASS" | "FAIL" | "BUG_FOUND";
  details: string;
  data?: unknown;
}

const results: TestResult[] = [];

function record(category: string, testName: string, status: "PASS" | "FAIL" | "BUG_FOUND", details: string, data?: unknown) {
  results.push({ category, testName, status, details, data });
  const icon = status === "PASS" ? "✅" : status === "BUG_FOUND" ? "🐞" : "❌";
  console.log(`${icon} [${category}] ${testName}: ${details}`);
}

async function runAdversarialSuite() {
  console.log("===============================================================================");
  console.log("NETRA MILESTONE 1 — ADVERSARIAL STRESS TEST SUITE (m1_challenger_2)");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Boundary & Adversarial Seeds
  // ---------------------------------------------------------------------------
  console.log("--- 1. Boundary & Adversarial Seeds ---");

  // 1.1 Empty string seed
  try {
    const dossierEmpty = generateIdentity({ seed: "" });
    const schemaCheck = IdentityDossierSchema.safeParse(dossierEmpty);
    if (!schemaCheck.success) {
      record("Seed Boundary", "Empty string seed ('')", "BUG_FOUND",
        `generateIdentity allowed empty seed (''), but dossier failed IdentityDossierSchema validation: ${JSON.stringify(schemaCheck.error.flatten().fieldErrors)}`,
        { metaSeed: dossierEmpty.meta.seed }
      );
    } else {
      record("Seed Boundary", "Empty string seed ('')", "PASS", "Dossier valid with empty string seed");
    }
  } catch (err: any) {
    record("Seed Boundary", "Empty string seed ('')", "PASS", `Rejected empty string seed: ${err.message}`);
  }

  // 1.2 Whitespace-only seed
  try {
    const dossierWs = generateIdentity({ seed: "   " });
    const schemaWs = IdentityDossierSchema.safeParse(dossierWs);
    record("Seed Boundary", "Whitespace seed ('   ')", schemaWs.success ? "PASS" : "FAIL",
      `Whitespace seed result: success=${schemaWs.success}`);
  } catch (err: any) {
    record("Seed Boundary", "Whitespace seed ('   ')", "PASS", `Rejected whitespace seed: ${err.message}`);
  }

  // 1.3 Unicode & Multi-byte seeds
  const unicodeSeeds = [
    "日本語シード",
    "🔐-cyber-target-§123",
    "مرحبا_بالعالم",
    "🚀🔥💥",
    "\u0000\u0001\u0002\u0003",
    "<script>alert('xss')</script>",
    "C:\\Windows\\System32\\calc.exe",
    "DROP TABLE users;--"
  ];

  for (const uSeed of unicodeSeeds) {
    try {
      const d1 = generateIdentity({ seed: uSeed });
      const d2 = generateIdentity({ seed: uSeed });
      const parseResult = IdentityDossierSchema.safeParse(d1);
      const isDet = JSON.stringify(d1) === JSON.stringify(d2);

      if (!parseResult.success) {
        record("Unicode Seeds", `Seed: ${uSeed}`, "FAIL", `Failed schema: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`);
      } else if (!isDet) {
        record("Unicode Seeds", `Seed: ${uSeed}`, "FAIL", "Non-deterministic output across identical Unicode seed runs");
      } else {
        record("Unicode Seeds", `Seed: ${uSeed}`, "PASS", `Valid and deterministic. Dossier ID: ${d1.meta.id}`);
      }
    } catch (err: any) {
      record("Unicode Seeds", `Seed: ${uSeed}`, "FAIL", `Threw exception: ${err.message}`);
    }
  }

  // 1.4 Extreme length seeds (1-char and 10,000-char)
  try {
    const dShort = generateIdentity({ seed: "x" });
    const shortParse = IdentityDossierSchema.safeParse(dShort);
    record("Seed Length", "1-character seed ('x')", shortParse.success ? "PASS" : "FAIL", `Valid: ${shortParse.success}`);

    const longSeed = "A".repeat(10000);
    const dLong = generateIdentity({ seed: longSeed });
    const longParse = IdentityDossierSchema.safeParse(dLong);
    const detLong = verifyDeterminism(longSeed, 5);
    record("Seed Length", "10,000-character seed", longParse.success && detLong ? "PASS" : "FAIL",
      `Valid: ${longParse.success}, Deterministic: ${detLong}`);
  } catch (err: any) {
    record("Seed Length", "Extreme length seeds", "FAIL", `Threw: ${err.message}`);
  }

  // 1.5 Numeric seeds
  const numericSeeds = [0, -42, 3.14159, Number.MAX_SAFE_INTEGER];
  for (const numSeed of numericSeeds) {
    try {
      const dNum = generateIdentity({ seed: numSeed as any });
      const parseNum = IdentityDossierSchema.safeParse(dNum);
      record("Numeric Seeds", `Numeric seed (${numSeed})`, parseNum.success ? "PASS" : "FAIL",
        `Parsed: ${parseNum.success}, Meta seed string: ${dNum.meta.seed}`);
    } catch (err: any) {
      record("Numeric Seeds", `Numeric seed (${numSeed})`, "FAIL", `Threw: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Age Ranges & Inverted Age Bounds
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Age Ranges & Inverted Age Bounds ---");

  // 2.1 Schema validation of ageRange
  const validAgeRanges: [number, number][] = [[18, 18], [18, 25], [25, 60], [100, 100]];
  for (const ar of validAgeRanges) {
    const parseRes = GeneratorOptionsSchema.safeParse({ seed: "test", ageRange: ar });
    record("GeneratorOptionsSchema", `Valid ageRange [${ar[0]}, ${ar[1]}]`, parseRes.success ? "PASS" : "FAIL",
      `Schema accepted valid range: success=${parseRes.success}`);
  }

  const invalidAgeRanges: any[] = [
    [60, 25], // Inverted (min > max)
    [10, 15], // Sub-18 (min < 18)
    [101, 120], // Out of bounds (> 100)
    [-5, 25], // Negative min
    [25.5, 60], // Non-integer
    [25], // Tuple length != 2
    "25-60" // String instead of tuple
  ];

  for (const badAr of invalidAgeRanges) {
    const parseRes = GeneratorOptionsSchema.safeParse({ seed: "test", ageRange: badAr });
    if (!parseRes.success) {
      record("GeneratorOptionsSchema", `Reject invalid ageRange ${JSON.stringify(badAr)}`, "PASS",
        `Correctly rejected by Zod schema: ${parseRes.error.issues[0]?.message}`);
    } else {
      record("GeneratorOptionsSchema", `Reject invalid ageRange ${JSON.stringify(badAr)}`, "FAIL",
        `Schema unexpectedly accepted invalid ageRange`);
    }
  }

  // 2.2 Behavior of generateIdentity with inverted age bounds [60, 25]
  try {
    const dInverted = generateIdentity({ seed: "inverted-age", ageRange: [60, 25] as any });
    const schemaInv = IdentityDossierSchema.safeParse(dInverted);
    record("Inverted Age Bounds", "generateIdentity({ ageRange: [60, 25] })", "BUG_FOUND",
      `generateIdentity did NOT validate options against GeneratorOptionsSchema! Produced age=${dInverted.personal.age}, DOB=${dInverted.personal.dateOfBirth}. Schema valid=${schemaInv.success}`,
      { age: dInverted.personal.age, ageRangePassed: [60, 25] }
    );
  } catch (err: any) {
    record("Inverted Age Bounds", "generateIdentity({ ageRange: [60, 25] })", "PASS",
      `Threw expected error: ${err.message}`);
  }

  // 2.3 Behavior of generateIdentity with sub-18 age bounds [10, 15]
  try {
    const dSub18 = generateIdentity({ seed: "sub-18", ageRange: [10, 15] as any });
    const schemaSub18 = IdentityDossierSchema.safeParse(dSub18);
    if (!schemaSub18.success) {
      record("Sub-18 Age Bounds", "generateIdentity({ ageRange: [10, 15] })", "BUG_FOUND",
        `generateIdentity accepted [10, 15] without validation, resulting in invalid dossier with age=${dSub18.personal.age} which failed IdentityDossierSchema: ${JSON.stringify(schemaSub18.error.flatten().fieldErrors)}`,
        { age: dSub18.personal.age }
      );
    } else {
      record("Sub-18 Age Bounds", "generateIdentity({ ageRange: [10, 15] })", "BUG_FOUND",
        `Produced dossier for age=${dSub18.personal.age} (sub-18) which passed schema but violates minimum legal age contract`);
    }
  } catch (err: any) {
    record("Sub-18 Age Bounds", "generateIdentity({ ageRange: [10, 15] })", "PASS",
      `Threw error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 3. Nationalities & Unexpected Option Types
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Nationalities & Option Types ---");

  // 3.1 Invalid nationality in GeneratorOptionsSchema
  const invalidNationalities = ["FR", "RU", "CN", "XX", "", "INVALID_NATIONALITY"];
  for (const badNat of invalidNationalities) {
    const parseRes = GeneratorOptionsSchema.safeParse({ seed: "test", nationality: badNat });
    record("GeneratorOptionsSchema", `Reject invalid nationality '${badNat}'`, !parseRes.success ? "PASS" : "FAIL",
      !parseRes.success ? `Correctly rejected: ${parseRes.error.issues[0]?.message}` : "Failed to reject");
  }

  // 3.2 Behavior of generateIdentity with invalid nationality
  try {
    const dBadNat = generateIdentity({ seed: "bad-nat", nationality: "INVALID_NATIONALITY" as any });
    const schemaBadNat = IdentityDossierSchema.safeParse(dBadNat);
    record("Invalid Nationality Execution", "generateIdentity({ nationality: 'INVALID_NATIONALITY' })",
      !schemaBadNat.success ? "BUG_FOUND" : "FAIL",
      `generateIdentity did NOT validate nationality option! Resulting dossier has nationality '${dBadNat.personal.nationality}' and placeOfBirth country '${dBadNat.personal.placeOfBirth.country}' (length ${dBadNat.personal.placeOfBirth.country.length}), causing IdentityDossierSchema to FAIL: ${JSON.stringify(schemaBadNat.error?.flatten().fieldErrors)}`
    );
  } catch (err: any) {
    record("Invalid Nationality Execution", "generateIdentity({ nationality: 'INVALID_NATIONALITY' })", "PASS",
      `Rejected with error: ${err.message}`);
  }

  // 3.3 Unexpected option types
  const unexpectedOptions = [
    { name: "gender: 'cyborg'", opt: { gender: "cyborg" as any } },
    { name: "occupationCategory: 'wizard'", opt: { occupationCategory: "wizard" as any } },
    { name: "riskLevel: 'apocalyptic'", opt: { riskLevel: "apocalyptic" as any } },
    { name: "complexity: 'infinite'", opt: { complexity: "infinite" as any } }
  ];

  for (const uOpt of unexpectedOptions) {
    const schemaOpt = GeneratorOptionsSchema.safeParse({ seed: "test", ...uOpt.opt });
    record("Unexpected Options Schema", `Reject ${uOpt.name}`, !schemaOpt.success ? "PASS" : "FAIL",
      !schemaOpt.success ? `Rejected: ${schemaOpt.error.issues[0]?.message}` : "Accepted");

    try {
      const dOpt = generateIdentity({ seed: "test-opt", ...uOpt.opt });
      record("Unexpected Options Execution", `generateIdentity with ${uOpt.name}`, "BUG_FOUND",
        `generateIdentity does not validate option against GeneratorOptionsSchema, allowing unvalidated ${uOpt.name} to propagate`);
    } catch (err: any) {
      record("Unexpected Options Execution", `generateIdentity with ${uOpt.name}`, "PASS",
        `Threw error: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Zod Schema Strictness & Structured ZodErrors
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Zod Schema Validation & Structured ZodErrors ---");

  const baselineDossier = generateIdentity({ seed: "schema-stress-baseline" });
  const baseCheck = IdentityDossierSchema.safeParse(baselineDossier);
  record("Zod Schema", "Valid baseline dossier parses cleanly", baseCheck.success ? "PASS" : "FAIL",
    baseCheck.success ? "Baseline parsed without error" : "Failed baseline parse");

  // Torture mutations
  const tortureCases: { field: string; corrupt: (d: any) => void; expectedPath: string }[] = [
    {
      field: "meta.id: wrong prefix ('usr_...')",
      corrupt: (d) => { d.meta.id = "usr_1234567890abcdef"; },
      expectedPath: "meta.id"
    },
    {
      field: "meta.id: uppercase hex ('dos_ABCDEF...')",
      corrupt: (d) => { d.meta.id = "dos_AABBCCDDEEFF0011"; },
      expectedPath: "meta.id"
    },
    {
      field: "meta.threatScore: > 100 (150)",
      corrupt: (d) => { d.meta.threatScore = 150; },
      expectedPath: "meta.threatScore"
    },
    {
      field: "meta.threatScore: negative (-1)",
      corrupt: (d) => { d.meta.threatScore = -1; },
      expectedPath: "meta.threatScore"
    },
    {
      field: "personal.age: sub-18 (17)",
      corrupt: (d) => { d.personal.age = 17; },
      expectedPath: "personal.age"
    },
    {
      field: "personal.dateOfBirth: invalid format ('1990/01/01')",
      corrupt: (d) => { d.personal.dateOfBirth = "1990/01/01"; },
      expectedPath: "personal.dateOfBirth"
    },
    {
      field: "personal.sex: invalid enum ('Z')",
      corrupt: (d) => { d.personal.sex = "Z"; },
      expectedPath: "personal.sex"
    },
    {
      field: "physical.heightCm: out of bounds (110)",
      corrupt: (d) => { d.physical.heightCm = 110; },
      expectedPath: "physical.heightCm"
    },
    {
      field: "physical.biometricFingerprintHash: wrong length (32 chars)",
      corrupt: (d) => { d.physical.biometricFingerprintHash = "a".repeat(32); },
      expectedPath: "physical.biometricFingerprintHash"
    },
    {
      field: "addresses.current.coordinates.latitude: > 90 (95.0)",
      corrupt: (d) => { d.addresses.current.coordinates.latitude = 95.0; },
      expectedPath: "addresses.current.coordinates.latitude"
    },
    {
      field: "communications.phoneNumbers[0].imei: 14 digits",
      corrupt: (d) => { d.communications.phoneNumbers[0].imei = "12345678901234"; },
      expectedPath: "communications.phoneNumbers.0.imei"
    },
    {
      field: "communications.emailAddresses[0].email: not an email",
      corrupt: (d) => { d.communications.emailAddresses[0].email = "invalid-email-address"; },
      expectedPath: "communications.emailAddresses.0.email"
    },
    {
      field: "digitalFootprint.digitalFingerprint.primaryIpAddress: invalid IPv4",
      corrupt: (d) => { d.digitalFootprint.digitalFingerprint.primaryIpAddress = "999.888.777.666"; },
      expectedPath: "digitalFootprint.digitalFingerprint.primaryIpAddress"
    },
    {
      field: "digitalFootprint.digitalFingerprint.ipGeolocation.asn: missing 'AS' prefix",
      corrupt: (d) => { d.digitalFootprint.digitalFingerprint.ipGeolocation.asn = "12345"; },
      expectedPath: "digitalFootprint.digitalFingerprint.ipGeolocation.asn"
    },
    {
      field: "assets.vehicles[0].vin: contains illegal character 'I'",
      corrupt: (d) => { d.assets.vehicles[0].vin = "1HGCR2F83HA12345I"; },
      expectedPath: "assets.vehicles.0.vin"
    },
    {
      field: "networkGraph.nodes: empty array",
      corrupt: (d) => { d.networkGraph.nodes = []; },
      expectedPath: "networkGraph.nodes"
    },
    {
      field: "timeline.events: empty array",
      corrupt: (d) => { d.timeline.events = []; },
      expectedPath: "timeline.events"
    }
  ];

  for (const tc of tortureCases) {
    const corrupted = JSON.parse(JSON.stringify(baselineDossier));
    tc.corrupt(corrupted);
    try {
      IdentityDossierSchema.parse(corrupted);
      record("Schema Torture", tc.field, "FAIL", "Failed to reject corrupted payload!");
    } catch (err: any) {
      if (err instanceof ZodError) {
        const issuePaths = err.issues.map((i) => i.path.join("."));
        const matched = issuePaths.some((p) => p === tc.expectedPath || p.startsWith(tc.expectedPath));
        record("Schema Torture", tc.field, matched ? "PASS" : "FAIL",
          `Threw structured ZodError on path(s): [${issuePaths.join(", ")}], message: ${err.issues[0]?.message}`);
      } else {
        record("Schema Torture", tc.field, "FAIL", `Threw non-ZodError: ${err.message}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Chronological Sanity & Cross-Domain Coherence
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Chronological Sanity & Coherence ---");

  // Test across ages 18, 20, 22, 25, 35, 50, 70
  const testAges = [18, 20, 22, 25, 30, 45, 65];

  for (const age of testAges) {
    const dossier = generateIdentity({ seed: `chrono-audit-age-${age}`, ageRange: [age, age] });
    const birthYear = parseInt(dossier.personal.dateOfBirth.split("-")[0], 10);
    const birthDate = new Date(dossier.personal.dateOfBirth);

    // 5.1 DOB preceding education
    const edu = dossier.careerAndEducation.education[0];
    const graduationYear = edu.graduationYear;
    if (graduationYear <= birthYear) {
      record("Chronology", `Age ${age}: Education before/at birth`, "BUG_FOUND",
        `graduationYear (${graduationYear}) <= birthYear (${birthYear})`);
    } else if (graduationYear > 2026) {
      record("Chronology", `Age ${age}: Future Graduation Year`, "BUG_FOUND",
        `Person is ${age} years old in 2026, but graduationYear is in future (${graduationYear} > 2026 Reference Epoch)!`,
        { age, birthYear, graduationYear }
      );
    } else {
      record("Chronology", `Age ${age}: Education sanity`, "PASS",
        `graduationYear (${graduationYear}) > birthYear (${birthYear}) and <= 2026`);
    }

    // 5.2 Education preceding employment & Employment sanity
    const emp = dossier.careerAndEducation.employmentHistory[0];
    const empStartYear = parseInt(emp.startDate.split("-")[0], 10);
    const empEndYear = parseInt(emp.endDate.split("-")[0], 10);
    const empStartDate = new Date(emp.startDate);
    const empEndDate = new Date(emp.endDate);

    if (empStartDate > empEndDate) {
      record("Chronology", `Age ${age}: Employment Start > End Date`, "BUG_FOUND",
        `Employment history startDate (${emp.startDate}) is AFTER endDate (${emp.endDate})!`,
        { age, birthYear, startDate: emp.startDate, endDate: emp.endDate }
      );
    } else {
      record("Chronology", `Age ${age}: Employment history start <= end`, "PASS",
        `startDate (${emp.startDate}) <= endDate (${emp.endDate})`);
    }

    if (empStartDate > new Date("2026-10-27T00:00:00.000Z")) {
      record("Chronology", `Age ${age}: Future Employment History Start`, "BUG_FOUND",
        `Employment history startDate is in the future relative to 2026-10-27: ${emp.startDate}`);
    }

    // Current employment start date vs birth date
    const currEmpStartDate = new Date(dossier.careerAndEducation.current.startDate);
    if (currEmpStartDate <= birthDate) {
      record("Chronology", `Age ${age}: Current Job started before birth`, "BUG_FOUND",
        `Current job startDate (${dossier.careerAndEducation.current.startDate}) <= DOB (${dossier.personal.dateOfBirth})`);
    }

    // 5.3 Residence history sanity
    const prevRes = dossier.addresses.previous[0];
    const currRes = dossier.addresses.current;
    const prevStart = new Date(prevRes.residenceSince);
    const prevEnd = prevRes.residenceUntil ? new Date(prevRes.residenceUntil) : null;
    const currStart = new Date(currRes.residenceSince);

    if (prevEnd && prevStart > prevEnd) {
      record("Chronology", `Age ${age}: Previous Residence Start > End`, "BUG_FOUND",
        `Previous residence residenceSince (${prevRes.residenceSince}) is AFTER residenceUntil (${prevRes.residenceUntil})!`,
        { age, residenceSince: prevRes.residenceSince, residenceUntil: prevRes.residenceUntil }
      );
    } else {
      record("Chronology", `Age ${age}: Previous residence start <= end`, "PASS",
        `residenceSince (${prevRes.residenceSince}) <= residenceUntil (${prevRes.residenceUntil})`);
    }

    // 5.4 Timeline ordering and future events
    const timeline = dossier.timeline.events;
    let isTimelineSorted = true;
    let futureEventsCount = 0;
    const epochMs = new Date("2026-10-27T00:00:00.000Z").getTime();

    for (let i = 1; i < timeline.length; i++) {
      if (new Date(timeline[i].timestamp).getTime() < new Date(timeline[i - 1].timestamp).getTime()) {
        isTimelineSorted = false;
      }
    }

    for (const evt of timeline) {
      if (new Date(evt.timestamp).getTime() > epochMs) {
        futureEventsCount++;
      }
    }

    record("Chronology", `Age ${age}: Timeline strictly ordered`, isTimelineSorted ? "PASS" : "FAIL",
      isTimelineSorted ? "Events strictly non-descending" : "Events out of order!");

    if (futureEventsCount > 0) {
      record("Chronology", `Age ${age}: Future Timeline Events (${futureEventsCount})`, "BUG_FOUND",
        `Timeline contains ${futureEventsCount} events dated AFTER 2026-10-27 reference epoch! Example: ${timeline.filter(e => new Date(e.timestamp).getTime() > epochMs).map(e => `${e.title} @ ${e.timestamp}`).join(", ")}`,
        { age, futureEvents: timeline.filter(e => new Date(e.timestamp).getTime() > epochMs) }
      );
    } else {
      record("Chronology", `Age ${age}: No future timeline events`, "PASS",
        "All timeline events precede reference epoch");
    }
  }

  // ---------------------------------------------------------------------------
  // Summary & Statistics
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log("TEST EXECUTION COMPLETE — SUMMARY OF RESULTS");
  console.log("===============================================================================");

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const bugCount = results.filter((r) => r.status === "BUG_FOUND").length;

  console.log(`Total assertions: ${results.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Bugs / Vulnerabilities Found: ${bugCount}`);

  const bugs = results.filter((r) => r.status === "BUG_FOUND" || r.status === "FAIL");
  if (bugs.length > 0) {
    console.log("\nCRITICAL FINDINGS:");
    bugs.forEach((b, idx) => {
      console.log(`  ${idx + 1}. [${b.category}] ${b.testName} -> ${b.details}`);
    });
  }
}

runAdversarialSuite().catch(console.error);

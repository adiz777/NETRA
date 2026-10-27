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

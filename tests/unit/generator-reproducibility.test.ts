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

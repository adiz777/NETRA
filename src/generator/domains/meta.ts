import type { PRNG } from "../prng/mulberry32.js";
import type { ResolvedGeneratorOptions, MetaProfile } from "../../shared/types/dossier.js";

export function generateMetaDomain(
  prng: PRNG,
  seed: string,
  options: ResolvedGeneratorOptions,
  referenceEpoch: string
): MetaProfile {
  const threatScore =
    options.riskLevel === "critical"
      ? prng.nextInt(88, 99)
      : options.riskLevel === "high"
      ? prng.nextInt(70, 87)
      : options.riskLevel === "low"
      ? prng.nextInt(10, 35)
      : prng.nextInt(36, 69);

  return {
    id: `dos_${prng.hex(16)}`,
    seed: String(seed),
    version: "1.0.0",
    classification:
      options.riskLevel === "critical"
        ? "TOP_SECRET"
        : options.riskLevel === "high"
        ? "SECRET"
        : options.riskLevel === "low"
        ? "UNCLASSIFIED"
        : "CONFIDENTIAL",
    status: threatScore > 75 ? "PERSON_OF_INTEREST" : "ACTIVE",
    threatScore,
    generatedAt: referenceEpoch,
    tags: ["synthetic", "cyber_intel", "target_profile"],
    handlingCaveats: ["NOFORN", "ORCON", "SYNTHETIC_EXERCISE_ONLY"]
  };
}

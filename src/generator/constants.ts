import type { ResolvedGeneratorOptions } from "../shared/types/dossier.js";

export const REFERENCE_EPOCH = "2026-10-27T00:00:00.000Z";
export const REFERENCE_TIMESTAMP_MS = 1793059200000;

export const DEFAULT_GENERATOR_OPTIONS: ResolvedGeneratorOptions = {
  seed: "default-seed",
  nationality: "US",
  ageRange: [25, 60],
  gender: "auto",
  occupationCategory: "auto",
  riskLevel: "medium",
  complexity: "standard"
};

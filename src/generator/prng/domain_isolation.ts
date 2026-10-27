import { murmurhash3_32 } from "./murmur3.js";
import { createMulberry32, type PRNG } from "./mulberry32.js";
import type { GeneratorOptions } from "../../shared/types/dossier.js";

/**
 * Normalizes generator options into a canonical sorted JSON string representation.
 * Guarantees key-order invariance and string/number seed consistency.
 */
export function canonicalizeOptions(seed: string | number, options: Partial<GeneratorOptions> = {}): string {
  const normalized = {
    seed: String(seed),
    nationality: (options.nationality ?? "US").toUpperCase(),
    ageRange: options.ageRange ?? [25, 60],
    gender: options.gender ?? "auto",
    occupationCategory: options.occupationCategory ?? "auto",
    riskLevel: options.riskLevel ?? "medium",
    complexity: options.complexity ?? "standard"
  };
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

/**
 * Derives a 32-bit master seed from canonicalized options.
 */
export function deriveMasterSeed(seed: string | number, options: Partial<GeneratorOptions> = {}): number {
  return murmurhash3_32(canonicalizeOptions(seed, options), 0);
}

/**
 * Derives an isolated 32-bit sub-seed for a specific domain.
 * Seed formula: MurmurHash3("domain:<domainKey>::<masterSeed>", 0)
 */
export function deriveDomainSeed(masterSeed: number, domain: string): number {
  return murmurhash3_32(`domain:${domain}::${masterSeed}`, 0);
}

/**
 * Creates an isolated Mulberry32 PRNG instance for a specific domain.
 */
export function getDomainPRNG(masterSeed: number, domain: string): PRNG {
  const dSeed = deriveDomainSeed(masterSeed, domain);
  return createMulberry32(dSeed);
}

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
    expect(fullNames.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.75);
    expect(phoneNumbers.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.95);
    expect(cryptoAddresses.size).toBeGreaterThanOrEqual(NUM_SEEDS * 0.95);
  });
});

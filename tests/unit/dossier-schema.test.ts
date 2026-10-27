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

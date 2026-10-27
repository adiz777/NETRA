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

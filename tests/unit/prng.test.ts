import { describe, it, expect } from "vitest";
import { murmurhash3_32, createMulberry32, canonicalizeOptions } from "@generator/prng.js";

describe("PRNG Mathematical Correctness", () => {
  describe("MurmurHash3 32-bit (x86)", () => {
    it("matches standard test vectors for known strings", () => {
      expect(murmurhash3_32("", 0)).toBe(0);
      expect(murmurhash3_32("hello", 0)).toBe(613153351);
      expect(murmurhash3_32("hello world", 0)).toBe(1586663183);
      expect(murmurhash3_32("test", 0)).toBe(3127628307);
    });

    it("handles multi-byte UTF-8 encoding identically to ASCII", () => {
      const hash1 = murmurhash3_32("München", 0);
      const hash2 = murmurhash3_32("東京", 0);
      expect(typeof hash1).toBe("number");
      expect(typeof hash2).toBe("number");
      expect(hash1).not.toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(0xffffffff);
    });

    it("demonstrates strong avalanche effect on 1-character difference", () => {
      const h1 = murmurhash3_32("netra-seed-001", 0);
      const h2 = murmurhash3_32("netra-seed-002", 0);
      // Bitwise difference count
      const diffBits = (h1 ^ h2).toString(2).replace(/0/g, "").length;
      expect(diffBits).toBeGreaterThanOrEqual(10); // At least 10 bit flips out of 32
    });
  });

  describe("Mulberry32 Generator", () => {
    it("generates deterministic float stream for fixed seed", () => {
      const prng1 = createMulberry32(123456789);
      const prng2 = createMulberry32(123456789);

      const seq1 = [prng1.next(), prng1.next(), prng1.next(), prng1.next()];
      const seq2 = [prng2.next(), prng2.next(), prng2.next(), prng2.next()];

      expect(seq1).toEqual(seq2);
    });

    it("generates floats strictly in [0, 1)", () => {
      const prng = createMulberry32(987654321);
      for (let i = 0; i < 1000; i++) {
        const val = prng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it("nextInt produces integers inclusive of min and max bounds", () => {
      const prng = createMulberry32(42);
      const min = 18;
      const max = 65;
      const observed = new Set<number>();
      for (let i = 0; i < 2000; i++) {
        const val = prng.nextInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
        expect(Number.isInteger(val)).toBe(true);
        observed.add(val);
      }
      expect(observed.has(min)).toBe(true);
      expect(observed.has(max)).toBe(true);
    });
  });

  describe("Parameter Canonicalization", () => {
    it("produces identical serialized representation regardless of key order", () => {
      const s1 = canonicalizeOptions("target-1", { nationality: "US", riskLevel: "high" });
      const s2 = canonicalizeOptions("target-1", { riskLevel: "high", nationality: "US" });
      expect(s1).toBe(s2);
    });
  });
});

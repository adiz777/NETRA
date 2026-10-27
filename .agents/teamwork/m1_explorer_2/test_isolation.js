// Test domain isolation resilience
const { murmurhash3_32, createMulberry32 } = (() => {
  function murmurhash3_32(key, seed = 0) {
    const bytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
    let h1 = seed >>> 0;
    const remainder = bytes.length & 3;
    const len = bytes.length - remainder;
    for (let i = 0; i < len; i += 4) {
      let k1 = (bytes[i]) | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
      k1 = Math.imul(k1, 0xcc9e2d51);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, 0x1b873593);
      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
    }
    let k1 = 0;
    switch (remainder) {
      case 3: k1 ^= bytes[len + 2] << 16;
      case 2: k1 ^= bytes[len + 1] << 8;
      case 1:
        k1 ^= bytes[len];
        k1 = Math.imul(k1, 0xcc9e2d51);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, 0x1b873593);
        h1 ^= k1;
    }
    h1 ^= bytes.length;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
  }

  function createMulberry32(seed) {
    let s = seed | 0;
    return {
      next: () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }
    };
  }

  return { murmurhash3_32, createMulberry32 };
})();

const masterSeed = murmurhash3_32("seed-test-123");

// Derivation
function getDomainPRNG(master, domain) {
  const dSeed = murmurhash3_32(`${domain}::${master}`);
  return createMulberry32(dSeed);
}

// Domain 1: Personal
const p1 = getDomainPRNG(masterSeed, "personal");
const p1_val1 = p1.next();

// Domain 2: Financial
const f1 = getDomainPRNG(masterSeed, "financial");
const f1_val1 = f1.next();

// Now simulate a change in Domain 1 where 5 more random numbers are consumed:
const p2 = getDomainPRNG(masterSeed, "personal");
p2.next(); p2.next(); p2.next(); p2.next(); p2.next(); // extra fields

// Now Domain 2 in the updated generator:
const f2 = getDomainPRNG(masterSeed, "financial");
const f2_val1 = f2.next();

console.log("f1_val1 == f2_val1?", f1_val1 === f2_val1, f1_val1, f2_val1);

/**
 * MurmurHash3 x86 32-bit implementation using Math.imul and TextEncoder.
 * Guaranteed 100% deterministic across Node.js, V8/Workerd, and browser runtimes.
 */
export function murmurhash3_32(key: string | Uint8Array, seed = 0): number {
  const bytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
  let h1 = seed >>> 0;
  const remainder = bytes.length & 3;
  const len = bytes.length - remainder;

  for (let i = 0; i < len; i += 4) {
    let k1 =
      (bytes[i]) |
      (bytes[i + 1] << 8) |
      (bytes[i + 2] << 16) |
      (bytes[i + 3] << 24);

    k1 = Math.imul(k1, 0xcc9e2d51);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, 0x1b873593);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let k1 = 0;
  if (remainder >= 3) {
    k1 ^= bytes[len + 2] << 16;
  }
  if (remainder >= 2) {
    k1 ^= bytes[len + 1] << 8;
  }
  if (remainder >= 1) {
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

export const murmur3 = murmurhash3_32;

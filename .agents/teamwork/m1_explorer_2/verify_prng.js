// Verification script for MurmurHash3 and Mulberry32

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
    case 3:
      k1 ^= bytes[len + 2] << 16;
      // fallthrough
    case 2:
      k1 ^= bytes[len + 1] << 8;
      // fallthrough
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

  function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min, max) {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function pick(items) {
    if (!items || items.length === 0) throw new Error("Empty array");
    return items[Math.floor(next() * items.length)];
  }

  function pickWeighted(items) {
    let total = 0;
    for (const item of items) total += item.weight;
    let r = next() * total;
    for (const item of items) {
      if (r < item.weight) return item.item;
      r -= item.weight;
    }
    return items[items.length - 1].item;
  }

  return { next, nextInt, pick, pickWeighted };
}

// Known test vectors for MurmurHash3_x86_32:
// murmurhash3_32("", 0) -> 0
// murmurhash3_32("hello", 0) -> 613153351 (0x248bfa47)
// murmurhash3_32("hello world", 0) -> 1586036139 (0x5e8c15ab)
// murmurhash3_32("test", 0) -> 3127628307 (0xba6f3c13)

console.log('empty:', murmurhash3_32('', 0));
console.log('hello:', murmurhash3_32('hello', 0));
console.log('hello world:', murmurhash3_32('hello world', 0));
console.log('test:', murmurhash3_32('test', 0));

const prng = createMulberry32(murmurhash3_32('netra-seed-42', 0));
console.log('stream sample:', [prng.next(), prng.next(), prng.nextInt(18, 85)]);

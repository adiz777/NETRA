/**
 * Edge Cryptography module using standard Web Crypto API (crypto.subtle).
 * Implements PBKDF2-HMAC-SHA256 password hashing with 100,000 iterations,
 * 16-byte random salt, and constant-time digest verification.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  );

  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(new Uint8Array(derived))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  if (isNaN(iterations) || iterations <= 0) {
    return false;
  }

  const saltMatches = parts[2].match(/.{1,2}/g);
  if (!saltMatches) {
    return false;
  }
  const salt = new Uint8Array(saltMatches.map(byte => parseInt(byte, 16)));
  const targetHashHex = parts[3];

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  );
  const derivedHex = Array.from(new Uint8Array(derived))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (derivedHex.length !== targetHashHex.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i++) {
    diff |= derivedHex.charCodeAt(i) ^ targetHashHex.charCodeAt(i);
  }
  return diff === 0;
}

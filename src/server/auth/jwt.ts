import type { JWTPayload, UserRole } from '@shared/types/auth.js';

const DEFAULT_EXPIRY_SECONDS = 86400; // 24 hours

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  const enc = new TextEncoder();
  return base64UrlEncode(enc.encode(str));
}

function base64UrlToString(str: string): string {
  const dec = new TextDecoder();
  return dec.decode(base64UrlDecode(str));
}

export async function signJWT(
  payload: {
    sub: string;
    email: string;
    role: UserRole;
    fullName: string;
    iat?: number;
    exp?: number;
  },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const iat = payload.iat ?? now;
  const exp = payload.exp ?? now + DEFAULT_EXPIRY_SECONDS;

  const fullPayload: JWTPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
    iat,
    exp,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${signingInput}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signatureBytes = base64UrlDecode(encodedSignature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(signingInput) as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = base64UrlToString(encodedPayload);
    const payload = JSON.parse(payloadJson) as JWTPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

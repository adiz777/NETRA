import type { Context, Next } from 'hono';
import { verifyJWT } from '../auth/jwt.js';
import type { JWTPayload } from '@shared/types/auth.js';

export const JWT_SECRET_DEFAULT = 'netra-super-secret-jwt-key-change-in-production-2026';

export function getJwtSecret(c: Context): string {
  return (
    (c.env as any)?.JWT_SECRET ||
    (typeof process !== 'undefined' ? process.env?.JWT_SECRET : undefined) ||
    JWT_SECRET_DEFAULT
  );
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
        code: 'AUTH_UNAUTHORIZED',
        statusCode: 401,
        meta: { timestamp: new Date().toISOString() },
      },
      401
    );
  }

  const token = authHeader.slice(7).trim();
  const secret = getJwtSecret(c);
  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token',
        code: 'AUTH_INVALID_TOKEN',
        statusCode: 401,
        meta: { timestamp: new Date().toISOString() },
      },
      401
    );
  }

  c.set('user', payload);
  return next();
}

export function getCurrentUser(c: Context): JWTPayload {
  const user = c.get('user') as JWTPayload | undefined;
  if (!user) {
    throw new Error('User not found in context. Did you apply authMiddleware?');
  }
  return user;
}

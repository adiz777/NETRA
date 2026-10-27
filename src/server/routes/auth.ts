import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { UsersRepository } from '../db/users.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { hashPassword, verifyPassword } from '../auth/crypto.js';
import { signJWT } from '../auth/jwt.js';
import { authMiddleware, getCurrentUser, getJwtSecret } from '../middleware/auth.js';
import type { UserRole } from '@shared/types/auth.js';

const app = new Hono();

// ------------------------------------------------------------
// Register (supports username or email)
// ------------------------------------------------------------
app.post('/register', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON payload',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }

  const username = typeof body.username === 'string' ? body.username.trim() : undefined;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const role: UserRole = body.role === 'admin' ? 'admin' : 'investigator';

  // Validation
  if (username && username.length < 3) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Username must be at least 3 characters',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }
  if (!email || !email.includes('@')) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Valid email required',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }
  if (!password || password.length < 8) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Password must be ≥8 chars',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }
  if (!fullName) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Full name required',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }

  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);
  const auditRepo = new AuditRepository(db);

  // Uniqueness checks
  if (username) {
    const existingByUsername = await usersRepo.findByUsername(username);
    if (existingByUsername) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: 'Username already exists',
        code: 'USER_USERNAME_EXISTS',
        statusCode: 409,
        meta: { timestamp: new Date().toISOString() },
      }, 409);
    }
  }
  const existingByEmail = await usersRepo.findByEmail(email);
  if (existingByEmail) {
    return c.json({
      success: false,
      error: 'Conflict',
      message: 'Email already registered',
      code: 'USER_EMAIL_EXISTS',
      statusCode: 409,
      meta: { timestamp: new Date().toISOString() },
    }, 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await usersRepo.createUser({
    email,
    username,
    passwordHash,
    fullName,
    role,
    status: 'active',
  });

  const secret = getJwtSecret(c);
  const token = await signJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  }, secret);

  // Audit
  try {
    await auditRepo.createAuditLog({
      userId: user.id,
      action: 'auth.register',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email, username: user.username, role: user.role },
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {}

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  }, 201);
});

// ------------------------------------------------------------
// Login (username or email)
// ------------------------------------------------------------
app.post('/login', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON payload',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      meta: { timestamp: new Date().toISOString() },
    }, 400);
  }

  const username = typeof body.username === 'string' ? body.username.trim() : undefined;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if ((!username && !email) || !password) {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: 'Credentials missing',
      code: 'AUTH_INVALID_CREDENTIALS',
      statusCode: 401,
      meta: { timestamp: new Date().toISOString() },
    }, 401);
  }

  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);
  const auditRepo = new AuditRepository(db);

  const user = username ? await usersRepo.findByUsername(username) : await usersRepo.findByEmail(email);
  if (!user || !user.passwordHash || user.status === 'suspended') {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid credentials',
      code: 'AUTH_INVALID_CREDENTIALS',
      statusCode: 401,
      meta: { timestamp: new Date().toISOString() },
    }, 401);
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid credentials',
      code: 'AUTH_INVALID_CREDENTIALS',
      statusCode: 401,
      meta: { timestamp: new Date().toISOString() },
    }, 401);
  }

  const secret = getJwtSecret(c);
  const token = await signJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  }, secret);

  // Audit login
  try {
    await auditRepo.createAuditLog({
      userId: user.id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      details: { username: user.username, email: user.email },
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {}

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token,
  }, 200);
});

// ------------------------------------------------------------
// Get current profile
// ------------------------------------------------------------
app.get('/me', authMiddleware, async (c) => {
  const currentUser = getCurrentUser(c);
  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);
  const user = await usersRepo.findById(currentUser.sub);
  if (!user) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'User not found',
      code: 'USER_NOT_FOUND',
      statusCode: 404,
      meta: { timestamp: new Date().toISOString() },
    }, 404);
  }
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    },
  }, 200);
});

export default app;

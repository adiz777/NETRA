import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { UsersRepository } from '../db/users.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { hashPassword, verifyPassword } from '../auth/crypto.js';
import { signJWT } from '../auth/jwt.js';
import { authMiddleware, getCurrentUser, getJwtSecret } from '../middleware/auth.js';
import type { UserRole } from '@shared/types/auth.js';

const app = new Hono();

// POST /api/auth/register
app.post('/register', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid JSON payload in request body',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const role: UserRole = body.role === 'admin' ? 'admin' : 'investigator';

  // Validation
  if (!email || !email.includes('@')) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'A valid email address is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  if (!password || password.length < 8) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Password must be at least 8 characters',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  if (!fullName) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Full name is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);
  const auditRepo = new AuditRepository(db);

  // Check uniqueness
  const existing = await usersRepo.findByEmail(email);
  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'User with this email already exists',
        code: 'USER_EMAIL_EXISTS',
        statusCode: 409,
        meta: { timestamp: new Date().toISOString() },
      },
      409
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);
  const user = await usersRepo.createUser({
    email,
    passwordHash,
    fullName,
    role,
    status: 'active',
  });

  // Issue JWT
  const secret = getJwtSecret(c);
  const token = await signJWT(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    secret
  );

  // Audit log
  try {
    await auditRepo.createAuditLog({
      userId: user.id,
      action: 'auth.register',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking audit error
  }

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
    201
  );
});

// POST /api/auth/login
app.post('/login', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid JSON payload in request body',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS',
        statusCode: 401,
        meta: { timestamp: new Date().toISOString() },
      },
      401
    );
  }

  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);
  const auditRepo = new AuditRepository(db);

  const user = await usersRepo.findByEmail(email);
  if (!user || !user.passwordHash || user.status === 'suspended') {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS',
        statusCode: 401,
        meta: { timestamp: new Date().toISOString() },
      },
      401
    );
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS',
        statusCode: 401,
        meta: { timestamp: new Date().toISOString() },
      },
      401
    );
  }

  const secret = getJwtSecret(c);
  const token = await signJWT(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    secret
  );

  try {
    await auditRepo.createAuditLog({
      userId: user.id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email },
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    },
    200
  );
});

// GET /api/auth/me
app.get('/me', authMiddleware, async (c) => {
  const currentUser = getCurrentUser(c);
  const db = getDb(c.env as any);
  const usersRepo = new UsersRepository(db);

  const user = await usersRepo.findById(currentUser.sub);
  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'User profile not found',
        code: 'USER_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    200
  );
});

export default app;

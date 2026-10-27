import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { CasesRepository } from '../db/cases.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { authMiddleware, getCurrentUser } from '../middleware/auth.js';
import { caseAccessMiddleware, getCurrentCase } from '../middleware/rbac.js';
import type { CasePriority, CaseStatus } from '@shared/types/case.js';

const app = new Hono();

// Apply auth to all /cases routes
app.use('*', authMiddleware);

// POST /api/cases
app.post('/', async (c) => {
  const user = getCurrentUser(c);
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

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Case title is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const priority: CasePriority = ['low', 'medium', 'high', 'critical'].includes(body.priority)
    ? body.priority
    : 'medium';
  const tags: string[] = Array.isArray(body.tags) ? body.tags.map(String) : [];

  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);
  const auditRepo = new AuditRepository(db);

  const createdCase = await casesRepo.createCase({
    title,
    description,
    ownerId: user.sub,
    status: 'active',
    priority,
    tags,
  });

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'case.create',
      resourceType: 'case',
      resourceId: createdCase.id,
      details: { title: createdCase.title, priority: createdCase.priority },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ case: createdCase }, 201);
});

// GET /api/cases
app.get('/', async (c) => {
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);

  const query = c.req.query();
  const status = ['active', 'archived', 'closed'].includes(query.status)
    ? (query.status as CaseStatus)
    : undefined;
  const priority = ['low', 'medium', 'high', 'critical'].includes(query.priority)
    ? (query.priority as CasePriority)
    : undefined;
  const limit = query.limit ? Math.max(1, Math.min(100, parseInt(query.limit, 10) || 50)) : 50;
  const offset = query.offset ? Math.max(0, parseInt(query.offset, 10) || 0) : 0;

  // Investigator sees only own cases; Admin sees all cases
  const ownerId = user.role === 'admin' ? undefined : user.sub;

  const result = await casesRepo.listCases({
    ownerId,
    status,
    priority,
    limit,
    offset,
  });

  return c.json(
    {
      cases: result.cases,
      total: result.total,
      limit,
      offset,
    },
    200
  );
});

// GET /api/cases/:id
app.get('/:id', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);
  const auditRepo = new AuditRepository(db);

  const details = await casesRepo.getCaseWithDetails(caseId);
  if (!details) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Case not found',
        code: 'CASE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'case.read',
      resourceType: 'case',
      resourceId: caseId,
      details: { title: details.case.title },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json(
    {
      case: details.case,
      dossiers: details.dossiers,
      evidence: details.evidence,
      notes: details.notes,
      timelines: details.timelines,
    },
    200
  );
});

// PATCH /api/cases/:id
app.patch('/:id', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const user = getCurrentUser(c);
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

  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);
  const auditRepo = new AuditRepository(db);

  const updates: Parameters<typeof casesRepo.updateCase>[1] = {};
  if (typeof body.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (typeof body.description === 'string') {
    updates.description = body.description.trim();
  }
  if (['active', 'archived', 'closed'].includes(body.status)) {
    updates.status = body.status;
  }
  if (['low', 'medium', 'high', 'critical'].includes(body.priority)) {
    updates.priority = body.priority;
  }
  if (Array.isArray(body.tags)) {
    updates.tags = body.tags.map(String);
  }

  const updated = await casesRepo.updateCase(caseId, updates);
  if (!updated) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Case not found',
        code: 'CASE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'case.update',
      resourceType: 'case',
      resourceId: caseId,
      details: updates,
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ case: updated }, 200);
});

// DELETE /api/cases/:id
app.delete('/:id', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);
  const auditRepo = new AuditRepository(db);

  const success = await casesRepo.deleteCase(caseId);
  if (!success) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete case',
        code: 'DATABASE_ERROR',
        statusCode: 500,
        meta: { timestamp: new Date().toISOString() },
      },
      500
    );
  }

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'case.delete',
      resourceType: 'case',
      resourceId: caseId,
      details: {},
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ success: true, message: 'Case deleted' }, 200);
});

export default app;

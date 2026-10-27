import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { TimelinesRepository } from '../db/timelines.repo.js';
import { CasesRepository } from '../db/cases.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { authMiddleware, getCurrentUser } from '../middleware/auth.js';
import { caseAccessMiddleware } from '../middleware/rbac.js';
import type { TimelineCategory, TimelineSignificance } from '@shared/types/case.js';

const app = new Hono();

app.use('*', authMiddleware);

// POST /api/cases/:id/timelines
app.post('/cases/:id/timelines', caseAccessMiddleware, async (c) => {
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

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Timeline event title is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const eventTimestamp = typeof body.eventTimestamp === 'string' ? body.eventTimestamp : new Date().toISOString();
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const dossierId = typeof body.dossierId === 'string' ? body.dossierId : null;

  const validCategories: TimelineCategory[] = [
    'employment',
    'education',
    'financial',
    'incident',
    'travel',
    'legal',
    'social',
    'cyber',
  ];
  const category: TimelineCategory = validCategories.includes(body.category) ? body.category : 'incident';

  const validSignificance: TimelineSignificance[] = ['low', 'medium', 'high', 'critical'];
  const significance: TimelineSignificance = validSignificance.includes(body.significance)
    ? body.significance
    : 'medium';

  const db = getDb(c.env as any);
  const timelinesRepo = new TimelinesRepository(db);
  const auditRepo = new AuditRepository(db);

  const timeline = await timelinesRepo.createTimelineEvent({
    caseId,
    dossierId,
    eventTimestamp,
    title,
    description,
    category,
    significance,
  });

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'timeline.create',
      resourceType: 'timeline',
      resourceId: timeline.id,
      details: { caseId, category, significance },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ timeline }, 201);
});

// GET /api/cases/:id/timelines
app.get('/cases/:id/timelines', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const db = getDb(c.env as any);
  const timelinesRepo = new TimelinesRepository(db);

  const timelines = await timelinesRepo.listByCaseId(caseId);
  return c.json({ timelines }, 200);
});

// DELETE /api/timelines/:id
app.delete('/timelines/:id', async (c) => {
  const timelineId = c.req.param('id');
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const timelinesRepo = new TimelinesRepository(db);
  const casesRepo = new CasesRepository(db);

  const record = await timelinesRepo.findById(timelineId);
  if (!record) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Timeline event not found',
        code: 'TIMELINE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  const parentCase = await casesRepo.findById(record.caseId);
  const canDelete = user.role === 'admin' || (parentCase && parentCase.ownerId === user.sub);
  if (!canDelete) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Access denied: you do not have permission to delete this timeline event',
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        meta: { timestamp: new Date().toISOString() },
      },
      403
    );
  }

  await timelinesRepo.deleteTimelineEvent(timelineId);
  return c.json({ success: true, message: 'Timeline event deleted' }, 200);
});

export default app;

import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { EvidenceRepository } from '../db/evidence.repo.js';
import { CasesRepository } from '../db/cases.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { authMiddleware, getCurrentUser } from '../middleware/auth.js';
import { caseAccessMiddleware } from '../middleware/rbac.js';
import type { EvidenceType } from '@shared/types/case.js';

const app = new Hono();

app.use('*', authMiddleware);

// POST /api/cases/:id/evidence
app.post('/cases/:id/evidence', caseAccessMiddleware, async (c) => {
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
        message: 'Evidence title is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const validTypes: EvidenceType[] = [
    'document',
    'network_artifact',
    'credential',
    'communication',
    'financial_record',
    'raw_json',
    'other',
  ];
  const type: EvidenceType = validTypes.includes(body.type) ? body.type : 'document';
  const content = typeof body.content === 'string' ? body.content : '';
  const dossierId = typeof body.dossierId === 'string' ? body.dossierId : null;
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl : '';
  const hashSha256 = typeof body.hashSha256 === 'string' ? body.hashSha256 : undefined;

  const db = getDb(c.env as any);
  const evidenceRepo = new EvidenceRepository(db);
  const auditRepo = new AuditRepository(db);

  const evidence = await evidenceRepo.createEvidence({
    caseId,
    dossierId,
    title,
    type,
    content,
    sourceUrl,
    hashSha256,
  });

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'evidence.create',
      resourceType: 'evidence',
      resourceId: evidence.id,
      details: { caseId, title, type },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ evidence }, 201);
});

// GET /api/cases/:id/evidence
app.get('/cases/:id/evidence', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const db = getDb(c.env as any);
  const evidenceRepo = new EvidenceRepository(db);

  const evidence = await evidenceRepo.listByCaseId(caseId);
  return c.json({ evidence }, 200);
});

// DELETE /api/evidence/:id
app.delete('/evidence/:id', async (c) => {
  const evidenceId = c.req.param('id');
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const evidenceRepo = new EvidenceRepository(db);
  const casesRepo = new CasesRepository(db);
  const auditRepo = new AuditRepository(db);

  const record = await evidenceRepo.findById(evidenceId);
  if (!record) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Evidence item not found',
        code: 'EVIDENCE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  // Check parent case permission
  const parentCase = await casesRepo.findById(record.caseId);
  if (parentCase && user.role !== 'admin' && parentCase.ownerId !== user.sub) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Access denied: you do not have permission to delete this evidence',
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        meta: { timestamp: new Date().toISOString() },
      },
      403
    );
  }

  await evidenceRepo.deleteEvidence(evidenceId);

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'evidence.delete',
      resourceType: 'evidence',
      resourceId: evidenceId,
      details: { caseId: record.caseId },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ success: true, message: 'Evidence deleted' }, 200);
});

export default app;

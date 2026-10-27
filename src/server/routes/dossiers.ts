import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { DossiersRepository } from '../db/dossiers.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { authMiddleware, getCurrentUser } from '../middleware/auth.js';
import { caseAccessMiddleware } from '../middleware/rbac.js';
import { generateIdentity } from '@generator/engine.js';
import type { GeneratorOptions } from '@shared/types/dossier.js';

const app = new Hono();

// Apply auth to all dossier routes
app.use('*', authMiddleware);

// POST /api/cases/:id/dossiers
app.post('/cases/:id/dossiers', caseAccessMiddleware, async (c) => {
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

  const seed = String(body.seed || 'default-seed');
  const generatorParams = body.generatorParams || body.parameters || {};
  const fullName = String(body.fullName || body.dossierData?.personal?.fullName || 'Unknown Entity');
  const primaryAlias = String(body.primaryAlias || body.dossierData?.personal?.alias || '');
  const nationality = String(body.nationality || body.dossierData?.personal?.nationality || 'US');
  const dossierData = body.dossierData || {};

  const db = getDb(c.env as any);
  const dossiersRepo = new DossiersRepository(db);
  const auditRepo = new AuditRepository(db);

  const dossier = await dossiersRepo.createDossier({
    caseId,
    seed,
    generatorParams,
    fullName,
    primaryAlias,
    nationality,
    dossierData,
  });

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'dossier.create',
      resourceType: 'dossier',
      resourceId: dossier.id,
      details: { caseId, seed, fullName },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ dossier }, 201);
});

// GET /api/cases/:id/dossiers
app.get('/cases/:id/dossiers', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const db = getDb(c.env as any);
  const dossiersRepo = new DossiersRepository(db);

  const dossiers = await dossiersRepo.listByCaseId(caseId);
  return c.json({ dossiers }, 200);
});

// Generation handler shared by /identity/generate and /dossiers/generate
async function handleGenerate(c: any) {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const seed = String(body.seed ?? 'netra-target-' + Date.now());
  const parameters: Partial<GeneratorOptions> = {
    seed,
    ...(body.parameters || {}),
  };

  try {
    const dossier = generateIdentity(parameters);
    return c.json(
      {
        seed,
        parameters,
        dossier,
      },
      200
    );
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: err?.message || 'Failed to generate identity',
        code: 'GENERATION_ERROR',
        details: err?.errors || undefined,
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }
}

// POST /api/dossiers/generate
app.post('/dossiers/generate', handleGenerate);

// POST /api/identity/generate
app.post('/identity/generate', handleGenerate);

export default app;

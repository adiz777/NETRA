import type { Context, Next } from 'hono';
import { getCurrentUser } from './auth.js';
import { getDb } from '../db/client.js';
import { CasesRepository } from '../db/cases.repo.js';
import type { UserRole } from '@shared/types/auth.js';
import type { Case } from '@shared/types/case.js';

export async function caseAccessMiddleware(c: Context, next: Next) {
  const user = getCurrentUser(c);
  const caseId = c.req.param('id') || c.req.param('caseId');

  if (!caseId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Missing case ID parameter',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const db = getDb(c.env as any);
  const casesRepo = new CasesRepository(db);
  const caseRecord = await casesRepo.findById(caseId);

  if (!caseRecord) {
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

  // RBAC check: Admin can access any case; Investigator can only access own cases
  if (user.role !== 'admin' && caseRecord.ownerId !== user.sub) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: `Access denied: you do not have permission to access case ${caseId}`,
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        meta: { timestamp: new Date().toISOString() },
      },
      403
    );
  }

  c.set('case', caseRecord);
  return next();
}

export function getCurrentCase(c: Context): Case {
  const caseRecord = c.get('case') as Case | undefined;
  if (!caseRecord) {
    throw new Error('Case not found in context. Did you apply caseAccessMiddleware?');
  }
  return caseRecord;
}

export function requireRole(requiredRole: UserRole) {
  return async (c: Context, next: Next) => {
    const user = getCurrentUser(c);
    if (user.role !== requiredRole) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: `Forbidden: requires ${requiredRole} role`,
          code: 'AUTH_FORBIDDEN',
          statusCode: 403,
          meta: { timestamp: new Date().toISOString() },
        },
        403
      );
    }
    return next();
  };
}

import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { NotesRepository } from '../db/notes.repo.js';
import { CasesRepository } from '../db/cases.repo.js';
import { AuditRepository } from '../db/audit.repo.js';
import { authMiddleware, getCurrentUser } from '../middleware/auth.js';
import { caseAccessMiddleware } from '../middleware/rbac.js';
import type { NoteCategory } from '@shared/types/case.js';

const app = new Hono();

app.use('*', authMiddleware);

// POST /api/cases/:id/notes
app.post('/cases/:id/notes', caseAccessMiddleware, async (c) => {
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

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Note content is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        meta: { timestamp: new Date().toISOString() },
      },
      400
    );
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const validCategories: NoteCategory[] = ['observation', 'lead', 'hypothesis', 'interview', 'summary'];
  const category: NoteCategory = validCategories.includes(body.category) ? body.category : 'observation';

  const db = getDb(c.env as any);
  const notesRepo = new NotesRepository(db);
  const auditRepo = new AuditRepository(db);

  const note = await notesRepo.createNote({
    caseId,
    authorId: user.sub,
    title,
    content,
    category,
  });

  try {
    await auditRepo.createAuditLog({
      userId: user.sub,
      action: 'note.create',
      resourceType: 'note',
      resourceId: note.id,
      details: { caseId, category },
      ipAddress: c.req.header('x-forwarded-for') || '',
      userAgent: c.req.header('user-agent') || '',
    });
  } catch {
    // Non-blocking
  }

  return c.json({ note }, 201);
});

// GET /api/cases/:id/notes
app.get('/cases/:id/notes', caseAccessMiddleware, async (c) => {
  const caseId = c.req.param('id')!;
  const db = getDb(c.env as any);
  const notesRepo = new NotesRepository(db);

  const notes = await notesRepo.listByCaseId(caseId);
  return c.json({ notes }, 200);
});

// PATCH /api/notes/:id
app.patch('/notes/:id', async (c) => {
  const noteId = c.req.param('id');
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
  const notesRepo = new NotesRepository(db);
  const casesRepo = new CasesRepository(db);

  const record = await notesRepo.findById(noteId);
  if (!record) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  // Permission: author, case owner, or admin
  const parentCase = await casesRepo.findById(record.caseId);
  const canEdit = user.role === 'admin' || record.authorId === user.sub || (parentCase && parentCase.ownerId === user.sub);
  if (!canEdit) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Access denied: you do not have permission to edit this note',
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        meta: { timestamp: new Date().toISOString() },
      },
      403
    );
  }

  const updates: Parameters<typeof notesRepo.updateNote>[1] = {};
  if (typeof body.title === 'string') updates.title = body.title.trim();
  if (typeof body.content === 'string') updates.content = body.content.trim();
  if (['observation', 'lead', 'hypothesis', 'interview', 'summary'].includes(body.category)) {
    updates.category = body.category;
  }

  const updated = await notesRepo.updateNote(noteId, updates);
  return c.json({ note: updated }, 200);
});

// DELETE /api/notes/:id
app.delete('/notes/:id', async (c) => {
  const noteId = c.req.param('id');
  const user = getCurrentUser(c);
  const db = getDb(c.env as any);
  const notesRepo = new NotesRepository(db);
  const casesRepo = new CasesRepository(db);

  const record = await notesRepo.findById(noteId);
  if (!record) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND',
        statusCode: 404,
        meta: { timestamp: new Date().toISOString() },
      },
      404
    );
  }

  const parentCase = await casesRepo.findById(record.caseId);
  const canDelete = user.role === 'admin' || record.authorId === user.sub || (parentCase && parentCase.ownerId === user.sub);
  if (!canDelete) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Access denied: you do not have permission to delete this note',
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        meta: { timestamp: new Date().toISOString() },
      },
      403
    );
  }

  await notesRepo.deleteNote(noteId);
  return c.json({ success: true, message: 'Note deleted' }, 200);
});

export default app;

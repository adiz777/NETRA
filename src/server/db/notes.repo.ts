import type { IDatabase } from './client.js';
import type { NoteRecord, NoteCategory } from '@shared/types/case.js';

interface NoteRow {
  id: string;
  case_id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function mapRowToNote(row: NoteRow): NoteRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    category: row.category as NoteCategory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class NotesRepository {
  constructor(private db: IDatabase) {}

  async createNote(input: {
    id?: string;
    caseId: string;
    authorId: string;
    title?: string;
    content: string;
    category?: NoteCategory;
  }): Promise<NoteRecord> {
    const id = input.id ?? `not_${crypto.randomUUID().replace(/-/g, '')}`;
    const title = input.title ?? '';
    const category = input.category ?? 'observation';

    const stmt = this.db.prepare(
      `INSERT INTO notes (id, case_id, author_id, title, content, category)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(id, input.caseId, input.authorId, title, input.content, category).run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created note with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<NoteRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, author_id, title, content, category, created_at, updated_at
       FROM notes WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<NoteRow>();
    return row ? mapRowToNote(row) : null;
  }

  async listByCaseId(caseId: string): Promise<NoteRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, author_id, title, content, category, created_at, updated_at
       FROM notes WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results } = await stmt.bind(caseId).all<NoteRow>();
    return results.map(mapRowToNote);
  }

  async updateNote(
    id: string,
    updates: Partial<{ title: string; content: string; category: NoteCategory }>
  ): Promise<NoteRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = updates.title ?? existing.title;
    const content = updates.content ?? existing.content;
    const category = updates.category ?? existing.category;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(
      `UPDATE notes
       SET title = ?, content = ?, category = ?, updated_at = ?
       WHERE id = ?`
    );
    await stmt.bind(title, content, category, now, id).run();
    return this.findById(id);
  }

  async deleteNote(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM notes WHERE id = ?`);
    const res = await stmt.bind(id).run();
    return res.success;
  }
}

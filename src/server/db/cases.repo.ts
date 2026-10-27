import type { IDatabase } from './client.js';
import type {
  Case,
  CaseStatus,
  CasePriority,
  CaseDetail,
  DossierRecord,
  EvidenceRecord,
  NoteRecord,
  TimelineRecord,
} from '@shared/types/case.js';

interface CaseRow {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  status: string;
  priority: string;
  tags: string;
  created_at: string;
  updated_at: string;
  dossier_count?: number;
  evidence_count?: number;
}

function mapRowToCase(row: CaseRow): Case {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerId: row.owner_id,
    status: row.status as CaseStatus,
    priority: row.priority as CasePriority,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dossierCount: row.dossier_count ?? undefined,
    evidenceCount: row.evidence_count ?? undefined,
  };
}

export class CasesRepository {
  constructor(private db: IDatabase) {}

  async createCase(input: {
    id?: string;
    title: string;
    description?: string;
    ownerId: string;
    status?: CaseStatus;
    priority?: CasePriority;
    tags?: string[];
  }): Promise<Case> {
    const id = input.id ?? `case_${crypto.randomUUID().replace(/-/g, '')}`;
    const description = input.description ?? '';
    const status = input.status ?? 'active';
    const priority = input.priority ?? 'medium';
    const tagsJson = JSON.stringify(input.tags ?? []);

    const stmt = this.db.prepare(
      `INSERT INTO cases (id, title, description, owner_id, status, priority, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(id, input.title, description, input.ownerId, status, priority, tagsJson).run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created case with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<Case | null> {
    const stmt = this.db.prepare(
      `SELECT c.id, c.title, c.description, c.owner_id, c.status, c.priority, c.tags, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM dossiers d WHERE d.case_id = c.id) AS dossier_count,
              (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) AS evidence_count
       FROM cases c
       WHERE c.id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<CaseRow>();
    return row ? mapRowToCase(row) : null;
  }

  async listCases(filter?: {
    ownerId?: string;
    status?: CaseStatus;
    priority?: CasePriority;
    limit?: number;
    offset?: number;
  }): Promise<{ cases: Case[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.ownerId) {
      conditions.push('c.owner_id = ?');
      params.push(filter.ownerId);
    }
    if (filter?.status) {
      conditions.push('c.status = ?');
      params.push(filter.status);
    }
    if (filter?.priority) {
      conditions.push('c.priority = ?');
      params.push(filter.priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM cases c ${whereClause}`);
    const countRow = await countStmt.bind(...params).first<{ total: number }>();
    const total = countRow?.total ?? 0;

    // Cases
    const limit = filter?.limit ?? 50;
    const offset = filter?.offset ?? 0;
    const listParams = [...params, limit, offset];

    const stmt = this.db.prepare(
      `SELECT c.id, c.title, c.description, c.owner_id, c.status, c.priority, c.tags, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM dossiers d WHERE d.case_id = c.id) AS dossier_count,
              (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) AS evidence_count
       FROM cases c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    );
    const { results } = await stmt.bind(...listParams).all<CaseRow>();
    return {
      cases: results.map(mapRowToCase),
      total,
    };
  }

  async updateCase(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      status: CaseStatus;
      priority: CasePriority;
      tags: string[];
    }>
  ): Promise<Case | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = updates.title ?? existing.title;
    const description = updates.description ?? existing.description;
    const status = updates.status ?? existing.status;
    const priority = updates.priority ?? existing.priority;
    const tagsJson = JSON.stringify(updates.tags ?? existing.tags);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(
      `UPDATE cases
       SET title = ?, description = ?, status = ?, priority = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    );
    await stmt.bind(title, description, status, priority, tagsJson, now, id).run();
    return this.findById(id);
  }

  async deleteCase(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM cases WHERE id = ?`);
    const res = await stmt.bind(id).run();
    return res.success;
  }

  async getCaseWithDetails(id: string): Promise<CaseDetail | null> {
    const caseRecord = await this.findById(id);
    if (!caseRecord) return null;

    // Fetch dossiers
    const dosStmt = this.db.prepare(
      `SELECT id, case_id, seed, generator_params, full_name, primary_alias, nationality, dossier_data, created_at, updated_at
       FROM dossiers WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results: dosRows } = await dosStmt.bind(id).all<any>();
    const dossiers: DossierRecord[] = dosRows.map(row => ({
      id: row.id,
      caseId: row.case_id,
      seed: row.seed,
      generatorParams: JSON.parse(row.generator_params || '{}'),
      fullName: row.full_name,
      primaryAlias: row.primary_alias,
      nationality: row.nationality,
      dossierData: JSON.parse(row.dossier_data || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Fetch evidence
    const eviStmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, title, type, content, source_url, hash_sha256, created_at, updated_at
       FROM evidence WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results: eviRows } = await eviStmt.bind(id).all<any>();
    const evidence: EvidenceRecord[] = eviRows.map(row => ({
      id: row.id,
      caseId: row.case_id,
      dossierId: row.dossier_id ?? null,
      title: row.title,
      type: row.type,
      content: row.content,
      sourceUrl: row.source_url,
      hashSha256: row.hash_sha256,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Fetch notes
    const notStmt = this.db.prepare(
      `SELECT id, case_id, author_id, title, content, category, created_at, updated_at
       FROM notes WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results: notRows } = await notStmt.bind(id).all<any>();
    const notes: NoteRecord[] = notRows.map(row => ({
      id: row.id,
      caseId: row.case_id,
      authorId: row.author_id,
      title: row.title,
      content: row.content,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Fetch timelines
    const tleStmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, event_timestamp, title, description, category, significance, created_at
       FROM timelines WHERE case_id = ? ORDER BY event_timestamp ASC`
    );
    const { results: tleRows } = await tleStmt.bind(id).all<any>();
    const timelines: TimelineRecord[] = tleRows.map(row => ({
      id: row.id,
      caseId: row.case_id,
      dossierId: row.dossier_id ?? null,
      eventTimestamp: row.event_timestamp,
      title: row.title,
      description: row.description,
      category: row.category,
      significance: row.significance,
      createdAt: row.created_at,
    }));

    return {
      case: caseRecord,
      dossiers,
      evidence,
      notes,
      timelines,
    };
  }
}

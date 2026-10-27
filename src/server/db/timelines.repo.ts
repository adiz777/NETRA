import type { IDatabase } from './client.js';
import type { TimelineRecord, TimelineCategory, TimelineSignificance } from '@shared/types/case.js';

interface TimelineRow {
  id: string;
  case_id: string;
  dossier_id: string | null;
  event_timestamp: string;
  title: string;
  description: string;
  category: string;
  significance: string;
  created_at: string;
}

function mapRowToTimeline(row: TimelineRow): TimelineRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    dossierId: row.dossier_id ?? null,
    eventTimestamp: row.event_timestamp,
    title: row.title,
    description: row.description,
    category: row.category as TimelineCategory,
    significance: row.significance as TimelineSignificance,
    createdAt: row.created_at,
  };
}

export class TimelinesRepository {
  constructor(private db: IDatabase) {}

  async createTimelineEvent(input: {
    id?: string;
    caseId: string;
    dossierId?: string | null;
    eventTimestamp: string;
    title: string;
    description?: string;
    category: TimelineCategory;
    significance?: TimelineSignificance;
  }): Promise<TimelineRecord> {
    const id = input.id ?? `tle_${crypto.randomUUID().replace(/-/g, '')}`;
    const dossierId = input.dossierId ?? null;
    const description = input.description ?? '';
    const significance = input.significance ?? 'medium';

    const stmt = this.db.prepare(
      `INSERT INTO timelines (id, case_id, dossier_id, event_timestamp, title, description, category, significance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt
      .bind(id, input.caseId, dossierId, input.eventTimestamp, input.title, description, input.category, significance)
      .run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created timeline event with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<TimelineRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, event_timestamp, title, description, category, significance, created_at
       FROM timelines WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<TimelineRow>();
    return row ? mapRowToTimeline(row) : null;
  }

  async listByCaseId(caseId: string): Promise<TimelineRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, event_timestamp, title, description, category, significance, created_at
       FROM timelines WHERE case_id = ? ORDER BY event_timestamp ASC`
    );
    const { results } = await stmt.bind(caseId).all<TimelineRow>();
    return results.map(mapRowToTimeline);
  }

  async deleteTimelineEvent(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM timelines WHERE id = ?`);
    const res = await stmt.bind(id).run();
    return res.success;
  }
}

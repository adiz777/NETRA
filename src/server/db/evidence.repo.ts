import type { IDatabase } from './client.js';
import type { EvidenceRecord, EvidenceType } from '@shared/types/case.js';

interface EvidenceRow {
  id: string;
  case_id: string;
  dossier_id: string | null;
  title: string;
  type: string;
  content: string;
  source_url: string;
  hash_sha256: string;
  created_at: string;
  updated_at: string;
}

function mapRowToEvidence(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    dossierId: row.dossier_id ?? null,
    title: row.title,
    type: row.type as EvidenceType,
    content: row.content,
    sourceUrl: row.source_url,
    hashSha256: row.hash_sha256,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function computeSha256(content: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class EvidenceRepository {
  constructor(private db: IDatabase) {}

  async createEvidence(input: {
    id?: string;
    caseId: string;
    dossierId?: string | null;
    title: string;
    type: EvidenceType;
    content: string;
    sourceUrl?: string;
    hashSha256?: string;
  }): Promise<EvidenceRecord> {
    const id = input.id ?? `evi_${crypto.randomUUID().replace(/-/g, '')}`;
    const dossierId = input.dossierId ?? null;
    const sourceUrl = input.sourceUrl ?? '';
    const hashSha256 = input.hashSha256 ?? (await computeSha256(input.content));

    const stmt = this.db.prepare(
      `INSERT INTO evidence (id, case_id, dossier_id, title, type, content, source_url, hash_sha256)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt
      .bind(id, input.caseId, dossierId, input.title, input.type, input.content, sourceUrl, hashSha256)
      .run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created evidence with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<EvidenceRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, title, type, content, source_url, hash_sha256, created_at, updated_at
       FROM evidence WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<EvidenceRow>();
    return row ? mapRowToEvidence(row) : null;
  }

  async listByCaseId(caseId: string): Promise<EvidenceRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, dossier_id, title, type, content, source_url, hash_sha256, created_at, updated_at
       FROM evidence WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results } = await stmt.bind(caseId).all<EvidenceRow>();
    return results.map(mapRowToEvidence);
  }

  async deleteEvidence(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM evidence WHERE id = ?`);
    const res = await stmt.bind(id).run();
    return res.success;
  }
}

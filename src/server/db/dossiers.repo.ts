import type { IDatabase } from './client.js';
import type { DossierRecord } from '@shared/types/case.js';

interface DossierRow {
  id: string;
  case_id: string;
  seed: string;
  generator_params: string;
  full_name: string;
  primary_alias: string;
  nationality: string;
  dossier_data: string;
  created_at: string;
  updated_at: string;
}

function mapRowToDossier(row: DossierRow): DossierRecord {
  let generatorParams: Record<string, unknown> = {};
  let dossierData: Record<string, unknown> = {};

  try {
    generatorParams = JSON.parse(row.generator_params || '{}');
  } catch {
    generatorParams = {};
  }

  try {
    dossierData = JSON.parse(row.dossier_data || '{}');
  } catch {
    dossierData = {};
  }

  return {
    id: row.id,
    caseId: row.case_id,
    seed: row.seed,
    generatorParams,
    fullName: row.full_name,
    primaryAlias: row.primary_alias,
    nationality: row.nationality,
    dossierData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DossiersRepository {
  constructor(private db: IDatabase) {}

  async createDossier(input: {
    id?: string;
    caseId: string;
    seed: string;
    generatorParams: Record<string, unknown>;
    fullName: string;
    primaryAlias?: string;
    nationality: string;
    dossierData: Record<string, unknown>;
  }): Promise<DossierRecord> {
    const id = input.id ?? `dos_${crypto.randomUUID().replace(/-/g, '')}`;
    const primaryAlias = input.primaryAlias ?? '';
    const paramsJson = JSON.stringify(input.generatorParams ?? {});
    const dataJson = JSON.stringify(input.dossierData ?? {});

    const stmt = this.db.prepare(
      `INSERT INTO dossiers (id, case_id, seed, generator_params, full_name, primary_alias, nationality, dossier_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt
      .bind(id, input.caseId, input.seed, paramsJson, input.fullName, primaryAlias, input.nationality, dataJson)
      .run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created dossier with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<DossierRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, seed, generator_params, full_name, primary_alias, nationality, dossier_data, created_at, updated_at
       FROM dossiers WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<DossierRow>();
    return row ? mapRowToDossier(row) : null;
  }

  async listByCaseId(caseId: string): Promise<DossierRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, case_id, seed, generator_params, full_name, primary_alias, nationality, dossier_data, created_at, updated_at
       FROM dossiers WHERE case_id = ? ORDER BY created_at DESC`
    );
    const { results } = await stmt.bind(caseId).all<DossierRow>();
    return results.map(mapRowToDossier);
  }

  async deleteDossier(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM dossiers WHERE id = ?`);
    const res = await stmt.bind(id).run();
    return res.success;
  }
}

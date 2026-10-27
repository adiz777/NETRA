import type { IDatabase } from './client.js';
import type { AuditLogRecord } from '@shared/types/case.js';

interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

function mapRowToAuditLog(row: AuditLogRow): AuditLogRecord {
  let details: Record<string, unknown> = {};
  try {
    details = JSON.parse(row.details || '{}');
  } catch {
    details = {};
  }

  return {
    id: row.id,
    userId: row.user_id ?? null,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export class AuditRepository {
  constructor(private db: IDatabase) {}

  async createAuditLog(input: {
    id?: string;
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLogRecord> {
    const id = input.id ?? `aud_${crypto.randomUUID().replace(/-/g, '')}`;
    const userId = input.userId ?? null;
    const resourceId = input.resourceId ?? '';
    const detailsJson = JSON.stringify(input.details ?? {});
    const ipAddress = input.ipAddress ?? '';
    const userAgent = input.userAgent ?? '';

    const stmt = this.db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(id, userId, input.action, input.resourceType, resourceId, detailsJson, ipAddress, userAgent).run();

    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve newly created audit log with id ${id}`);
    }
    return created;
  }

  async findById(id: string): Promise<AuditLogRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
       FROM audit_logs WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<AuditLogRow>();
    return row ? mapRowToAuditLog(row) : null;
  }

  async listAuditLogs(filter?: {
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.userId) {
      conditions.push('user_id = ?');
      params.push(filter.userId);
    }
    if (filter?.action) {
      conditions.push('action = ?');
      params.push(filter.action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter?.limit ?? 50;
    const offset = filter?.offset ?? 0;
    const listParams = [...params, limit, offset];

    const stmt = this.db.prepare(
      `SELECT id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    );
    const { results } = await stmt.bind(...listParams).all<AuditLogRow>();
    return results.map(mapRowToAuditLog);
  }
}

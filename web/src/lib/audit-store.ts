
import "server-only";
import { env } from "cloudflare:workers";

export type AuditStatus = "SUCCESS" | "DENIED" | "SYSTEM";

export type AuditEvent = {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  status: AuditStatus;
  source: string;
};

type AuditRow = {
  event_id: string;
  actor: string;
  action: string;
  target: string;
  status: string;
  source: string;
  created_at: string;
};

function mapEvent(row: AuditRow): AuditEvent {
  return {
    id: row.event_id,
    timestamp: row.created_at,
    action: row.action,
    actor: row.actor,
    target: row.target,
    status: row.status as AuditStatus,
    source: row.source,
  };
}

export async function listAudit(): Promise<AuditEvent[]> {
  const result = await env.DB.prepare(`
    SELECT event_id, actor, action, target, status, source, created_at
    FROM audit_events
    ORDER BY created_at DESC
    LIMIT 500
  `).all<AuditRow>();

  return (result.results ?? []).map(mapEvent);
}

export async function recordAudit(
  event: Omit<AuditEvent, "id" | "timestamp">,
): Promise<AuditEvent> {
  const next: AuditEvent = {
    ...event,
    id: "AUD-" + crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase(),
    timestamp: new Date().toISOString(),
  };

  await env.DB.prepare(`
    INSERT INTO audit_events (
      event_id, actor, action, target, status, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    next.id,
    next.actor,
    next.action,
    next.target,
    next.status,
    next.source,
    next.timestamp,
  ).run();

  return next;
}

export async function resetAudit(actor = "OPERATOR"): Promise<AuditEvent> {
  const event = await recordAudit({
    action: "AUDIT LOG RESET",
    actor,
    target: "SECURITY",
    status: "SUCCESS",
    source: "SECURITY",
  });

  await env.DB.prepare(`
    DELETE FROM audit_events WHERE event_id != ?
  `).bind(event.id).run();

  return event;
}

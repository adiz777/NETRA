
import "server-only";
import { env } from "cloudflare:workers";
import type { NetraCase } from "netra";

type CaseRow = { payload_json: string };

function asRecord(value: NetraCase): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

function textField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim()
    ? value
    : fallback;
}

export async function listCases(): Promise<NetraCase[]> {
  const result = await env.DB.prepare(
    "SELECT payload_json FROM cases ORDER BY updated_at DESC",
  ).all<CaseRow>();

  return (result.results ?? []).map(
    (row) => JSON.parse(row.payload_json) as NetraCase,
  );
}

export async function getCase(
  caseId: string,
): Promise<NetraCase | null> {
  const row = await env.DB.prepare(
    "SELECT payload_json FROM cases WHERE case_id = ?",
  ).bind(caseId).first<CaseRow>();

  return row
    ? JSON.parse(row.payload_json) as NetraCase
    : null;
}

export async function saveCase(
  netraCase: NetraCase,
): Promise<NetraCase> {
  const value = asRecord(netraCase);
  const now = new Date().toISOString();
  const caseId = textField(value.caseId, "");

  if (!caseId) throw new Error("CASE ID REQUIRED");

  const existing = await env.DB.prepare(
    "SELECT created_at FROM cases WHERE case_id = ?",
  ).bind(caseId).first<{ created_at: string }>();

  const createdAt = textField(
    value.createdAt ?? value.created_at,
    existing?.created_at ?? now,
  );
  const updatedAt = textField(
    value.updatedAt ?? value.updated_at,
    now,
  );

  await env.DB.prepare(`
    INSERT INTO cases (
      case_id, title, status, priority,
      payload_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(case_id) DO UPDATE SET
      title = excluded.title,
      status = excluded.status,
      priority = excluded.priority,
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
  `).bind(
    caseId,
    textField(value.title, "Untitled case"),
    textField(value.status, "OPEN"),
    textField(value.priority, "MEDIUM"),
    JSON.stringify(netraCase),
    createdAt,
    updatedAt,
  ).run();

  return netraCase;
}

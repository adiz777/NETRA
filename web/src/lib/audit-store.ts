import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

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

const filePath = path.join(process.cwd(), "data", "audit.json");

async function readAudit(): Promise<AuditEvent[]> {
  try {
    const value = JSON.parse(await fs.readFile(filePath, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function writeAudit(events: AuditEvent[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(events.slice(0, 500), null, 2), "utf8");
}

export async function listAudit() {
  return readAudit();
}

export async function recordAudit(
  event: Omit<AuditEvent, "id" | "timestamp">,
) {
  const next: AuditEvent = {
    ...event,
    id: "AUD-" + crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase(),
    timestamp: new Date().toISOString(),
  };
  const current = await readAudit();
  await writeAudit([next, ...current]);
  return next;
}

export async function resetAudit(actor = "OPERATOR") {
  const event = await recordAudit({
    action: "AUDIT LOG RESET",
    actor,
    target: "SECURITY",
    status: "SUCCESS",
    source: "SECURITY",
  });
  await writeAudit([event]);
  return event;
}

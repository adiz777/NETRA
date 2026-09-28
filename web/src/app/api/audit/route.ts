import { NextResponse } from "next/server";
import { listAudit, recordAudit, resetAudit } from "@/lib/audit-store";

export async function GET() {
  return NextResponse.json({ events: await listAudit() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "").trim();
    if (!action) {
      return NextResponse.json({ error: "AUDIT ACTION REQUIRED" }, { status: 400 });
    }

    const status = ["SUCCESS", "DENIED", "SYSTEM"].includes(String(body.status))
      ? String(body.status) as "SUCCESS" | "DENIED" | "SYSTEM"
      : "SYSTEM";

    const event = await recordAudit({
      action,
      actor: String(body.actor ?? (status === "SYSTEM" ? "SYSTEM" : "OPERATOR")),
      target: String(body.target ?? "NETRA"),
      status,
      source: String(body.source ?? "WEB"),
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "AUDIT WRITE FAILED" }, { status: 400 });
  }
}

export async function DELETE() {
  return NextResponse.json(await resetAudit());
}

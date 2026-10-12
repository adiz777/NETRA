import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listAudit, recordAudit, resetAudit } from "@/lib/audit-store";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

async function isAuthenticated() {
  const cookieStore = await cookies();
  return Boolean(verifySession(cookieStore.get(COOKIE_NAME)?.value));
}

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

export async function GET() {
  if (!(await isAuthenticated())) return unauthorized();

  return NextResponse.json(
    { events: await listAudit() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return unauthorized();

  try {
    const body = await request.json();
    const action = String(body.action ?? "").trim();

    if (!action) {
      return NextResponse.json(
        { error: "AUDIT ACTION REQUIRED" },
        { status: 400 },
      );
    }

    const status = ["SUCCESS", "DENIED", "SYSTEM"].includes(String(body.status))
      ? (String(body.status) as "SUCCESS" | "DENIED" | "SYSTEM")
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
  if (!(await isAuthenticated())) return unauthorized();

  try {
    return NextResponse.json(await resetAudit());
  } catch {
    return NextResponse.json({ error: "AUDIT RESET FAILED" }, { status: 500 });
  }
}
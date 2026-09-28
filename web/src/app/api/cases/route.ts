import { NextResponse } from "next/server";
import { addEvidence, addNote, assignSubject, createCase } from "netra";
import { getIdentityById } from "@/lib/netra";
import { getCase, listCases, saveCase } from "@/lib/case-store";

export async function GET(request: Request) {
  const caseId = new URL(request.url).searchParams.get("caseId")?.trim();
  if (caseId) {
    const item = await getCase(caseId);
    return item
      ? NextResponse.json(item)
      : NextResponse.json({ error: "CASE NOT FOUND" }, { status: 404 });
  }
  return NextResponse.json({ cases: await listCases() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "create");

    if (action === "create") {
      const title = String(body.title ?? "").trim();
      if (!title) return NextResponse.json({ error: "CASE TITLE REQUIRED" }, { status: 400 });
      const identityId = String(body.identityId ?? "").trim();
      const identity = identityId ? getIdentityById(identityId) : undefined;
      const item = createCase(title, identity);
      await saveCase(item);
      return NextResponse.json(item, { status: 201 });
    }

    const caseId = String(body.caseId ?? "").trim();
    const existing = await getCase(caseId);
    if (!existing) return NextResponse.json({ error: "CASE NOT FOUND" }, { status: 404 });

    if (action === "subject") {
      const identityId = String(body.identityId ?? "").trim();
      if (!identityId) return NextResponse.json({ error: "IDENTITY ID REQUIRED" }, { status: 400 });
      const updated = assignSubject(existing, getIdentityById(identityId));
      await saveCase(updated);
      return NextResponse.json(updated);
    }

    if (action === "evidence") {
      const type = String(body.type ?? "DOCUMENT").toUpperCase();
      const valid = ["NOTE", "DOCUMENT", "IMAGE", "LINK", "RECORD"] as const;
      if (!valid.includes(type as (typeof valid)[number])) {
        return NextResponse.json({ error: "INVALID EVIDENCE TYPE" }, { status: 400 });
      }
      const updated = addEvidence(existing, {
        title: String(body.title ?? "UNTITLED EVIDENCE"),
        description: String(body.description ?? ""),
        type: type as (typeof valid)[number],
      });
      await saveCase(updated);
      return NextResponse.json(updated);
    }

    if (action === "note") {
      const note = String(body.note ?? "").trim();
      if (!note) return NextResponse.json({ error: "NOTE REQUIRED" }, { status: 400 });
      const updated = addNote(existing, note);
      await saveCase(updated);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "UNKNOWN CASE ACTION" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "CASE OPERATION FAILED" }, { status: 500 });
  }
}

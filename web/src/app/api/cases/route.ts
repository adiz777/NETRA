import { NextResponse } from "next/server";
import {
  addEvidence,
  addNote,
  assignSubject,
  createCase,
} from "netra";
import { getIdentityById } from "@/lib/netra";

type NetraCase = ReturnType<typeof createCase>;

const cases = new Map<string, NetraCase>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");

  if (caseId) {
    const netraCase = cases.get(caseId);

    if (!netraCase) {
      return NextResponse.json(
        { error: "CASE NOT FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(netraCase);
  }

  return NextResponse.json({
    cases: Array.from(cases.values()),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? "create");

    if (action === "create") {
      const title = String(body.title ?? "").trim();

      if (!title) {
        return NextResponse.json(
          { error: "CASE TITLE REQUIRED" },
          { status: 400 },
        );
      }

      const identityId = String(
        body.identityId ?? "",
      ).trim();

      const identity = identityId
        ? getIdentityById(identityId)
        : undefined;

      const netraCase = createCase(title, identity);

      cases.set(netraCase.caseId, netraCase);

      return NextResponse.json(
        netraCase,
        { status: 201 },
      );
    }

    const caseId = String(body.caseId ?? "");
    const existingCase = cases.get(caseId);

    if (!existingCase) {
      return NextResponse.json(
        { error: "CASE NOT FOUND" },
        { status: 404 },
      );
    }

    if (action === "subject") {
      const identityId = String(
        body.identityId ?? "",
      ).trim();

      if (!identityId) {
        return NextResponse.json(
          { error: "IDENTITY ID REQUIRED" },
          { status: 400 },
        );
      }

      const identity = getIdentityById(identityId);
      const updated = assignSubject(
        existingCase,
        identity,
      );

      cases.set(caseId, updated);

      return NextResponse.json(updated);
    }

    if (action === "evidence") {
      const evidenceType = String(
        body.type ?? "DOCUMENT",
      ).toUpperCase();

      const validTypes = [
        "NOTE",
        "DOCUMENT",
        "IMAGE",
        "LINK",
        "RECORD",
      ] as const;

      if (
        !validTypes.includes(
          evidenceType as (typeof validTypes)[number],
        )
      ) {
        return NextResponse.json(
          { error: "INVALID EVIDENCE TYPE" },
          { status: 400 },
        );
      }

      const updated = addEvidence(
        existingCase,
        {
          title: String(
            body.title ?? "UNTITLED EVIDENCE",
          ),
          description: String(
            body.description ?? "",
          ),
          type:
            evidenceType as (typeof validTypes)[number],
        },
      );

      cases.set(caseId, updated);

      return NextResponse.json(updated);
    }

    if (action === "note") {
      const note = String(
        body.note ?? "",
      ).trim();

      if (!note) {
        return NextResponse.json(
          { error: "NOTE REQUIRED" },
          { status: 400 },
        );
      }

      const updated = addNote(
        existingCase,
        note,
      );

      cases.set(caseId, updated);

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "UNKNOWN CASE ACTION" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "CASE OPERATION FAILED" },
      { status: 500 },
    );
  }
}

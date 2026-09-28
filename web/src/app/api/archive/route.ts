import { NextResponse } from "next/server";
import { listCases } from "@/lib/case-store";

export async function GET() {
  try {
    const cases = await listCases();
    return NextResponse.json({
      archive: cases.filter((item) => item.status === "ARCHIVED"),
      cases,
      count: cases.length,
    });
  } catch {
    return NextResponse.json({ error: "ARCHIVE RETRIEVAL FAILED" }, { status: 500 });
  }
}

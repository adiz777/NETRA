import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { filename?: string; data?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "INVALID JSON BODY" }, { status: 400 }); }
  const filename = String(body.filename ?? "netra-export").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "netra-export";
  if (body.data === undefined) return NextResponse.json({ error: "EXPORT DATA REQUIRED" }, { status: 400 });
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), classification: "USER-PROVIDED INVESTIGATION DATA", data: body.data }, null, 2);
  return new NextResponse(content, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="' + filename + '.json"', "Cache-Control": "no-store" } });
}

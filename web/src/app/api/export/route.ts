import { NextResponse } from "next/server";
import {
  getIdentityById,
  createDossier,
  createNetwork,
  createTimeline,
  createExposure,
  createReport,
  exportReportJSON,
} from "netra";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id")?.trim();
    const type = (params.get("type") || "report").toLowerCase();

    if (!id) return NextResponse.json({ error: "IDENTITY ID REQUIRED" }, { status: 400 });

    const identity = getIdentityById(id);
    let payload: unknown;
    switch (type) {
      case "dossier": payload = createDossier(identity); break;
      case "network": payload = createNetwork(identity); break;
      case "timeline": payload = createTimeline(identity); break;
      case "exposure": payload = createExposure(identity); break;
      case "report": payload = createReport(identity); break;
      default: return NextResponse.json({ error: "INVALID EXPORT TYPE" }, { status: 400 });
    }

    const body = type === "report"
      ? exportReportJSON(payload as ReturnType<typeof createReport>)
      : JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${identity.netraId}-${type}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "EXPORT FAILED" }, { status: 500 });
  }
}

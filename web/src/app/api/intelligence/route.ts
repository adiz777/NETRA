import { NextResponse } from "next/server";
import {
  getIdentityById,
  createDossier,
  createNetwork,
  createTimeline,
  createExposure,
  createReport,
} from "netra";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "IDENTITY ID REQUIRED" }, { status: 400 });

    const identity = getIdentityById(id);
    return NextResponse.json({
      identity,
      dossier: createDossier(identity),
      network: createNetwork(identity),
      timeline: createTimeline(identity),
      exposure: createExposure(identity),
      report: createReport(identity),
    });
  } catch {
    return NextResponse.json({ error: "INTELLIGENCE GENERATION FAILED" }, { status: 500 });
  }
}

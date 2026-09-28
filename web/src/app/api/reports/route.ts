import { NextResponse } from "next/server";
import { createReport, exportReportJSON } from "netra";
import { getIdentityById } from "@/lib/netra";
import { getCase } from "@/lib/case-store";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const identityId = params.get("identityId")?.trim();
    const caseId = params.get("caseId")?.trim();
    const format = params.get("format")?.trim().toLowerCase();

    if (caseId) {
      const netraCase = await getCase(caseId);
      if (!netraCase) {
        return NextResponse.json({ error: "CASE NOT FOUND" }, { status: 404 });
      }

      const report = {
        reportId: `RPT-${netraCase.caseId.replace("CASE-", "")}`,
        generatedAt: new Date().toISOString(),
        classification: "FICTIONAL" as const,
        type: "CASE INTELLIGENCE",
        case: netraCase,
      };

      if (format === "json") {
        return new NextResponse(JSON.stringify(report, null, 2), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${report.reportId}.json"`,
          },
        });
      }

      return NextResponse.json(report);
    }

    if (!identityId) {
      return NextResponse.json(
        { error: "IDENTITY ID OR CASE ID REQUIRED" },
        { status: 400 },
      );
    }

    const identity = getIdentityById(identityId);
    const report = createReport(identity);

    if (format === "json") {
      return new NextResponse(exportReportJSON(report), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${report.reportId}.json"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "REPORT GENERATION FAILED" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getIdentityById } from "@/lib/netra";

function removeVolatileFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeVolatileFields);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      if (key === "generatedAt") {
        continue;
      }

      result[key] = removeVolatileFields(child);
    }

    return result;
  }

  return value;
}

export async function GET() {
  const checks: Record<string, string> = {
    api: "ok",
    netra: "ok",
    deterministic: "ok",
  };

  try {
    const testId = "NETRA-INTEGRATION-CHECK";

    const first = getIdentityById(testId);
    const second = getIdentityById(testId);

    const normalizedFirst = removeVolatileFields(first);
    const normalizedSecond = removeVolatileFields(second);

    if (
      JSON.stringify(normalizedFirst) !==
      JSON.stringify(normalizedSecond)
    ) {
      checks.deterministic = "failed";
    }
  } catch {
    checks.netra = "failed";
    checks.deterministic = "failed";
  }

  const healthy = Object.values(checks).every(
    (value) => value === "ok"
  );

  return NextResponse.json(
    {
      service: "NETRA",
      status: healthy ? "operational" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
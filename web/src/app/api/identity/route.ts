import { NextResponse } from "next/server";
import { getIdentityById } from "@/lib/netra";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "IDENTITY ID REQUIRED" },
        { status: 400 },
      );
    }

    const identity = getIdentityById(id);

    return NextResponse.json(identity);
  } catch {
    return NextResponse.json(
      { error: "IDENTITY GENERATION FAILED" },
      { status: 500 },
    );
  }
}

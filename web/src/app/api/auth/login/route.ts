import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    const expectedUsername = process.env.NETRA_USERNAME;
    const expectedPassword = process.env.NETRA_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json(
        { error: "AUTHENTICATION SERVICE NOT CONFIGURED" },
        { status: 500 },
      );
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: "ACCESS DENIED // INVALID CREDENTIALS" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      authenticated: true,
    });

    response.cookies.set("netra_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "INVALID AUTHENTICATION REQUEST" },
      { status: 400 },
    );
  }
}

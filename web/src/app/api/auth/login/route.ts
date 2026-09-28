import { NextResponse } from "next/server";
import { COOKIE_NAME, createSession, SESSION_TTL_SECONDS } from "@/lib/auth";
import { recordAudit } from "@/lib/audit-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const expectedUsername = process.env.NETRA_USERNAME;
    const expectedPassword = process.env.NETRA_PASSWORD;

    if (!expectedUsername || !expectedPassword || !process.env.NETRA_SESSION_SECRET) {
      return NextResponse.json(
        { error: "AUTHENTICATION SERVICE NOT CONFIGURED" },
        { status: 500 },
      );
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      await recordAudit({
        action: "AUTHENTICATION FAILED",
        actor: username || "UNKNOWN",
        target: "LOGIN",
        status: "DENIED",
        source: "AUTH",
      });
      return NextResponse.json(
        { error: "ACCESS DENIED // INVALID CREDENTIALS" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(COOKIE_NAME, createSession(username), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    await recordAudit({
      action: "SESSION INITIALIZED",
      actor: username,
      target: "NETRA",
      status: "SUCCESS",
      source: "AUTH",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "INVALID AUTHENTICATION REQUEST" },
      { status: 400 },
    );
  }
}

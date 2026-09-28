import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "./lib/auth";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const session = verifySession(request.cookies.get(COOKIE_NAME)?.value);

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "AUTHENTICATION REQUIRED" },
      { status: 401 },
    );
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

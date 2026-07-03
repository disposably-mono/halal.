import NextAuth from "next-auth";
import type { Session } from "next-auth";
import { authConfig } from "@/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { VOTER_COOKIE, getSecret } from "@/lib/voter-session";
import { jwtVerify } from "jose";
import { can } from "@/lib/auth/permissions";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest & { auth: Session | null }) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Login page: redirect to /admin if already authenticated
  if (pathname === "/admin/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Protect /admin and its children without catching public routes such as /admin-help.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    // Account management is SUPERADMIN-only. The page guard is authoritative;
    // this is an early redirect so other roles never reach the screen.
    if (
      pathname.startsWith("/admin/accounts") &&
      !can(req.auth?.user?.role, "accounts:manage")
    ) {
      return NextResponse.redirect(
        new URL("/admin?denied=accounts:manage", req.url),
      );
    }
    return NextResponse.next();
  }

  // Voter ballot protection
  if (pathname.startsWith("/vote/ballot")) {
    const token = req.cookies.get(VOTER_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/vote", req.url));
    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/vote", req.url));
      response.cookies.delete(VOTER_COOKIE);
      return response;
    }
  }

  if (pathname === "/vote/confirmed") {
    const response = NextResponse.next();
    if (req.cookies.has(VOTER_COOKIE)) response.cookies.delete(VOTER_COOKIE);
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

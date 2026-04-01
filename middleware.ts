import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { VOTER_COOKIE } from "@/lib/voter-session";
import { jwtVerify } from "jose";

// Initialize a lightweight version of auth for the Edge
const { auth } = NextAuth(authConfig);

export default auth(async function middleware(
  req: NextRequest & { auth: any }
) {
  const { pathname } = req.nextUrl;

  // ── Voter protection ──
  if (pathname.startsWith("/vote/ballot") || pathname === "/vote/confirmed") {
    const token = req.cookies.get(VOTER_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/vote", req.url));

    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      await jwtVerify(token, secret);
    } catch {
      const response = NextResponse.redirect(new URL("/vote", req.url));
      response.cookies.delete(VOTER_COOKIE);
      return response;
    }
  }

  // ── Admin protection ──
  if (pathname.startsWith("/admin")) {
    const isLoggedIn = !!req.auth;
    const isLoginPage = pathname === "/admin/login";

    if (!isLoggedIn && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (isLoggedIn && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/vote/ballot", "/vote/confirmed"],
};

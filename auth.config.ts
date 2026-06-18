import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authConfig = {
  // Derive the callback host from each incoming request instead of a fixed
  // NEXTAUTH_URL, so auth works on localhost and tunneled hosts (e.g. ngrok).
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized() {
      return true; // Let middleware.ts handle all route protection
    },
    jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

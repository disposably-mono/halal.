import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Edge-safe base config: no Prisma/Node-only imports here, since this is
// consumed by anything running on the Edge runtime. The `jwt` callback (which
// needs Prisma for DB role revalidation — see lib/auth/token-refresh.ts) is
// defined in auth.ts, which spreads this config and overrides `callbacks.jwt`.
export const authConfig = {
  // Derive the callback host from each incoming request instead of a fixed
  // NEXTAUTH_URL, so auth works on localhost and tunneled hosts (e.g. ngrok).
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized() {
      return true; // Let proxy.ts handle all route protection
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        if (token.role) session.user.role = token.role;
        if (token.id) session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

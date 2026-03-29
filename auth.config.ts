import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isLoginPage) return true;
      if (isLoggedIn) return true;
      return false;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
};

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { checkAdminCredentials } from "@/lib/auth/admin-login";
import { refreshTokenRole } from "@/lib/auth/token-refresh";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";
import { prisma } from "@/lib/prisma";

const EIGHT_HOURS_SECONDS = 8 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Election-day admin sessions don't need NextAuth's 30-day default; capping
  // at 8 hours plus the periodic role revalidation below (see `jwt` callback)
  // bounds how long a deleted/demoted admin can keep using a stale session.
  session: { maxAge: EIGHT_HOURS_SECONDS },
  callbacks: {
    ...authConfig.callbacks,
    // Stamp role/id on initial sign-in; otherwise re-check the DB at most
    // once per ROLE_CHECK_INTERVAL_MS so a deleted/demoted admin's token is
    // invalidated/updated well before the 8h session expires. Delegates to
    // the pure, unit-tested refreshTokenRole helper (lib/auth/token-refresh.ts).
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.roleCheckedAt = Date.now();
        return token;
      }

      return refreshTokenRole(token, async (id) => {
        return prisma.adminUser.findUnique({
          where: { id },
          select: { id: true, role: true },
        });
      });
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.officerKey) {
          return null;
        }

        const email = credentials.email as string;

        // Throttle the real credential path per-IP so brute force can't bypass
        // the pre-check by hitting NextAuth's signIn endpoint directly.
        const ip = await clientIp();
        if (!rateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin).ok) {
          return null;
        }

        // `x-forwarded-for` is client-spoofable without a header-sanitizing
        // reverse proxy in front of the app (see lib/server/rate-limit.ts). Add
        // a per-account throttle keyed by normalized email as defense in depth,
        // so brute-forcing one admin's password/officer key is still capped
        // even when the attacker rotates IPs/headers per request.
        if (
          !rateLimit(`admin-login-email:${email.trim().toLowerCase()}`, RATE_LIMITS.adminLogin)
            .ok
        ) {
          return null;
        }

        let result: Awaited<ReturnType<typeof checkAdminCredentials>>;
        try {
          result = await checkAdminCredentials(
            email,
            credentials.password as string,
            credentials.officerKey as string,
          );
        } catch (error) {
          console.error("Admin sign-in credential check failed.", error);
          return null;
        }
        if (!result.ok || !result.verifier) return null;

        const loggedInAt = new Date();
        try {
          await prisma.$transaction([
            prisma.adminUser.update({
              where: { id: result.admin.id },
              data: { lastLogin: loggedInAt },
            }),
            prisma.adminLoginHistory.create({
              data: {
                officerId: result.admin.id,
                officerName: result.admin.name,
                officerEmail: result.admin.email,
                verifierId: result.verifier.id,
                verifierName: result.verifier.name,
                verifierEmail: result.verifier.email,
                createdAt: loggedInAt,
              },
            }),
          ]);
        } catch (error) {
          console.error("Admin sign-in history write failed.", error);
          return null;
        }

        return {
          id: result.admin.id,
          email: result.admin.email,
          name: result.admin.name,
          role: result.admin.role,
        };
      },
    }),
  ],
});

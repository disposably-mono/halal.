import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { checkAdminCredentials } from "@/lib/auth/admin-login";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.officerKey) {
          return null;
        }

        // Throttle the real credential path per-IP so brute force can't bypass
        // the pre-check by hitting NextAuth's signIn endpoint directly.
        const ip = await clientIp();
        if (!rateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin).ok) {
          return null;
        }

        let result: Awaited<ReturnType<typeof checkAdminCredentials>>;
        try {
          result = await checkAdminCredentials(
            credentials.email as string,
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

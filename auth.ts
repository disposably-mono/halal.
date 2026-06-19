import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { checkAdminCredentials } from "@/lib/auth/admin-login";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.officerKey) {
          return null;
        }

        const result = await checkAdminCredentials(
          credentials.email as string,
          credentials.password as string,
          credentials.officerKey as string,
        );
        if (!result.ok || !result.verifier) return null;

        const loggedInAt = new Date();
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

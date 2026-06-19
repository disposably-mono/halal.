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
        if (!result.ok) return null;

        await prisma.adminUser.update({
          where: { id: result.admin.id },
          data: { lastLogin: new Date() },
        });

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

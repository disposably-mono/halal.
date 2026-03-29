import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        officerKey: { label: "Officer Key", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.officerKey) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
        });

        if (!admin) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          admin.passwordHash
        );
        if (!passwordValid) return null;

        const keyValid = await bcrypt.compare(
          credentials.officerKey as string,
          admin.officerKey
        );
        if (!keyValid) return null;

        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
});

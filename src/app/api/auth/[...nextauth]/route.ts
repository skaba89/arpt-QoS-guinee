import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: {
              role: {
                include: { permissions: true },
              },
            },
          });

          if (!user || !user.isActive) {
            console.log("[AUTH] User not found or inactive:", credentials.email);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.log("[AUTH] Invalid password for:", credentials.email);
            return null;
          }

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          // Create audit log
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              resource: "system",
              details: JSON.stringify({ method: "credentials" }),
            },
          }).catch(() => {});

          console.log("[AUTH] Login successful:", credentials.email, "Role:", user.role.name);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name as string,
            organization: user.organization,
            permissions: user.role.permissions.map((p) => `${p.resource}:${p.action}`),
          };
        } catch (error) {
          console.error("[AUTH] Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as Record<string, unknown>).role;
        token.organization = (user as Record<string, unknown>).organization;
        token.permissions = (user as Record<string, unknown>).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).organization = token.organization;
        (session.user as Record<string, unknown>).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "onit-png-secret-key-2026-guinee",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

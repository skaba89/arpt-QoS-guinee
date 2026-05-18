import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Determine if we're in production (HTTPS) or development (HTTP)
const isProduction = process.env.NODE_ENV === "production";
const isSecureCookie = isProduction && process.env.NEXTAUTH_URL?.startsWith("https");

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
            // SECURITY: Don't log email addresses - information leakage
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            // Log failed attempt for security monitoring (without password)
            await db.auditLog.create({
              data: {
                userId: user.id,
                action: "LOGIN_FAILED",
                resource: "system",
                details: JSON.stringify({ method: "credentials" }),
              },
            }).catch(() => {});
            return null;
          }

          // Update last login (non-blocking)
          db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          // Create audit log (non-blocking)
          db.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              resource: "system",
              details: JSON.stringify({ method: "credentials" }),
            },
          }).catch(() => {});

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name as string,
            organization: user.organization ?? undefined,
            permissions: user.role.permissions.map((p) => `${p.resource}:${p.action}`),
          };
        } catch (error) {
          // SECURITY: Log error type only, not full details with credentials
          console.error("[AUTH] Authorization error");
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as unknown as Record<string, unknown>).role as string;
        token.organization = (user as unknown as Record<string, unknown>).organization as string | undefined;
        token.permissions = (user as unknown as Record<string, unknown>).permissions as string[];
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
  secret: process.env.NEXTAUTH_SECRET,
  // CRITICAL: NEXTAUTH_SECRET MUST be set in environment variables.
  // Do NOT add a fallback default value — that would allow JWT forgery.
  debug: false,
  // SECURITY: Use secure cookies only in production with HTTPS
  // In development (HTTP), secure cookies won't work
  useSecureCookies: isSecureCookie,
  cookies: {
    sessionToken: {
      name: isSecureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !!isSecureCookie,
      },
    },
    callbackUrl: {
      name: isSecureCookie ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: !!isSecureCookie,
      },
    },
    csrfToken: {
      name: isSecureCookie ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !!isSecureCookie,
      },
    },
    pkceCodeVerifier: {
      name: isSecureCookie ? "__Secure-next-auth.pkce.code_verifier" : "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !!isSecureCookie,
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Microsoft / Azure AD
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID || "common",
          }),
        ]
      : []),

    // Dev credentials provider (only active when no real OAuth configured)
    CredentialsProvider({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        // Dev mode: always succeed
        return {
          id: "demo-user",
          email: credentials?.email ?? "demo@example.com",
          name: "Demo User",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in, exchange with backend for API token
      if (account && user) {
        try {
          const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          let backendToken: string | null = null;

          if (account.provider === "google" && account.access_token) {
            const res = await fetch(`${apiUrl}/api/v1/auth/google/callback?code=${account.access_token}`, {
              method: "GET",
            });
            if (res.ok) {
              const data = await res.json();
              backendToken = data.access_token;
            }
          } else if (account.provider === "azure-ad" && account.access_token) {
            const res = await fetch(`${apiUrl}/api/v1/auth/microsoft/callback?code=${account.access_token}`, {
              method: "GET",
            });
            if (res.ok) {
              const data = await res.json();
              backendToken = data.access_token;
            }
          } else {
            // Dev credentials — get dev token
            const res = await fetch(`${apiUrl}/api/v1/auth/dev-token`);
            if (res.ok) {
              const data = await res.json();
              backendToken = data.access_token;
            }
          }

          if (backendToken) {
            token.apiToken = backendToken;
          }
        } catch {
          // If backend unavailable, continue without API token
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.apiToken = token.apiToken as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    apiToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
  }
}

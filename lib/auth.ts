import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import { verifyPassword } from "@/lib/security";
import type { UserDoc } from "@/models/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const db = await getDb();
        const user = await db
          .collection<UserDoc>(collections.users)
          .findOne({ email });

        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      (session as any).role = (token as any).role;
      (session.user as any).id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // allow same-origin absolute URLs
      if (url.startsWith(baseUrl)) return url;

      // block external redirects
      return baseUrl;
    },
  },

  pages: {
    signIn: "/signin",
  },
};

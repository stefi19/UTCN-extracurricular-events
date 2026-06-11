import { type GetServerSidePropsContext } from "next";
import { NextAuthOptions, getServerSession } from "next-auth";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GithubProvider from "next-auth/providers/github";
import { env } from "@/env/index.mjs";
import { getUtcSession } from "@/lib/utcn-auth";

const githubClientId = env.GITHUB_CLIENT_ID ?? env.GITHUB_ID ?? "";
const githubClientSecret = env.GITHUB_CLIENT_SECRET ?? env.GITHUB_SECRET ?? "";
const providers =
  githubClientId && githubClientSecret
    ? [
        GithubProvider({
          clientId: githubClientId,
          clientSecret: githubClientSecret,
          authorization: {
            params: {
              scope: "read:user user:email",
            },
          },
          profile(profile) {
            return {
              id: profile.id.toString(),
              name: profile.name || profile.login,
              username: profile.login,
              email: profile.email,
              image: profile.avatar_url,
            };
          },
        }),
      ]
    : [];

export const authOptions: NextAuthOptions = {
  // Callbacks:
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });
      if (!dbUser) {
        token.id = user?.id;
        token.role = "USER" as const; // Default role for new users
        return token;
      }
      return {
        id: dbUser.id,
        name: dbUser.name,
        username: dbUser.username,
        email: dbUser.email,
        image: dbUser.image,
        role: (dbUser as any).role || "USER", // Fallback to USER if role doesn't exist yet
      };
    },
  },
  // Providers:
  providers,
  // Pages:
  pages: {
    signIn: "/auth",
  },
  // Session:
  session: {
    strategy: "jwt",
  },
  // Database:
  adapter: PrismaAdapter(prisma),
};

export const getServerAuthSession = async (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  const nextAuthSession = await getServerSession(ctx.req, ctx.res, authOptions);
  if (nextAuthSession) return nextAuthSession;

  return getUtcSession(ctx.req);
};

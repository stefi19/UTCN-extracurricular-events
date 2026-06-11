import crypto from "crypto";
import type { IncomingMessage } from "http";
import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

type UtcRole = "STUDENT" | "ORGANIZER" | "ADMIN";

type UtcJwtPayload = {
  sub?: string;
  email?: string;
  role?: UtcRole;
  exp?: number;
};

const roleMap: Record<UtcRole, Role> = {
  STUDENT: "USER",
  ORGANIZER: "ORGANIZER",
  ADMIN: "ADMIN",
};

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseCookies(cookieHeader?: string) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function verifyUtcJwt(token: string): UtcJwtPayload | null {
  const secret = process.env.UTCN_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) return null;

  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as UtcJwtPayload;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  if (!payload.sub || !payload.email || !payload.role || !roleMap[payload.role]) return null;

  return payload;
}

export async function getUtcSession(req: IncomingMessage): Promise<Session | null> {
  const token = parseCookies(req.headers.cookie).auth_token;
  if (!token) return null;

  const payload = verifyUtcJwt(token);
  if (!payload?.email || !payload.sub || !payload.role) return null;

  const hackcontrolRole = roleMap[payload.role];
  const user = await prisma.user.upsert({
    where: { email: payload.email },
    update: {
      role: hackcontrolRole,
      access: true,
    },
    create: {
      email: payload.email,
      name: payload.email.split("@")[0],
      username: `utcn-${payload.sub}`,
      image: "/images/phck_logo.svg",
      role: hackcontrolRole,
      access: true,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name ?? payload.email.split("@")[0],
      username: user.username ?? undefined,
      email: user.email,
      image: user.image ?? "/images/phck_logo.svg",
      role: user.role,
    },
    expires: new Date((payload.exp ?? Math.floor(Date.now() / 1000) + 86400) * 1000).toISOString(),
  };
}

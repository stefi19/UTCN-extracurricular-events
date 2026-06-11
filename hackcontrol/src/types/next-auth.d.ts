import { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Role } from "@prisma/client";

type UserId = string;

declare module "next-auth" {
  interface Session {
    user: User & {
      id: UserId;
      username: string | undefined;
      role: Role;
    };
  }
}

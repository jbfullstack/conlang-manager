import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { Role } from '@/lib/permissions';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      permissions?: string[];
      username?: string;
      premiumUntil?: Date | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    permissions?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: Role;
    username?: string;
    premiumUntil?: Date | null;
  }
}

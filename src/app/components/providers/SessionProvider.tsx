// components/providers/SessionProvider.tsx - Wrapper pour dev et prod
'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider session={null}>{children}</NextAuthSessionProvider>;
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function setDevCookie(res: NextResponse, username: string) {
  res.cookies.set('x-dev-username', username, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    // NE METS PAS "domain" tant que tu n'en as pas besoin (sinon ça casse sur mobile/preview)
    // domain: process.env.COOKIE_DOMAIN || undefined,
  });
}

async function resolveUser(username: string) {
  if (!username) return null;
  return prisma.user.findUnique({ where: { username } });
}

export async function GET(req: Request) {
  // garde prod/dev
  if (process.env.NODE_ENV !== 'development' && process.env.USE_DEV_AUTH_IN_PROD !== 'true') {
    return new Response('not_found', { status: 404 });
  }

  const url = new URL(req.url);
  const username = url.searchParams.get('username') ?? '';
  const user = await resolveUser(username);
  if (!user) {
    return NextResponse.json({ error: 'not_found', username }, { status: 404 });
  }

  const res = NextResponse.json({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
  });
  setDevCookie(res, user.username);
  return res;
}

export async function POST(req: Request) {
  // même garde si tu veux limiter en prod sans flag
  if (process.env.NODE_ENV !== 'development' && process.env.USE_DEV_AUTH_IN_PROD !== 'true') {
    return new Response('not_found', { status: 404 });
  }

  const { username } = (await req.json()) as { username?: string };
  const user = await resolveUser(username || '');
  if (!user) {
    return NextResponse.json({ error: 'not_found', username }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, user: { username: user.username } });
  setDevCookie(res, user.username);
  return res;
}

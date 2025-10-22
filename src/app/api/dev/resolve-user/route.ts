import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development' && process.env.USE_DEV_AUTH_IN_PROD !== 'true') {
    return new Response('not_found', { status: 404 });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username') ?? '';
    if (!username) {
      return NextResponse.json({ error: 'username_required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: 'not_found', username }, { status: 404 });
    }

    // retourne les infos utiles au dev mode
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  } catch (e) {
    console.error('resolve-user error', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// temp solution for vquick vercel deploy -> user resolver discard
export async function POST(req: Request) {
  const { username } = await req.json(); // ou query param si tu préfères

  // … vérif DB: user existe, etc.

  const res = NextResponse.json({ ok: true, user: { username } });
  res.cookies.set('x-dev-username', username, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    // maxAge: 60 * 60 * 24 * 30, // 30 jours
    // utile si tu alternes sous-domaines : définis COOKIE_DOMAIN=madslang.vercel.app
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
  return res;
}

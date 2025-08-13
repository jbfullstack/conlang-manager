import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(req: Request) {
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

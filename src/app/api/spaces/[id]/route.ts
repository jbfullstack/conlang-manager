import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  // admin only
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const id = ctx.params.id;
  const desired = String(body?.status || '').toUpperCase();

  if (!['ACTIVE', 'REJECTED'].includes(desired)) {
    return NextResponse.json(
      { error: 'BAD_STATUS', allowed: ['ACTIVE', 'REJECTED'] },
      { status: 400 },
    );
  }

  // vérifie l'existence + (optionnel) l'état courant
  const space = await prisma.space.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!space) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // (optionnel) n'autoriser que depuis PENDING
  // if (space.status !== 'PENDING') {
  //   return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 409 });
  // }

  const updated = await prisma.space.update({
    where: { id },
    data: { status: desired as any },
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
  });

  return NextResponse.json(updated, { status: 200 });
}

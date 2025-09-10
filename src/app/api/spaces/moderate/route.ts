// src/app/api/spaces/moderate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function POST(req: NextRequest) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const id = String(body?.id || '');
  const desired = String(body?.status || '').toUpperCase();

  if (!id) {
    return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });
  }
  if (!['ACTIVE', 'REJECTED'].includes(desired)) {
    return NextResponse.json(
      { error: 'BAD_STATUS', allowed: ['ACTIVE', 'REJECTED'] },
      { status: 400 },
    );
  }

  const exists = await prisma.space.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!exists) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const updated = await prisma.space.update({
    where: { id },
    data: { status: desired as any },
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
  });

  return NextResponse.json(updated, { status: 200 });
}

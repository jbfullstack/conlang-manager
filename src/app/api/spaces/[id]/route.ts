// src/app/api/spaces/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function PATCH(req: NextRequest, context: any) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const id = (context?.params?.id ?? '') as string; // <-- no explicit type on arg, narrow here
  const desired = String((body as any)?.status || '').toUpperCase();

  if (desired !== 'ACTIVE' && desired !== 'REJECTED') {
    return NextResponse.json(
      { error: 'BAD_STATUS', allowed: ['ACTIVE', 'REJECTED'] },
      { status: 400 },
    );
  }

  const space = await prisma.space.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!space) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const updated = await prisma.space.update({
    where: { id },
    data: { status: desired as 'ACTIVE' | 'REJECTED' },
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
  });

  return NextResponse.json(updated, { status: 200 });
}

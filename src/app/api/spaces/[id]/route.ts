import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust if your path differs
import { requireAuthDev } from '@/lib/api-security-dev';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  // admin only
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const id = params.id;
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

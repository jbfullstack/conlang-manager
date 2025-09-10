import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== 'ADMIN')
    return NextResponse.json(
      { error: "FORBIDDEN - Vous n'êtes pas admin dis donc !" },
      { status: 403 },
    );

  // Await the params Promise
  const { id } = await context.params;
  const space = await prisma.space.update({ where: { id }, data: { status: 'ACTIVE' } });
  return NextResponse.json({ space });
}

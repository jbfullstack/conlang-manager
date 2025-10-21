import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // n’active en prod que si flag explicite
  if (process.env.NODE_ENV !== 'development' && process.env.USE_DEV_AUTH_IN_PROD !== 'true') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // limite pour éviter d’envoyer toute la DB en prod
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true },
    take: 50,
    orderBy: { createdAt: 'desc' }, // adapte si pas de createdAt
  });

  return NextResponse.json({ users });
}

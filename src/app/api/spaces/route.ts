import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthDev } from '@/lib/api-security-dev';

export async function GET(req: NextRequest) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  const mine = new URL(req.url).searchParams.get('mine') === '1';
  if (mine) {
    // espaces où je suis membre
    const memberships = await prisma.spaceMember.findMany({
      where: {
        userId: auth.user.id,
        isActive: true,
        space: { status: { in: ['ACTIVE', 'PENDING'] } },
      },
      include: { space: true },
    });
    return NextResponse.json({ spaces: memberships.map((m) => m.space), memberships });
  }

  // admin only
  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const spaces = await prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ spaces });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthDev(req);
  if (auth instanceof NextResponse) return auth;

  const { name, description } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'NAME_REQUIRED' }, { status: 400 });

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const existing = await prisma.space.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existing) return NextResponse.json({ error: 'SPACE_EXISTS' }, { status: 409 });

  // création sous statut PENDING (validation admin)
  const space = await prisma.space.create({
    data: { name, slug, description, status: 'PENDING', createdBy: auth.user.id },
  });

  // créateur devient OWNER (inactif tant que PENDING ? on le laisse actif)
  await prisma.spaceMember.create({
    data: { spaceId: space.id, userId: auth.user.id, role: 'OWNER', isActive: true },
  });

  return NextResponse.json({ space }, { status: 201 });
}

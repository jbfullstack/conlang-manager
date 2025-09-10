import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSpaceMembership } from '@/lib/space-security';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireSpaceMembership(req, ['OWNER', 'MODERATOR', 'MADROLE', 'MEMBER']);
  if (r instanceof Response) return r as any;

  // Await the params Promise
  const { id } = await context.params;

  const members = await prisma.spaceMember.findMany({
    where: { spaceId: id },
    include: { user: { select: { id: true, username: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireSpaceMembership(req, ['OWNER', 'MODERATOR', 'MADROLE']);
  if (r instanceof Response) return r as any;

  // Await the params Promise
  const { id } = await context.params;
  const { userId, role } = await req.json();

  const created = await prisma.spaceMember.upsert({
    where: { spaceId_userId: { spaceId: id, userId } },
    create: { spaceId: id, userId, role: role ?? 'MEMBER', isActive: true },
    update: { role: role ?? 'MEMBER', isActive: true },
  });
  return NextResponse.json({ member: created }, { status: 201 });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireSpaceMembership(req, ['OWNER', 'MODERATOR', 'MADROLE']);
  if (r instanceof Response) return r as any;

  // Await the params Promise
  const { id } = await context.params;
  const { userId, role, isActive } = await req.json();

  const updated = await prisma.spaceMember.update({
    where: { spaceId_userId: { spaceId: id, userId } },
    data: { role, isActive },
  });
  return NextResponse.json({ member: updated });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireSpaceMembership(req, ['OWNER']);
  if (r instanceof Response) return r as any;

  // Await the params Promise
  const { id } = await context.params;
  const { userId } = await req.json();

  await prisma.spaceMember.delete({ where: { spaceId_userId: { spaceId: id, userId } } });
  return NextResponse.json({ ok: true });
}

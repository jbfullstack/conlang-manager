import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  id: string;
}

export async function GET(request: NextRequest, context: { params: RouteParams }) {
  try {
    const { id } = context.params;
    const combination = await prisma.combination.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } }
      }
    });

    if (!combination) {
      return NextResponse.json({ error: 'Combinaison introuvable' }, { status: 404 });
    }

    return NextResponse.json({ combination: { ...combination, pattern: JSON.parse(combination.pattern) } });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: RouteParams }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { pattern, sens, description, statut } = body;

    const combination = await prisma.combination.update({
      where: { id },
      data: {
        pattern: pattern ? JSON.stringify(pattern) : undefined,
        sens,
        description,
        statut,
        version: { increment: 1 }
      },
      include: { user: { select: { username: true } } }
    });

    return NextResponse.json({ combination: { ...combination, pattern: JSON.parse(combination.pattern) } });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: RouteParams }) {
  try {
    const { id } = context.params;
    await prisma.combination.delete({ where: { id } });
    return NextResponse.json({ message: 'Combinaison supprimée' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
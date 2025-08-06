import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const combination = await prisma.combination.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { username: true }
        },
        votes: {
          include: {
            user: {
              select: { username: true }
            }
          }
        }
      }
    });

    if (!combination) {
      return NextResponse.json(
        { error: 'Combinaison introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      combination: {
        ...combination,
        pattern: JSON.parse(combination.pattern)
      }
    });
  } catch (error) {
    console.error('Erreur GET combination:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { pattern, sens, description, statut } = body;

    const combination = await prisma.combination.update({
      where: { id: params.id },
      data: {
        pattern: pattern ? JSON.stringify(pattern) : undefined,
        sens,
        description,
        statut,
        version: { increment: 1 }
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({
      combination: {
        ...combination,
        pattern: JSON.parse(combination.pattern)
      }
    });
  } catch (error) {
    console.error('Erreur PUT combination:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await prisma.combination.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Combinaison supprimée' });
  } catch (error) {
    console.error('Erreur DELETE combination:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

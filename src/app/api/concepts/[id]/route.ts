import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const concept = await prisma.concept.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      concept: {
        ...concept,
        proprietes: JSON.parse(concept.proprietes || '[]'),
        exemples: JSON.parse(concept.exemples || '[]')
      }
    });
  } catch (error) {
    console.error('Erreur GET concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { mot, definition, type, proprietes, etymologie, exemples } = body;

    const concept = await prisma.concept.update({
      where: { id: params.id },
      data: {
        mot,
        definition,
        type,
        proprietes: JSON.stringify(proprietes || []),
        etymologie,
        exemples: JSON.stringify(exemples || []),
        version: { increment: 1 }
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({
      concept: {
        ...concept,
        proprietes: JSON.parse(concept.proprietes || '[]'),
        exemples: JSON.parse(concept.exemples || '[]')
      }
    });
  } catch (error) {
    console.error('Erreur PUT concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Soft delete
    await prisma.concept.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Concept supprimé' });
  } catch (error) {
    console.error('Erreur DELETE concept:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
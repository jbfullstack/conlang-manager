import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

function patternHash(pattern: string[]) {
  return crypto.createHash('sha256').update(JSON.stringify(pattern)).digest('hex');
}

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ← FIX: await params
    const combination = await prisma.combination.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } },
        votes: { include: { user: { select: { username: true } } } }
      }
    });
    
    if (!combination) {
      return NextResponse.json({ error: 'Combinaison introuvable' }, { status: 404 });
    }
    
    return NextResponse.json({
      combination: { ...combination, pattern: JSON.parse(combination.pattern) }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    // Champs éditables côté UI (adapte si tu veux ouvrir plus)
    const {
      sens,
      description,
      statut,
      examples,       // string[] | undefined
      pattern,        // string[] | undefined (si tu veux autoriser l'édition du pattern)
    } = body ?? {};

    const data: any = {
      sens,
      description,
      statut,
      updatedAt: new Date(),
    };

    if (examples) data.examples = JSON.stringify(examples);

    if (Array.isArray(pattern) && pattern.length >= 2) {
      data.pattern = JSON.stringify(pattern);
      data.patternHash = patternHash(pattern);
      // Si tu veux empêcher collision en édition :
      const existing = await prisma.combination.findFirst({
        where: { patternHash: data.patternHash, NOT: { id } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'COMPOSITION_EXISTS', existing },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.combination.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e: any) {
    console.error('PUT /api/compositions/[id] error', e);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ← FIX: await params
    await prisma.combination.delete({ where: { id } });
    return NextResponse.json({ message: 'Combinaison supprimée' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
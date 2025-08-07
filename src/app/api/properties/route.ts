import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');

    let where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    // JUSTE les propriétés, pas les concepts !
    const properties = await prisma.property.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ],
      take: limit
    });

    // Aussi récupérer les catégories uniques pour le frontend
    const categories = await prisma.property.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    const uniqueCategories = categories
      .map(p => p.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ 
      properties,
      categories: uniqueCategories
    });
  } catch (error) {
    console.error('Erreur GET properties:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
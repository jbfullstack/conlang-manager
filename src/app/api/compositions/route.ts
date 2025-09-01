// src/app/api/compositions/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs' // for crypto

function patternHash(pattern: string[]) {
  return crypto.createHash('sha256').update(JSON.stringify(pattern)).digest('hex')
}

// --- POST /api/compositions ---
export async function POST(req: Request) {
  try {
    const { pattern, sens, description, statut, source, confidenceScore } = await req.json()

    const hash = patternHash(pattern)

    const existing = await prisma.combination.findFirst({
      where: { patternHash: hash },
    })
    if (existing) {
      return NextResponse.json({ error: 'COMPOSITION_EXISTS', existing }, { status: 409 })
    }

    const combination = await prisma.combination.create({
      data: {
        pattern: JSON.stringify(pattern),
        patternHash: hash,
        sens,
        description,
        statut,
        source,
        confidenceScore,
      },
    })

    return NextResponse.json(combination, { status: 201 })
  } catch (error) {
    console.error('Erreur sauvegarde combination:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
}

// --- GET /api/compositions ---
export async function GET(_req: Request) {
  try {
    const compositions = await prisma.combination.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        pattern: true,
        sens: true,
        description: true,
        statut: true,
        source: true,
        confidenceScore: true,
        createdAt: true,
        createdBy: true,
      },
    })

    const formatted = compositions.map((c: { pattern: unknown }) => ({
      ...c,
      pattern: JSON.parse(c.pattern as unknown as string),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('❌ Error fetching compositions:', error)
    return NextResponse.json({ error: 'Failed to fetch compositions' }, { status: 500 })
  }
}

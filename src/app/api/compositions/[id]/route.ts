// src/app/api/compositions/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type RouteCtx = { params: { id: string } }

function patternHash(pattern: string[]) {
  return crypto.createHash('sha256').update(JSON.stringify(pattern)).digest('hex')
}

// --- GET ---
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params
    const combination = await prisma.combination.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } },
        votes: { include: { user: { select: { username: true } } } },
      },
    })

    if (!combination) {
      return NextResponse.json({ error: 'Combinaison introuvable' }, { status: 404 })
    }

    let pattern: string[] = []
    try {
      pattern = JSON.parse(combination.pattern ?? '[]')
    } catch {
      pattern = []
    }

    let examples: string[] | undefined
    if (typeof (combination as any).examples === 'string') {
      try {
        examples = JSON.parse((combination as any).examples || '[]')
      } catch {
        examples = []
      }
    } else {
      examples = (combination as any).examples
    }

    return NextResponse.json({
      combination: { ...combination, pattern, examples },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// --- PUT ---
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params
    const body = await req.json()
    const { sens, description, statut, examples, pattern } = body ?? {}

    const data: any = { sens, description, statut, updatedAt: new Date() }
    if (examples) data.examples = JSON.stringify(examples)

    if (Array.isArray(pattern) && pattern.length >= 2) {
      data.pattern = JSON.stringify(pattern)
      data.patternHash = patternHash(pattern)

      const existing = await prisma.combination.findFirst({
        where: { patternHash: data.patternHash, NOT: { id } },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ error: 'COMPOSITION_EXISTS', existing }, { status: 409 })
      }
    }

    const updated = await prisma.combination.update({ where: { id }, data })
    return NextResponse.json(updated, { status: 200 })
  } catch (e) {
    console.error('PUT /api/compositions/[id] error', e)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// --- DELETE ---
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params
    await prisma.combination.delete({ where: { id } })
    return NextResponse.json({ message: 'Combinaison supprimée' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

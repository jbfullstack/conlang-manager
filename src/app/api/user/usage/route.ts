// src/app/api/user/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function ensureUserExists(userId: string) {
  // toujours un username unique dérivé de l'id => évite P2002
  const safeUsername = `user_${userId}`.slice(0, 30);
  const safeEmail = `${userId}@dev.local`;

  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      username: safeUsername,
      email: safeEmail,
      passwordHash: 'dev',
      role: 'USER',
      isActive: true,
    },
  });
}


export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    await ensureUserExists(userId); // ← important

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let dailyUsage = await prisma.dailyUsage.findFirst({
      where: { userId, date: { gte: startOfDay, lt: endOfDay } },
    });

    if (!dailyUsage) {
      // Compter les vraies compositions du jour pour initialiser correctement
      const realCompositionsToday = await prisma.combination.count({
        where: { createdBy: userId, createdAt: { gte: startOfDay, lt: endOfDay } },
      });

      dailyUsage = await prisma.dailyUsage.create({
        data: {
          userId,
          date: startOfDay,
          compositionsCreated: realCompositionsToday,
          aiSearchRequests: 0,
          aiAnalyzeRequests: 0,
          conceptsCreated: 0,
          estimatedCostUsd: 0,
        },
      });
    }

    return NextResponse.json({
      compositionsCreated: dailyUsage.compositionsCreated,
      aiSearchRequests: dailyUsage.aiSearchRequests,
      aiAnalyzeRequests: dailyUsage.aiAnalyzeRequests,
      conceptsCreated: dailyUsage.conceptsCreated,
      estimatedCostUsd: dailyUsage.estimatedCostUsd,
    });
  } catch (error) {
    console.error('❌ Erreur API GET user/usage:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    await ensureUserExists(userId); // ← important

    const { increment } = await request.json();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const existing = await prisma.dailyUsage.findFirst({
      where: { userId, date: { gte: startOfDay, lt: endOfDay } },
    });

    let dailyUsage;
    if (existing) {
      const data: any = {};
      if (increment === 'compositions') data.compositionsCreated = existing.compositionsCreated + 1;
      else if (increment === 'aiSearch') data.aiSearchRequests = existing.aiSearchRequests + 1;
      else if (increment === 'aiAnalyze') data.aiAnalyzeRequests = existing.aiAnalyzeRequests + 1;
      else if (increment === 'concepts') data.conceptsCreated = existing.conceptsCreated + 1;

      dailyUsage = await prisma.dailyUsage.update({ where: { id: existing.id }, data });
    } else {
      dailyUsage = await prisma.dailyUsage.create({
        data: {
          userId,
          date: startOfDay,
          compositionsCreated: increment === 'compositions' ? 1 : 0,
          aiSearchRequests:    increment === 'aiSearch'      ? 1 : 0,
          aiAnalyzeRequests:   increment === 'aiAnalyze'     ? 1 : 0,
          conceptsCreated:     increment === 'concepts'      ? 1 : 0,
          estimatedCostUsd: 0,
        },
      });
    }

    return NextResponse.json({
      compositionsCreated: dailyUsage.compositionsCreated,
      aiSearchRequests: dailyUsage.aiSearchRequests,
      aiAnalyzeRequests: dailyUsage.aiAnalyzeRequests,
      conceptsCreated: dailyUsage.conceptsCreated,
      estimatedCostUsd: dailyUsage.estimatedCostUsd,
    });
  } catch (error) {
    console.error('❌ Erreur API POST user/usage:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

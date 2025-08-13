// app/api/user/usage/route.ts - Correction minimale
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }
    
    console.log('🔍 GET /api/user/usage - userId:', userId);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('🔍 Date range:', { startOfDay, endOfDay });
    
    let dailyUsage = await prisma.dailyUsage.findFirst({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    console.log('🔍 Found dailyUsage:', dailyUsage);
    
    // Si pas d'entrée pour aujourd'hui, en créer une
    if (!dailyUsage) {
      console.log('🆕 Creating new dailyUsage entry...');
      
      // AJOUT MINIMAL : Compter les vraies compositions créées aujourd'hui
      const realCompositionsToday = await prisma.combination.count({
        where: {
          createdBy: userId,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
      
      console.log('🔢 Real compositions found today:', realCompositionsToday);
      
      dailyUsage = await prisma.dailyUsage.create({
        data: {
          userId: userId,
          date: startOfDay,
          compositionsCreated: realCompositionsToday, // ← CHANGEMENT : Pas 0, mais le vrai count
          aiSearchRequests: 0,
          aiAnalyzeRequests: 0,
          conceptsCreated: 0,
          estimatedCostUsd: 0,
        }
      });
      console.log('✅ Created dailyUsage:', dailyUsage);
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
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// POST reste exactement pareil que votre version
export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }
    
    const { increment } = await request.json();
    
    console.log('🚀 POST /api/user/usage - userId:', userId, 'increment:', increment);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('🚀 Date range:', { startOfDay, endOfDay });
    
    const existing = await prisma.dailyUsage.findFirst({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    console.log('🚀 Existing entry:', existing);
    
    let dailyUsage;
    
    if (existing) {
      // Update existant
      console.log('🔄 Updating existing entry...');
      const updateData: any = {};
      
      if (increment === 'compositions') {
        updateData.compositionsCreated = existing.compositionsCreated + 1;
      } else if (increment === 'aiSearch') {
        updateData.aiSearchRequests = existing.aiSearchRequests + 1;
      } else if (increment === 'aiAnalyze') {
        updateData.aiAnalyzeRequests = existing.aiAnalyzeRequests + 1;
      } else if (increment === 'concepts') {
        updateData.conceptsCreated = existing.conceptsCreated + 1;
      }
      
      console.log('🔄 Update data:', updateData);
      
      dailyUsage = await prisma.dailyUsage.update({
        where: { id: existing.id },
        data: updateData
      });
      
    } else {
      // Créer nouveau
      console.log('🆕 Creating new entry with increment...');
      dailyUsage = await prisma.dailyUsage.create({
        data: {
          userId: userId,
          date: startOfDay,
          compositionsCreated: increment === 'compositions' ? 1 : 0,
          aiSearchRequests: increment === 'aiSearch' ? 1 : 0,
          aiAnalyzeRequests: increment === 'aiAnalyze' ? 1 : 0,
          conceptsCreated: increment === 'concepts' ? 1 : 0,
          estimatedCostUsd: 0,
        }
      });
    }
    
    console.log('✅ Final dailyUsage:', dailyUsage);

    return NextResponse.json(dailyUsage);
    
  } catch (error) {
    console.error('❌ Erreur API POST user/usage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}
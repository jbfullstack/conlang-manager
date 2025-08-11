// app/api/user/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { getTodayUsage } from '@/lib/usage-tracking';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const usage = await getTodayUsage(authResult.user.id);
    
    return NextResponse.json({
      ...usage,
      date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      user: {
        id: authResult.user.id,
        role: authResult.user.role,
      }
    });
    
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch usage data',
      code: 'USAGE_FETCH_ERROR' 
    }, { status: 500 });
  }
}
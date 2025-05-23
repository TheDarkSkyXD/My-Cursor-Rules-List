import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Log Runtime
console.log('[/api/test-prisma] Runtime:', process.env.NEXT_RUNTIME);

// Log available models
console.log('[/api/test-prisma] Available Prisma models:', 
  Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')).join(', ')
);

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log("[GET /api/test-prisma] Received request.");
  
  let results: any = {};
  let errorMsg: string | null = null;

  try {
    // Test cats model access
    console.log('[GET /api/test-prisma] Testing cats model access');
    const catResult = await prisma.cats.findFirst({
      select: { id: true, name: true }
    });
    results.cats = catResult;
    console.log('[GET /api/test-prisma] cats.findFirst result:', catResult);
    
    // Test meals model access
    console.log('[GET /api/test-prisma] Testing meals model access');
    const mealResult = await prisma.feeding_logs.findFirst({
      select: { id: true, meal_type: true }
    });
    results.meals = mealResult;
    console.log('[GET /api/test-prisma] meals.findFirst result:', mealResult);
    
    // Test households model access
    console.log('[GET /api/test-prisma] Testing households model access');
    const householdResult = await prisma.households.findFirst({
      select: { id: true, name: true }
    });
    results.households = householdResult;
    console.log('[GET /api/test-prisma] households.findFirst result:', householdResult);

  } catch (error: any) {
    console.error('[GET /api/test-prisma] Error during Prisma queries:', error);
    errorMsg = error instanceof Error ? error.message : 'Unknown error during query.';
  }

  if (errorMsg) {
    return NextResponse.json({ status: 'error', error: errorMsg }, { status: 500 });
  } else {
    return NextResponse.json({ 
      status: 'success', 
      data: results,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'))
    });
  }
} 
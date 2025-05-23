import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
// Add top-level logging
console.log(`[API /households/.../cats] Module loaded. typeof prisma: ${typeof prisma}. Keys:`, prisma ? Object.keys(prisma) : 'prisma is null/undefined');
console.log(`[API /households/.../cats] DATABASE_URL set: ${!!process.env.DATABASE_URL}`); // Check if DB URL env var exists

// No longer need Supabase client here if relying on Prisma
// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers';
import { BaseCats } from "@/lib/types/common";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/monitoring/logger";

// Explicitly set runtime to Node.js
export const runtime = 'nodejs';

// console.log("Checking imported Prisma client:", typeof prisma, prisma ? Object.keys(prisma) : 'prisma is null/undefined'); // Keep if needed for debug

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Zod schema for POST request body
const PostBodySchema = z.object({
  name: z.string().trim().min(1),
  photoUrl: z.string().url().nullable().optional(),
  birthdate: z.string().datetime().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  restrictions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  feedingInterval: z.number().int().min(1).max(24).optional(),
  portion_size: z.number().positive().optional(), // Added portion_size
}).strict();

// GET /api/households/[id]/cats - Listar gatos de um domicílio
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Properly await params for Next.js dynamic API routes
  const params = await Promise.resolve(context.params);
  const householdId = params.id;
  const requestId = request.headers.get("x-request-id") || "unknown";

  logger.info("[GET /api/households/[id]/cats] Starting request", {
    requestId,
    householdId,
  });

  if (!householdId) {
    logger.warn("[GET /api/households/[id]/cats] Missing household ID", { requestId });
    return NextResponse.json(
      { error: "Household ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get the authenticated user ID from headers (set by middleware)
    const authUserId = request.headers.get('X-User-ID');
    if (!authUserId) {
      logger.warn("[GET /api/households/[id]/cats] No auth user ID in headers", { requestId });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user has access to this household using Prisma
    const membership = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: householdId
      }
    });

    if (!membership) {
      logger.warn("[GET /api/households/[id]/cats] User not authorized for household", {
        requestId,
        userId: authUserId,
        householdId,
      });
      return NextResponse.json(
        { error: "Not authorized to access this household" },
        { status: 403 }
      );
    }

    // Fetch cats for the household using Prisma
    const cats = await prisma.cats.findMany({
      where: {
        household_id: householdId
      },
      select: {
        id: true,
        name: true,
        photo_url: true,
        birth_date: true,
        weight: true,
        household_id: true,
        owner_id: true,
        portion_size: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the response to handle Decimal fields
    const transformedCats = cats.map(cat => ({
      ...cat,
      weight: cat.weight ? cat.weight.toNumber() : null
    }));

    logger.info("[GET /api/households/[id]/cats] Successfully fetched cats", {
      requestId,
      count: cats.length,
    });

    return NextResponse.json({ data: transformedCats });
  } catch (error) {
    logger.error("[GET /api/households/[id]/cats] Unexpected error", {
      requestId,
      error,
    });
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        return NextResponse.json(
          { error: "Database connection error", details: error.message },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/households/[id]/cats - Adicionar gato ao domicílio
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Explicitly await params from context
  const params = await context.params;
  console.log(`[POST /api/households/.../cats] Received params:`, JSON.stringify(params)); // Log raw params

  const householdId = params?.id;

  // Simplified validation
  if (!householdId || typeof householdId !== 'string' || householdId.length === 0) {
      console.error(`[POST /api/households/.../cats] Invalid or missing householdId in params:`, householdId);
      return NextResponse.json({ error: "ID do domicílio inválido ou ausente" }, { status: 400 });
  }
   console.log(`[POST /api/households/${householdId}/cats] Using householdId: ${householdId}`);

  // Auth is assumed to be handled by middleware if this route is protected
  console.log(`[POST /api/households/${householdId}/cats] User assumed authenticated by middleware.`);

  try {
    // Log prisma object before use
    console.log(`[POST /api/households/${householdId}/cats] Checking prisma object before create:`, typeof prisma, prisma ? Object.keys(prisma) : 'prisma is null/undefined');
    // RE-ENABLE Prisma check
    
    // Add specific log right before the check
    console.log(`[POST /api/households/${householdId}/cats] Re-checking typeof prisma.cats just before check: ${typeof prisma?.cats}`);
    
    if (!prisma || typeof prisma.cats?.create !== 'function') { // Use prisma.cats
        console.error(`[POST /api/households/${householdId}/cats] Prisma client or prisma.cats.create is not available. Prisma type: ${typeof prisma}, prisma.cats type: ${typeof prisma?.cats}`); // Use prisma.cats
        throw new Error('Prisma client or model method is not available for creating cats.');
    }

    const body = await request.json();
    const bodyValidation = PostBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      console.error(`[POST /api/households/${householdId}/cats] Invalid body:`, bodyValidation.error.errors);
      return NextResponse.json(
        { error: 'Dados inválidos', details: bodyValidation.error.errors },
        { status: 400 }
      );
    }

    const data = bodyValidation.data;
    console.log(`[POST /api/households/${householdId}/cats] Creating cat with data:`, data);

    // Get the authenticated user ID from headers
    const authUserId = request.headers.get('X-User-ID');
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const cat = await prisma.cats.create({
      data: {
        name: data.name,
        photo_url: data.photoUrl ?? null,
        birth_date: data.birthdate ? new Date(data.birthdate) : null,
        weight: data.weight ?? null,
        household_id: householdId,
        owner_id: authUserId,
        restrictions: data.restrictions ?? null,
        notes: data.notes ?? null,
        feeding_interval: data.feedingInterval ?? null,
        portion_size: data.portion_size ?? null
      }
    });
    console.log(`[POST /api/households/${householdId}/cats] Cat created successfully with ID: ${cat.id}`);

    // Format output to match BaseCats
    const formattedCat: BaseCats = {
      id: cat.id,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      name: cat.name,
      photo_url: cat.photo_url,
      birth_date: cat.birth_date,
      weight: cat.weight?.toNumber() ?? null,
      household_id: cat.household_id,
      owner_id: cat.owner_id,
      restrictions: cat.restrictions,
      notes: cat.notes,
      feeding_interval: cat.feeding_interval,
      portion_size: cat.portion_size ?? null
    };

    return NextResponse.json(formattedCat, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/households/${householdId}/cats] Error creating cat:`, error);
    // Add more specific error handling if needed
    if (error instanceof Error && error.message.includes('connect')) {
        return NextResponse.json({ error: 'Database connection error' }, { status: 503 });
    }
    if ((error as any).code === 'P2002') {
        return NextResponse.json({ error: 'Erro: Conflito ao criar gato (ex: nome duplicado?)' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro ao criar o gato' },
      { status: 500 }
    );
  }
} 
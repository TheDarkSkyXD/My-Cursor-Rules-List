import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/monitoring/logger'; // Import the logger

// Log Runtime
logger.debug('[/api/cats] Runtime:', { runtime: process.env.NEXT_RUNTIME });

// GET /api/cats - Listar todos os gatos (filtragem opcional por householdId)
export async function GET(request: NextRequest) {
  // Remove header dump log
  /*
  // --- Add Log for Received Headers ---
  console.log(`[GET /api/cats] Received Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}`);
  // --- End Log for Received Headers ---
  */

  // Read user ID from request header
  const authUserId = request.headers.get('X-User-ID');
  if (!authUserId) {
    // Use logger.warn for auth failures
    logger.warn('[GET /api/cats] Authorization Error: Missing X-User-ID header.', { url: request.nextUrl.toString() });
    return NextResponse.json({ error: 'Não autorizado - Cabeçalho de usuário ausente' }, { status: 401 });
  }
  logger.debug(`[GET /api/cats] Authenticated User ID from header: ${authUserId}`);

  try {
    // Get user's households for authorization using profiles model (which works with shared client)
    const userProfile = await prisma.profiles.findUnique({
        where: { id: authUserId },
        select: { household_members: { select: { household_id: true } } }
    });

    if (!userProfile) {
        // Use logger.error for unexpected data inconsistencies
        logger.error(`[GET /api/cats] Prisma profile not found for auth user ID: ${authUserId}`);
        // Return 404 or 403 depending on desired behavior
        return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    const userHouseholdIds = userProfile.household_members.map(m => m.household_id);
    if (userHouseholdIds.length === 0) {
        logger.info(`[GET /api/cats] User ${authUserId} belongs to no households. Returning empty.`);
        return NextResponse.json([]); // Return empty array if user has no households
    }
    logger.debug(`[GET /api/cats] User ${authUserId} authorized for households:`, { householdIds: userHouseholdIds });

    const searchParams = request.nextUrl.searchParams;
    const requestedHouseholdId = searchParams.get('householdId');

    let targetHouseholdIds: string[];

    if (requestedHouseholdId) {
      // If a specific household is requested, check authorization
      if (!userHouseholdIds.includes(requestedHouseholdId)) {
        logger.warn(`[GET /api/cats] User ${authUserId} not authorized for requested household ${requestedHouseholdId}`);
        return NextResponse.json({ error: 'Não autorizado para este domicílio' }, { status: 403 });
      }
      targetHouseholdIds = [requestedHouseholdId];
      logger.debug(`[GET /api/cats] Filtering by requested household: ${requestedHouseholdId}`);
    } else {
      // If no specific household is requested, fetch for all user's households
      targetHouseholdIds = userHouseholdIds;
      logger.debug(`[GET /api/cats] Fetching for all authorized households.`);
    }

    // Define where clause based on authorized households
    const where = { 
      household_id: { 
        in: targetHouseholdIds 
      } 
    };

    logger.debug(`[GET /api/cats] Querying cats with where clause:`, { where: JSON.stringify(where) });
    
    // Use direct access to the cats model as it exists in the schema
    const cats = await prisma.cats.findMany({
      where,
      select: {
        id: true,
        name: true,
        photo_url: true,
        birth_date: true,
        weight: true,
        household_id: true,
        owner_id: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(cats);
  } catch (error: any) {
    // Log the actual error object using logger.logError
    logger.logError(error, { message: 'Erro ao buscar gatos', requestUrl: request.nextUrl.toString() });
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os gatos' },
      { status: 500 }
    );
  }
}

// POST /api/cats - Criar um novo perfil de gato
export async function POST(request: NextRequest) {
  const authUserId = request.headers.get('X-User-ID');
  if (!authUserId) {
    logger.warn('[POST /api/cats] Authorization Error: Missing X-User-ID header.', { url: request.nextUrl.toString() });
    return NextResponse.json({ error: 'Não autorizado - Cabeçalho de usuário ausente' }, { status: 401 });
  }
  logger.debug(`[POST /api/cats] Authenticated User ID from header: ${authUserId}`);

  try {
    const body = await request.json();
    logger.debug('[POST /api/cats] Received request body:', body);

    // Validate required fields
    if (!body.name || !body.householdId) {
      logger.warn('[POST /api/cats] Missing required fields:', { body });
      return NextResponse.json(
        { error: 'Nome e ID do domicílio são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate feeding interval (if provided)
    let feedingInterval = null;
    if (body.feeding_interval) {
      const hours = parseInt(String(body.feeding_interval));
      if (isNaN(hours) || hours < 1 || hours > 24) {
        logger.warn('[POST /api/cats] Invalid feeding interval:', body.feeding_interval);
        return NextResponse.json(
          { error: 'Intervalo de alimentação deve ser entre 1 e 24 horas' },
          { status: 400 }
        );
      }
      feedingInterval = hours;
    }

    // Check if the user is a member of the target household
    const householdMember = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: body.householdId
      },
      select: { user_id: true }
    });

    if (!householdMember) {
      logger.warn(`[POST /api/cats] User ${authUserId} not authorized for household ${body.householdId}`);
      return NextResponse.json(
        { error: 'Usuário não autorizado para este domicílio' },
        { status: 403 }
      );
    }

    // Create the cat using Prisma's create method
    const newCat = await prisma.cats.create({
      data: {
        name: body.name.trim(),
        photo_url: body.photoUrl || null,
        birth_date: body.birthdate ? new Date(body.birthdate) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        household_id: body.householdId,
        owner_id: authUserId,
        restrictions: body.restrictions?.trim() || null,
        notes: body.notes?.trim() || null,
        feeding_interval: feedingInterval,
        portion_size: body.portion_size || null
      }
    });

    // If weight was provided, create an initial weight log
    if (newCat && body.weight && !isNaN(parseFloat(body.weight))) {
      try {
        await prisma.cat_weight_logs.create({
          data: {
            cat_id: newCat.id,
            weight: parseFloat(body.weight),
            date: new Date(), // Use current date for the initial log
            measured_by: authUserId, // Associate with the user creating the cat
          }
        });
        logger.debug(`[POST /api/cats] Initial weight log created for cat ${newCat.id}`);
      } catch (logError: any) {
        // Log the error but don't fail the cat creation, as logging weight is secondary
        logger.error(`[POST /api/cats] Failed to create initial weight log for cat ${newCat.id}:`, {
          error: logError,
          message: logError.message,
          stack: logError.stack,
        });
      }
    }

    logger.debug(`[POST /api/cats] Cat created successfully:`, newCat);
    return NextResponse.json(newCat, { status: 201 });
  } catch (error: any) {
    logger.error('[POST /api/cats] Error creating cat:', {
      error: error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    if (error.code === '22P02') {
      return NextResponse.json(
        { error: 'Formato inválido para um ou mais campos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Erro ao criar o perfil do gato: ${error.message}` },
      { status: 500 }
    );
  }
} 
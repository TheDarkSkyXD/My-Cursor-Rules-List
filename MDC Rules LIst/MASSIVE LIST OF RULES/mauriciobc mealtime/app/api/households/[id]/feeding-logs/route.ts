import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies } from 'next/headers'; // Import cookies
import { BaseFeedingLog } from '@/lib/types/common';
import { z } from 'zod'; // Import Zod for validation

// Zod schema for route parameters
const RouteParamsSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)), { message: "ID do domicílio inválido" }),
});

// Reusable authorization helper (can be moved to a shared util if used elsewhere)
async function authorizeUser(supabaseUser: any, householdId: number): Promise<{ authorized: boolean; error?: NextResponse }> {
  if (!supabaseUser) {
    return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  try {
    const prismaUser = await prisma.user.findUnique({
      where: { auth_id: supabaseUser.id },
      select: { householdId: true },
    });

    if (!prismaUser) {
      return { authorized: false, error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
    }

    if (prismaUser.householdId !== householdId) {
      return { authorized: false, error: NextResponse.json({ error: 'Você não tem permissão para acessar este domicílio' }, { status: 403 }) };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Authorization error:', error);
    return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor durante autorização' }, { status: 500 }) };
  }
}

// Remove CORS headers if middleware handles CORS
// const corsHeaders = {
//   'Content-Type': 'application/json',
//   'Access-Control-Allow-Origin': '*', // Adjust for production
//   'Access-Control-Allow-Methods': 'GET, OPTIONS', // Only GET and OPTIONS needed here
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// };

// Remove OPTIONS handler if middleware handles CORS
// export async function OPTIONS() {
//   return NextResponse.json({}, { headers: corsHeaders });
// }

export async function GET(
  request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } } // Destructure params directly
) {
  // Validate route parameters
  const paramsValidation = RouteParamsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
  }
  const householdId = parseInt(paramsValidation.data.id);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Authorize user
  const authResult = await authorizeUser(supabaseUser, householdId);
  if (!authResult.authorized) {
    // Add CORS headers back if not handled by middleware
    // return new NextResponse(authResult.error!.body, { status: authResult.error!.status, headers: { ...authResult.error!.headers, ...corsHeaders } });
    return authResult.error!;
  }

  // No need to fetch household again, authorization check confirmed it exists and user belongs to it

  try {
    // Fetch feeding logs for the authorized household
    const logs = await prisma.feedingLog.findMany({
      where: {
        cat: {
          householdId: householdId
        }
      },
      include: {
        cat: true, // Include cat details
        user: true // Include user details (optional, consider privacy)
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Convert to BaseFeedingLog format (ensure BaseFeedingLog matches Prisma model or adjust)
    const formattedLogs: BaseFeedingLog[] = logs.map(log => ({
      id: log.id,
      catId: log.catId,
      userId: log.userId,
      timestamp: log.timestamp,
      // Adjust these based on your actual BaseFeedingLog definition and Prisma schema
      quantity: log.quantity || undefined, // Example: Assuming quantity exists
      notes: log.notes || undefined,
      createdAt: log.createdAt,
      // status: log.status || undefined // Example if status exists
      // Remove fields not in BaseFeedingLog or add them if they are
    }));

    console.log('Logs encontrados:', formattedLogs.length);
    // Add CORS headers back if not handled by middleware
    // return NextResponse.json(formattedLogs, { headers: corsHeaders });
    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Erro ao buscar logs de alimentação:', error);
    // Add CORS headers back if not handled by middleware
    // return NextResponse.json({ error: 'Erro ao buscar logs de alimentação' }, { status: 500, headers: corsHeaders });
    return NextResponse.json({ error: 'Erro ao buscar logs de alimentação' }, { status: 500 });
  }
} 
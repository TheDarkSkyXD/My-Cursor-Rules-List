import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';  // Update import to use named import
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies, headers } from 'next/headers'; // Import cookies and headers
import { z } from 'zod'; // Import Zod

// Zod schema for route parameters
const RouteParamsSchema = z.object({
  id: z.string().uuid({ message: "ID do domicílio inválido (UUID esperado)" }),
});

// Zod schema for PATCH request body
const PatchBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  // inviteCode: z.string().min(6).optional(), // Remove invite code updates for now
}).strict(); // Only allow name

// --- Authorization Helpers ---

// Authorizes if the user is a member of the household (using string ID)
async function authorizeMember(supabaseUser: any, householdId: string): Promise<{ authorized: boolean; prismaUserId?: string; error?: NextResponse }> {
  if (!supabaseUser) {
    return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  
  try {
    // Log Prisma initialization state
    console.log('[authorizeMember] Prisma state:', !!prisma, 'User:', supabaseUser.id);
    
    const prismaUser = await prisma.profiles.findUnique({ 
      where: { id: supabaseUser.id }, 
      select: { 
        id: true, 
        household_members: {
          where: { household_id: householdId },
          select: { household_id: true }
        }
      } 
    });
    
    if (!prismaUser) {
      return { authorized: false, error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
    }
    
    // Check if user is a member of the household
    const isMember = prismaUser.household_members.length > 0;
    if (!isMember) {
      return { authorized: false, error: NextResponse.json({ error: 'Você não tem permissão para acessar este domicílio' }, { status: 403 }) };
    }
    
    return { authorized: true, prismaUserId: prismaUser.id };
  } catch (error) { 
    console.error('Member Auth Error:', error);
    return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 }) };
  }
}

// Authorizes if the user is an admin of the household (using string ID)
async function authorizeAdmin(supabaseUser: any, householdId: string): Promise<{ authorized: boolean; prismaUserId?: string; error?: NextResponse }> {
  if (!supabaseUser) return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  try {
    const prismaUser = await prisma.profiles.findUnique({ 
      where: { id: supabaseUser.id }, 
      select: { 
        id: true, 
        household_members: {
          where: { household_id: householdId },
          select: { role: true }
        }
      } 
    });
    
    if (!prismaUser) return { authorized: false, error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
    
    const membership = prismaUser.household_members[0];
    if (!membership) return { authorized: false, error: NextResponse.json({ error: 'Você não pertence a este domicílio' }, { status: 403 }) };
    if (membership.role !== 'admin') return { authorized: false, error: NextResponse.json({ error: 'Apenas administradores podem executar esta ação.' }, { status: 403 }) };
    
    return { authorized: true, prismaUserId: prismaUser.id }; // Return string ID
  } catch (error) { 
     console.error('Admin Auth Error:', error);
     return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 }) };
  }
}

// Remove CORS headers and OPTIONS handler assuming middleware handles it
// const corsHeaders = { ... };
// export async function OPTIONS() { ... }

// GET /api/households/[id] - Obter um domicílio específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is properly awaited
    const resolvedParams = await Promise.resolve({
      id: await Promise.resolve(params).then(p => p.id)
    });

    // Validate params
    const paramsValidation = RouteParamsSchema.safeParse(resolvedParams);
    if (!paramsValidation.success) {
      console.error('[GET /api/households/[id]] Param validation error:', paramsValidation.error.errors);
      return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
    }
    const householdId = paramsValidation.data.id;

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      console.error('[GET /api/households/[id]] Auth error:', authError?.message);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log('[GET /api/households/[id]] Authorizing user:', supabaseUser.id, 'for household:', householdId);
    
    // Authorize: Must be a member
    const authResult = await authorizeMember(supabaseUser, householdId);
    if (!authResult.authorized) {
      console.error('[GET /api/households/[id]] Authorization failed:', authResult.error?.status);
      return authResult.error!;
    }

    console.log('[GET /api/households/[id]] Authorization successful, fetching household data');
    
    // Get the household with its members and owner
    const household = await prisma.households.findUnique({
      where: { id: householdId },
      include: {
        household_members: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        },
        cats: {
          select: {
            id: true
          }
        }
      }
    });

    if (!household) {
      return NextResponse.json({ error: "Domicílio não encontrado" }, { status: 404 });
    }

    // Find the owner (admin member)
    const ownerMember = household.household_members.find(member => member.role?.toLowerCase() === 'admin');
    const ownerUser = ownerMember?.user;

    // Format the response to match the Household interface from lib/types.ts
    const formattedHousehold = {
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code || '',
      members: household.household_members.map(member => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.full_name,
        email: member.user.email,
        role: member.role as 'Admin' | 'Member',
        joinedAt: member.created_at
      })),
      cats: household.cats.map(cat => cat.id),
      catGroups: [], // Not implemented yet
      createdAt: household.created_at,
      owner: ownerUser ? {
        id: ownerUser.id,
        name: ownerUser.full_name,
        email: ownerUser.email
      } : undefined
    };

    return NextResponse.json(formattedHousehold);
  } catch (error) {
    console.error('[GET /api/households/[id]] Error:', error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PATCH /api/households/[id] - Atualizar um domicílio
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is not a promise before validation
    const resolvedParams = {
      id: params.id
    };

    // Validate params
    const paramsValidation = RouteParamsSchema.safeParse(resolvedParams);
    if (!paramsValidation.success) return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
    const householdId = paramsValidation.data.id;

    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      console.error('[PATCH /api/households/[id]] Auth error:', authError?.message);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Authorize: Only admins can update
    const authResult = await authorizeAdmin(supabaseUser, householdId);
    if (!authResult.authorized) return authResult.error!;

    const body = await request.json();
    const bodyValidation = PatchBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json({ error: bodyValidation.error.errors }, { status: 400 });
    }

    // Ensure there's data to update
    if (Object.keys(bodyValidation.data).length === 0) {
        return NextResponse.json({ message: "Nenhum dado fornecido para atualização." }, { status: 400 });
    }

    // Update the household
    const updatedHousehold = await prisma.households.update({
      where: { id: householdId },
      data: bodyValidation.data,
      include: {
        household_members: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        },
        cats: {
          select: {
            id: true,
            name: true,
            birth_date: true,
            weight: true
          }
        }
      }
    });

    // Format the response
    const formattedHousehold = {
      id: updatedHousehold.id,
      name: updatedHousehold.name,
      members: updatedHousehold.household_members.map(member => ({
        id: member.user.id,
        name: member.user.full_name,
        email: member.user.email,
        role: member.role,
        isCurrentUser: member.user.id === authResult.prismaUserId
      })),
      cats: updatedHousehold.cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        birthDate: cat.birth_date,
        weight: cat.weight
      }))
    };

    return NextResponse.json(formattedHousehold);

  } catch (error) {
    console.error('Error updating household:', error);
    return NextResponse.json({ error: 'Erro ao atualizar domicílio' }, { status: 500 });
  }
}

// DELETE /api/households/[id] - Excluir um domicílio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure params is not a promise before validation
  const resolvedParams = {
    id: params.id
  };

  // Validate params
  const paramsValidation = RouteParamsSchema.safeParse(resolvedParams);
  if (!paramsValidation.success) return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
  const householdId = paramsValidation.data.id;

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Authorize: Only admins can delete
  // Note: Consider adding an owner check or preventing deletion if members exist?
  const authResult = await authorizeAdmin(supabaseUser, householdId);
  if (!authResult.authorized) return authResult.error!;

  try {
    // Add checks here if needed (e.g., prevent deletion if not empty)
    const householdData = await prisma.households.findUnique({
        where: { id: householdId },
        include: { _count: { select: { household_members: true, cats: true } } }
    });

    if (!householdData) {
        return NextResponse.json({ error: 'Domicílio não encontrado' }, { status: 404 });
    }

    // Example Check: Prevent deletion if members (other than admin) or cats exist
    // if (householdData._count.users > 1 || householdData._count.cats > 0) {
    //     return NextResponse.json({ error: 'Não é possível excluir um domicílio com membros ou gatos.' }, { status: 400 });
    // }

    // Perform the deletion
    // Transaction might be needed if related records need complex cleanup
    await prisma.$transaction(async (tx) => {
        // 1. Dissociate users (set householdId to null or handle differently)
        await tx.profiles.updateMany({
            where: { household_members: { some: { household_id: householdId } } },
            data: { household_members: { set: [] } }
        });
        // 2. Delete cats (or handle orphaned cats)
        await tx.cats.deleteMany({
            where: { household_id: householdId }
        });
        // 3. Delete household
        await tx.households.delete({ where: { id: householdId } });
    });

    return NextResponse.json({ message: 'Domicílio excluído com sucesso' }, { status: 200 }); // 200 OK or 204 No Content

  } catch (error) {
    console.error('Erro ao deletar household (DELETE):', error);
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: 'Domicílio não encontrado para exclusão.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro ao excluir o domicílio' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies } from 'next/headers'; // Import cookies
import { z } from 'zod'; // Import Zod

// Zod schema for route parameters
const RouteParamsSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)), { message: "ID do domicílio inválido" }),
  userId: z.string().refine(val => !isNaN(parseInt(val)), { message: "ID do usuário inválido" }),
});

// Zod schema for PATCH request body
const PatchBodySchema = z.object({
  role: z.enum(['admin', 'member'], { message: 'Papel inválido. Deve ser "admin" ou "member"' }),
}).strict();

// --- Authorization Helpers ---

// Checks if the requesting user is an admin of the specified household
async function authorizeAdminAction(supabaseUser: any, householdId: number): Promise<{ authorized: boolean; prismaUserId?: number; error?: NextResponse }> {
  if (!supabaseUser) {
    return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  try {
    const prismaUser = await prisma.user.findUnique({ where: { auth_id: supabaseUser.id }, select: { id: true, householdId: true, role: true } });
    if (!prismaUser) return { authorized: false, error: NextResponse.json({ error: 'Usuário solicitante não encontrado' }, { status: 404 }) };
    if (prismaUser.householdId !== householdId) return { authorized: false, error: NextResponse.json({ error: 'Usuário solicitante não pertence a este domicílio' }, { status: 403 }) };
    if (prismaUser.role !== 'admin') return { authorized: false, error: NextResponse.json({ error: 'Apenas administradores podem executar esta ação.' }, { status: 403 }) };
    return { authorized: true, prismaUserId: prismaUser.id };
  } catch (error) { /* ... error handling ... */
    console.error('Admin Action Auth Error:', error);
    return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 }) };
  }
}

// Checks if the requesting user is either an admin OR the target user themselves
async function authorizeAdminOrSelfAction(supabaseUser: any, householdId: number, targetPrismaUserId: number): Promise<{ authorized: boolean; isSelf: boolean; error?: NextResponse }> {
    if (!supabaseUser) {
        return { authorized: false, isSelf: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
    }
    try {
        const requestingPrismaUser = await prisma.user.findUnique({ where: { auth_id: supabaseUser.id }, select: { id: true, householdId: true, role: true } });
        if (!requestingPrismaUser) return { authorized: false, isSelf: false, error: NextResponse.json({ error: 'Usuário solicitante não encontrado' }, { status: 404 }) };
        if (requestingPrismaUser.householdId !== householdId) return { authorized: false, isSelf: false, error: NextResponse.json({ error: 'Usuário solicitante não pertence a este domicílio' }, { status: 403 }) };

        const isSelfAction = requestingPrismaUser.id === targetPrismaUserId;
        const isAdminAction = requestingPrismaUser.role === 'admin';

        if (isAdminAction || isSelfAction) {
            return { authorized: true, isSelf: isSelfAction };
        }

        return { authorized: false, isSelf: false, error: NextResponse.json({ error: 'Permissão negada. Apenas administradores ou o próprio usuário podem executar esta ação.' }, { status: 403 }) };

    } catch (error) { /* ... error handling ... */
        console.error('Admin/Self Action Auth Error:', error);
        return { authorized: false, isSelf: false, error: NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 }) };
    }
}

// --- Route Handlers ---

// PATCH /api/households/[id]/members/[userId] - Atualizar papel de um membro
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  // Validate route parameters
  const paramsValidation = RouteParamsSchema.safeParse(params);
  if (!paramsValidation.success) return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
  const householdId = parseInt(paramsValidation.data.id);
  const targetUserId = parseInt(paramsValidation.data.userId);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Authorize: Only admins can change roles
  const authResult = await authorizeAdminAction(supabaseUser, householdId);
  if (!authResult.authorized) return authResult.error!;

  try {
    const body = await request.json();
    const bodyValidation = PatchBodySchema.safeParse(body);
    if (!bodyValidation.success) return NextResponse.json({ error: bodyValidation.error.errors }, { status: 400 });
    const { role: newRole } = bodyValidation.data;

    // Fetch the member being updated to check current role and admin count
    const memberToUpdate = await prisma.user.findUnique({ where: { id: targetUserId, householdId: householdId } });

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Usuário não encontrado neste domicílio' }, { status: 404 });
    }

    // Prevent removing the last admin
    if (memberToUpdate.role === 'admin' && newRole !== 'admin') {
      const adminCount = await prisma.user.count({ where: { householdId: householdId, role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Não é possível remover o último administrador do domicílio' }, { status: 400 });
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId }, // Already confirmed they are in the correct household
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true } // Select data for response
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Erro ao atualizar papel do membro (PATCH):', error);
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Usuário não encontrado para atualização.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro ao atualizar o papel do membro' }, { status: 500 });
  }
}

// DELETE /api/households/[id]/members/[userId] - Remover membro do domicílio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  // Validate route parameters
  const paramsValidation = RouteParamsSchema.safeParse(params);
  if (!paramsValidation.success) return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
  const householdId = parseInt(paramsValidation.data.id);
  const targetUserId = parseInt(paramsValidation.data.userId);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Authorize: Admin can remove anyone, member can only remove self
  const authResult = await authorizeAdminOrSelfAction(supabaseUser, householdId, targetUserId);
  if (!authResult.authorized) return authResult.error!;

  try {
    // Fetch the member being removed to check their role (needed for last admin check)
    const memberToRemove = await prisma.user.findUnique({ where: { id: targetUserId, householdId: householdId } });

    if (!memberToRemove) {
      // Should be caught by authorizeAdminOrSelfAction, but double check
      return NextResponse.json({ error: 'Usuário não encontrado neste domicílio para remoção.' }, { status: 404 });
    }

    // Prevent removing the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { householdId: householdId, role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Não é possível remover o último administrador do domicílio' }, { status: 400 });
      }
    }

    // Remove user from household by setting householdId to null and resetting role
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        householdId: null,
        role: 'user' // Reset role to default
      }
    });

    return NextResponse.json({ message: 'Membro removido com sucesso' }, { status: 200 });

  } catch (error) {
    console.error('Erro ao remover membro (DELETE):', error);
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Usuário não encontrado para remoção.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro ao remover o membro' }, { status: 500 });
  }
} 
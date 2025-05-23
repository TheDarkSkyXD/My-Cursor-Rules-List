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
});

// Zod schema for POST request body
const PostBodySchema = z.object({
  // Assuming you invite/add by email now, not by existing userId
  email: z.string().email("Email inválido"),
  role: z.enum(['admin', 'member'], { message: 'Papel inválido. Deve ser "admin" ou "member"' }),
}).strict();

// Helper function for authorization & role check
async function authorizeAdmin(supabaseUser: any, householdId: number): Promise<{ authorized: boolean; prismaUserId?: number; error?: NextResponse }> {
  if (!supabaseUser) {
    return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  try {
    const prismaUser = await prisma.user.findUnique({
      where: { auth_id: supabaseUser.id },
      select: { id: true, householdId: true, role: true },
    });

    if (!prismaUser) {
      return { authorized: false, error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
    }

    if (prismaUser.householdId !== householdId) {
      return { authorized: false, error: NextResponse.json({ error: 'Você não pertence a este domicílio' }, { status: 403 }) };
    }

    if (prismaUser.role !== 'admin') {
        return { authorized: false, error: NextResponse.json({ error: 'Apenas administradores podem gerenciar membros.' }, { status: 403 }) };
    }

    return { authorized: true, prismaUserId: prismaUser.id };
  } catch (error) {
    console.error('Admin Authorization error:', error);
    return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor durante autorização' }, { status: 500 }) };
  }
}

// Helper function for basic household membership authorization
async function authorizeMember(supabaseUser: any, householdId: number): Promise<{ authorized: boolean; prismaUserId?: number; error?: NextResponse }> {
  if (!supabaseUser) {
    return { authorized: false, error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  try {
    const prismaUser = await prisma.user.findUnique({
      where: { auth_id: supabaseUser.id },
      select: { id: true, householdId: true },
    });

    if (!prismaUser) {
      return { authorized: false, error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
    }

    if (prismaUser.householdId !== householdId) {
      return { authorized: false, error: NextResponse.json({ error: 'Você não tem permissão para acessar este domicílio' }, { status: 403 }) };
    }

    return { authorized: true, prismaUserId: prismaUser.id };
  } catch (error) {
    console.error('Member Authorization error:', error);
    return { authorized: false, error: NextResponse.json({ error: 'Erro interno do servidor durante autorização' }, { status: 500 }) };
  }
}


// GET /api/households/[id]/members - Listar membros de um domicílio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

  // Authorize: Any member of the household can view the member list
  const authResult = await authorizeMember(supabaseUser, householdId);
  if (!authResult.authorized) {
    return authResult.error!;
  }

  try {
    // Fetch members of the authorized household
    const membersData = await prisma.user.findMany({
        where: { householdId: householdId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    // Formatar os dados para a resposta, adding isCurrentUser flag
    const members = membersData.map(user => ({
      id: user.id, // Use number or string as needed
      name: user.name,
      email: user.email, // Consider masking for non-admins if needed
      role: user.role,
      isCurrentUser: user.id === authResult.prismaUserId // Check against the authorized user's Prisma ID
    }));

    return NextResponse.json(members);

  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os membros' },
      { status: 500 }
    );
  }
}

// POST /api/households/[id]/members - Adicionar membro ao domicílio (by email)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

  // Authorize: Only admins can add members
  const authResult = await authorizeAdmin(supabaseUser, householdId);
  if (!authResult.authorized) {
    return authResult.error!;
  }

  try {
    const body = await request.json();
    const bodyValidation = PostBodySchema.safeParse(body);

    if (!bodyValidation.success) {
        return NextResponse.json({ error: bodyValidation.error.errors }, { status: 400 });
    }

    const { email: emailToAdd, role: roleToAdd } = bodyValidation.data;

    // Find the user to add by email
    const userToAdd = await prisma.user.findUnique({
        where: { email: emailToAdd },
        select: { id: true, householdId: true }
    });

    if (!userToAdd) {
        // If inviting non-existent users is allowed, handle sending an invite here.
        // For now, assume user must exist.
        return NextResponse.json({ error: 'Usuário com este email não encontrado.' }, { status: 404 });
    }

    // Check if the user is already in THIS household
    if (userToAdd.householdId === householdId) {
        return NextResponse.json({ error: 'Este usuário já pertence a este domicílio.' }, { status: 400 });
    }

    // Check if the user is already in ANOTHER household
    if (userToAdd.householdId) {
        return NextResponse.json({ error: 'Este usuário já pertence a outro domicílio.' }, { status: 400 });
    }

    // Add user to the household by updating their record
    const updatedUser = await prisma.user.update({
      where: { id: userToAdd.id },
      data: {
        householdId: householdId,
        role: roleToAdd
      },
      select: { // Select fields needed for the response
          id: true,
          name: true,
          email: true,
          role: true
      }
    });

    // Formatar os dados para a resposta
    const member = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    };

    return NextResponse.json(member, { status: 201 }); // 201 Created might be more appropriate

  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    // Handle specific Prisma errors if needed
    if ((error as any).code === 'P2002') {
        return NextResponse.json({ error: 'Erro de conflito ao adicionar membro.' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro ao adicionar o membro' },
      { status: 500 }
    );
  }
}

// DELETE /api/households/[id]/members/[userId] - Remove or leave household
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  // Validate route parameters
  const paramsValidation = RouteParamsSchema.safeParse({ id: params.id });
  if (!paramsValidation.success) {
    return NextResponse.json({ error: paramsValidation.error.errors }, { status: 400 });
  }
  const householdId = parseInt(paramsValidation.data.id);
  const userIdToRemove = params.userId;

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Only allow self-leave or admin removal
  let isAdmin = false;
  let isSelf = false;
  let removingUserName = '';
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { auth_id: supabaseUser.id },
      select: { id: true, householdId: true, role: true, name: true },
    });
    if (!prismaUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    isAdmin = prismaUser.role === 'admin';
    isSelf = prismaUser.id === userIdToRemove;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Apenas administradores podem remover outros membros.' }, { status: 403 });
    }
    // Get the name of the user being removed
    const userToRemove = await prisma.user.findUnique({ where: { id: userIdToRemove }, select: { name: true } });
    removingUserName = userToRemove?.name || 'Um usuário';
  } catch (error) {
    return NextResponse.json({ error: 'Erro de autorização' }, { status: 500 });
  }

  // Remove user from household
  try {
    await prisma.user.update({
      where: { id: userIdToRemove },
      data: { householdId: null, role: 'member' },
    });
    // Fetch remaining members
    const remainingMembers = await prisma.user.findMany({
      where: { householdId: householdId },
      select: { id: true },
    });
    // Fetch household name
    const household = await prisma.household.findUnique({ where: { id: householdId }, select: { name: true } });
    // Notify remaining members
    const notifications = remainingMembers.map(member => ({
      id: crypto.randomUUID(),
      user_id: member.id,
      title: 'Membro saiu da residência',
      message: `${removingUserName} saiu da residência ${household?.name || ''}`,
      type: 'household',
      metadata: {
        householdId: householdId,
        actionUrl: `/households/${householdId}`
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies } from 'next/headers'; // Import cookies
// import { getToken } from 'next-auth/jwt'; // Remove next-auth jwt
import { z } from 'zod'; // Import Zod for validation

// Zod schema for request body
const JoinBodySchema = z.object({
  inviteCode: z.string().min(1, "Código de convite é obrigatório"),
}).strict();

// POST /api/households/join - Entrar em um domicílio usando um código de convite
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !supabaseUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bodyValidation = JoinBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json({ error: bodyValidation.error.errors }, { status: 400 });
    }

    const { inviteCode } = bodyValidation.data;

    // Buscar o domicílio pelo código de convite
    const household = await prisma.households.findUnique({
      where: { inviteCode: inviteCode },
      include: {
        household_members: {
          select: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                username: true,
                avatar_url: true
              }
            },
            role: true
          }
        },
        cats: true
      }
    });

    if (!household) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 404 });
    }

    // Fetch the corresponding Prisma user using the Supabase user ID (auth_id)
    const prismaUser = await prisma.profiles.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        household_members: {
          select: {
            household_id: true
          }
        }
      }
    });

    if (!prismaUser) {
      // This case should ideally not happen if the auth trigger works, but handle it defensively.
      return NextResponse.json({ error: 'Usuário não encontrado no banco de dados local.' }, { status: 404 });
    }

    // Check if user is already associated with this household (via household_members)
    const userHouseholdIds = prismaUser.household_members.map(m => m.household_id);
    if (userHouseholdIds.includes(household.id)) {
      return NextResponse.json({ error: 'Você já pertence a este domicílio' }, { status: 400 });
    }

    // Check if user is already associated with *another* household
    if (userHouseholdIds.length > 0) {
      return NextResponse.json({ error: 'Você já pertence a outro domicílio. Saia do domicílio atual antes de entrar em um novo.' }, { status: 400 });
    }

    // Adicionar usuário ao domicílio como membro (create a new household_members record)
    await prisma.household_members.create({
      data: {
        user_id: prismaUser.id,
        household_id: household.id,
        role: 'member' // Novos usuários sempre entram como membros
      }
    });

    // Buscar o domicílio atualizado com todos os membros para a resposta
    const updatedHousehold = await prisma.households.findUnique({
      where: { id: household.id },
      include: {
        household_members: {
          select: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                username: true,
                avatar_url: true
              }
            },
            role: true
          }
        },
        cats: true // Include cats if needed in the response
      }
    });

    if (!updatedHousehold) {
      // This is unlikely if the update succeeded, but handle defensively
      return NextResponse.json({ error: 'Erro ao buscar domicílio atualizado após entrada' }, { status: 500 });
    }

    // --- Notification logic: Notify all other members ---
    try {
      const members = updatedHousehold.household_members.map(m => ({ ...m.user, role: m.role }));
      const joiningUser = members.find(u => u.id === prismaUser.id);
      const otherMembers = members.filter(u => u.id !== prismaUser.id);
      const notifications = otherMembers.map(member => ({
        id: crypto.randomUUID(),
        user_id: member.id,
        title: 'Novo membro na residência',
        message: `${joiningUser?.full_name || 'Um usuário'} entrou na residência ${updatedHousehold.name}`,
        type: 'household',
        metadata: {
          householdId: updatedHousehold.id,
          actionUrl: `/households/${updatedHousehold.id}`
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      if (notifications.length > 0) {
        await prisma.notifications.createMany({ data: notifications });
        console.log(`[household join] Created ${notifications.length} notifications for new member`);
      }
    } catch (notifyError) {
      console.error('[household join] Failed to create notifications:', notifyError);
    }
    // --- End notification logic ---

    // Formatar a resposta (adjust based on frontend needs)
    const formattedHousehold = {
      id: updatedHousehold.id,
      name: updatedHousehold.name,
      inviteCode: updatedHousehold.inviteCode, // Might want to omit this from general responses
      members: updatedHousehold.household_members.map(m => ({
        id: m.user.id,
        full_name: m.user.full_name,
        email: m.user.email, // Consider privacy implications
        username: m.user.username,
        avatar_url: m.user.avatar_url,
        role: m.role
      })),
      cats: updatedHousehold.cats // Include cats data
    };

    // No need to manually update JWT token; state should be refreshed on client-side
    // based on context updates or page reload after action.

    // Return the details of the household joined
    return NextResponse.json(formattedHousehold);

  } catch (error) {
    console.error('Erro ao entrar no domicílio:', error);
    // Handle potential Prisma errors (e.g., unique constraints if invite codes weren't unique)
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Erro de conflito ao processar a solicitação.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro ao entrar no domicílio' }, { status: 500 });
  }
} 
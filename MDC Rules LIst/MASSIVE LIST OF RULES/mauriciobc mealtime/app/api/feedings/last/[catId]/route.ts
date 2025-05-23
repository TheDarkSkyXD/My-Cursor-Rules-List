import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server'; // Import Supabase client
import { cookies } from 'next/headers'; // Import cookies

export async function GET(
  request: Request,
  { params }: { params: { catId: string } }
) {
  // const session = await getServerSession(authOptions);
  const supabase = await createClient(); // Create Supabase client
  const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(); // Get Supabase user

  // if (!session?.user?.id) {
  if (authError || !supabaseUser) { // Check Supabase user
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const catId = params.catId;

  if (!catId) {
    return NextResponse.json({ error: 'ID do gato inválido' }, { status: 400 });
  }

  try {
    // Find the user's household via household_members
    const householdMember = await prisma.household_members.findFirst({
      where: { user_id: supabaseUser.id },
      select: { household_id: true }
    });

    if (!householdMember?.household_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma residência' }, { status: 403 });
    }

    // Verify the cat belongs to the user's household
    const cat = await prisma.cats.findUnique({
      where: {
        id: catId,
        household_id: householdMember.household_id
      },
      select: { id: true }
    });

    if (!cat) {
      // Cat doesn't exist or doesn't belong to the user's household
      return NextResponse.json({ error: 'Gato não encontrado ou acesso não autorizado' }, { status: 404 });
    }

    // Find the last feeding log for this cat
    const lastFeeding = await prisma.feeding_logs.findFirst({
      where: {
        cat_id: catId,
      },
      orderBy: {
        fed_at: 'desc',
      },
    });

    if (!lastFeeding) {
      return NextResponse.json(null, { status: 200 }); // Return null if no feeding log exists for this cat
    }

    return NextResponse.json(lastFeeding);
  } catch (error) {
    console.error(`Erro ao buscar último registro de alimentação para o gato ${catId}:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
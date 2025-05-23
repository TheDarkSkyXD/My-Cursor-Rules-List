import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma'; // Assuming UserRepository uses prisma indirectly or we need it here
import { UserRepository } from '@/lib/repositories';
import { BaseUser, ID } from '@/lib/types/common';

// GET /api/users/[id] - Obter informações de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !supabaseUser) {
      console.error('GET /api/users/[id] Auth Error:', authError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const requestedUserId = parseInt(params.id, 10);
    if (isNaN(requestedUserId)) {
       return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }
    
    // Fetch the Prisma User corresponding to the authenticated Supabase user
    const authenticatedPrismaUser = await prisma.user.findUnique({
        where: { auth_id: supabaseUser.id }, // Assumes unique constraint on auth_id
        select: { id: true } // Select the Prisma User primary key
    });
    
    if (!authenticatedPrismaUser) {
        console.error('Authenticated Supabase user not found in Prisma table:', supabaseUser.id);
        // This case might indicate a data inconsistency, but for the API, treat as unauthorized/not found
        return NextResponse.json({ error: 'Usuário autenticado não encontrado' }, { status: 404 });
    }
    
    // Check if the authenticated user is trying to access their own data
    if (authenticatedPrismaUser.id !== requestedUserId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Fetch the user data using the validated Prisma User ID
    const user = await UserRepository.getById(requestedUserId as ID);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Retornar os dados do usuário (excluindo senha)
    const response: BaseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      language: user.language,
      household: user.household ? {
        id: user.household.id,
        name: user.household.name
      } : null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os dados do usuário' },
      { status: 500 }
    );
  }
} 
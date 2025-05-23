import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// GET /api/profile/[idOrUsername]
export async function GET(
  request: NextRequest,
  { params }: { params: { idOrUsername: string } }
) {
  try {
    // const cookieStore = cookies();
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { idOrUsername } = await params;
    // Detecta se é UUID (id) ou username
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(idOrUsername);
    const userWhere = isUuid
      ? { id: idOrUsername }
      : { username: idOrUsername };

    // Busca perfil do usuário com lares, membros e gatos
    const profile = await prisma.profiles.findUnique({
      where: userWhere,
      select: {
        id: true,
        username: true,
        full_name: true,
        avatar_url: true,
        email: true,
        timezone: true,
        household_members: {
          select: {
            role: true,
            household: {
              select: {
                id: true,
                name: true,
                description: true,
                cats: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                household_members: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        email: true,
                      },
                    },
                    role: true,
                  },
                },
              },
            },
          },
        },
        owned_cats: {
          select: {
            id: true,
            name: true,
            photo_url: true,
            weight: true,
            weight_logs: {
              orderBy: { date: 'desc' },
              take: 1,
              select: { weight: true, date: true },
            },
            feeding_logs: {
              orderBy: { fed_at: 'desc' },
              take: 1,
              select: { fed_at: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')).nullable(),
  timezone: z.string().max(50).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { idOrUsername: string } }
) {
  try {
    // const cookieStore = cookies();
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { idOrUsername } = await params;
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(idOrUsername);
    const userWhere = isUuid
      ? { id: idOrUsername }
      : { username: idOrUsername };

    // Só permite editar o próprio perfil
    const profile = await prisma.profiles.findUnique({ where: userWhere });
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }
    if (profile.id !== supabaseUser.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    // Remove campos vazios/nulos
    Object.keys(data).forEach((k) => (data[k] == null || data[k] === '') && delete data[k]);

    const updated = await prisma.profiles.update({
      where: { id: profile.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao editar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
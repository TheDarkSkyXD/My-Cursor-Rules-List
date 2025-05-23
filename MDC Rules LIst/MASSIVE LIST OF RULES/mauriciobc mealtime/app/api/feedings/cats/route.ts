import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BaseCats } from "@/lib/types/common";

// GET /api/feedings/cats - Listar gatos para o formulário de alimentação
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId é obrigatório' },
        { status: 400 }
      );
    }

    // Consulta para obter gatos com informações necessárias para alimentação
    const cats = await prisma.cats.findMany({
      where: {
        household_id: householdId
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Converter para o formato BaseCats
    const formattedCats: BaseCats[] = cats.map(cat => ({
      id: cat.id,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      name: cat.name,
      birth_date: cat.birth_date,
      weight: cat.weight,
      household_id: cat.household_id,
      owner_id: cat.owner_id
    }));

    console.log(`Encontrados ${formattedCats.length} gatos para a residência ${householdId}`);
    
    return NextResponse.json(formattedCats);
  } catch (error) {
    console.error('Erro ao buscar gatos para o formulário de alimentação:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os gatos' },
      { status: 500 }
    );
  }
} 
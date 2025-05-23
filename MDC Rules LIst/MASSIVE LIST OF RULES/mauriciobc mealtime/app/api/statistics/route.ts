import { NextResponse } from "next/server";
import { getFeedingStatistics } from "@/lib/services/api/statistics-service";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import prisma from '@/lib/prisma';

// GET /api/statistics - Obter estatísticas de alimentação
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      console.error('GET /api/statistics Auth Error:', authError);
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Fetch Prisma user profile to get householdId
    const prismaUser = await prisma.user.findUnique({
        where: { auth_id: supabaseUser.id }, // Assumes unique constraint on auth_id
        select: { householdId: true }
    });

    if (!prismaUser || !prismaUser.householdId) {
        console.error('Authenticated user not found in Prisma or no householdId:', supabaseUser.id);
        return NextResponse.json(
          { error: "Usuário não encontrado ou não associado a um domicílio" },
          { status: 403 } // Use 403 Forbidden as they are authenticated but lack association
        );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7dias";
    const catId = searchParams.get("catId") || "todos";
    const householdId = prismaUser.householdId; // Use householdId from fetched Prisma user

    console.log("Parâmetros recebidos:", { period, catId, householdId });

    const stats = await getFeedingStatistics(
      period,
      catId,
      householdId
    );

    console.log("Estatísticas calculadas:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
} 
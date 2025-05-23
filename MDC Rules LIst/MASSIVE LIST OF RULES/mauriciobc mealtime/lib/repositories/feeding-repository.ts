import prisma from '../prisma';

export const FeedingRepository = {
  // Buscar todos os registros de alimentação
  getAll: async () => {
    return prisma.feeding_logs.findMany({
      include: {
        cat: true,
        feeder: true, // 'feeder' is the user who fed
      },
      orderBy: { fed_at: 'desc' as const },
    });
  },

  // Buscar registros de alimentação de um gato
  getByCat: async (catId: string, limit = 20, offset = 0) => {
    return prisma.feeding_logs.findMany({
      where: { cat_id: catId },
      include: {
        feeder: true,
      },
      orderBy: { fed_at: 'desc' as const },
      skip: offset,
      take: limit,
    });
  },

  // Buscar registros de alimentação de um domicílio
  getByHousehold: async (householdId: string, limit?: number, offset?: number) => {
    console.log("Buscando logs de alimentação para household:", householdId);
    
    const query = {
      where: {
        cat: {
          household_id: householdId,
        },
      },
      include: {
        cat: {
          select: {
            id: true,
            name: true,
            household_id: true
          }
        },
        feeder: true,
      },
      orderBy: { fed_at: 'desc' as const },
    };

    // Se limit e offset forem fornecidos, adiciona paginação
    if (typeof limit === 'number' && typeof offset === 'number') {
      const result = await prisma.feeding_logs.findMany({
        ...query,
        skip: offset,
        take: limit,
      });
      console.log(`Encontrados ${result.length} logs com paginação`);
      return result;
    }

    // Caso contrário, retorna todos os registros
    const result = await prisma.feeding_logs.findMany(query);
    console.log(`Encontrados ${result.length} logs sem paginação`);
    return result;
  },

  // Buscar registros de alimentação de um usuário (feeder)
  getByUser: async (userId: string, limit = 20, offset = 0) => {
    return prisma.feeding_logs.findMany({
      where: { fed_by: userId },
      include: {
        cat: true,
      },
      orderBy: { fed_at: 'desc' as const },
      skip: offset,
      take: limit,
    });
  },

  // Criar um novo registro de alimentação
  create: async (data: {
    cat_id: string;
    fed_by: string;
    fed_at: Date;
    amount: number;
    unit: string;
    notes?: string;
    meal_type: string;
    household_id: string;
  }) => {
    // Only pass the fields that are part of the Prisma model
    return prisma.feeding_logs.create({
      data: {
        cat_id: data.cat_id,
        fed_by: data.fed_by,
        fed_at: data.fed_at,
        amount: data.amount,
        unit: data.unit,
        notes: data.notes,
        meal_type: data.meal_type,
        household_id: data.household_id,
      },
      include: {
        cat: true,
        feeder: true,
      },
    });
  },

  // Atualizar um registro de alimentação
  update: async (
    id: string,
    data: {
      fed_at?: Date;
      amount?: number;
      unit?: string;
      notes?: string;
      meal_type?: string;
    }
  ) => {
    return prisma.feeding_logs.update({
      where: { id },
      data,
      include: {
        cat: true,
        feeder: true,
      },
    });
  },

  // Excluir um registro de alimentação
  delete: async (id: string) => {
    return prisma.feeding_logs.delete({
      where: { id },
    });
  },

  // Buscar estatísticas de alimentação para um gato
  getStatsByCat: async (catId: string, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.feeding_logs.findMany({
      where: {
        cat_id: catId,
        fed_at: {
          gte: startDate,
        },
      },
      orderBy: { fed_at: 'asc' },
    });

    return logs;
  },

  // Buscar a última alimentação de um gato
  getLastFeeding: async (catId: string) => {
    return prisma.feeding_logs.findFirst({
      where: { cat_id: catId },
      orderBy: { fed_at: 'desc' },
      include: {
        feeder: true,
      },
    });
  },
}; 
import prisma from '../prisma';

export const CatRepository = {
  // Buscar todos os gatos
  getAll: async () => {
    return prisma.cats.findMany({
      include: {
        household: true,
        schedules: true,
      },
    });
  },

  // Buscar todos os gatos de um domicílio
  getAllByHousehold: async (householdId: string) => {
    return prisma.cats.findMany({
      where: { household_id: householdId },
      include: {
        schedules: true,
        feeding_logs: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
    });
  },

  // Buscar um gato pelo ID
  getById: async (id: string) => {
    return prisma.cats.findUnique({
      where: { id },
      include: {
        household: true,
        schedules: true,
        feeding_logs: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            feeder: true,
          },
        },
      },
    });
  },

  // Criar um novo gato
  create: async (data: {
    name: string;
    photo_url?: string;
    birth_date?: Date;
    weight?: number;
    restrictions?: string;
    notes?: string;
    household_id: string;
    owner_id: string;
    feeding_interval?: number;
    portion_size?: number;
    portion_unit?: string;
  }) => {
    return prisma.cats.create({
      data,
    });
  },

  // Atualizar um gato
  update: async (
    id: string,
    data: {
      name?: string;
      photo_url?: string;
      birth_date?: Date;
      weight?: number;
      restrictions?: string;
      notes?: string;
      feeding_interval?: number;
      portion_size?: number;
      portion_unit?: string;
    }
  ) => {
    return prisma.cats.update({
      where: { id },
      data,
    });
  },

  // Excluir um gato
  delete: async (id: string) => {
    // Primeiro exclui os registros relacionados
    await prisma.feeding_logs.deleteMany({
      where: { cat_id: id },
    });
    
    await prisma.schedules.deleteMany({
      where: { cat_id: id },
    });
    
    // Depois exclui o gato
    return prisma.cats.delete({
      where: { id },
    });
  },
}; 
import prisma from '@/lib/prisma';

export const UserRepository = {
  // Buscar todos os usuários
  getAll: async () => {
    return prisma.profiles.findMany();
  },

  // Buscar um usuário pelo ID
  getById: async (id: string) => {
    return prisma.profiles.findUnique({
      where: { id },
      include: {
        household_members: {
          include: {
            household: true,
          },
        },
      },
    });
  },

  // Buscar um usuário pelo email
  getByEmail: async (email: string) => {
    return prisma.profiles.findFirst({
      where: { email },
      include: {
        household_members: {
          include: {
            household: true,
          },
        },
      },
    });
  },

  // Buscar um usuário pelo Supabase auth ID (maps to id field)
  getByAuthId: async (authId: string) => {
    return prisma.profiles.findUnique({
      where: { id: authId },
      include: {
        household_members: {
          include: {
            household: true,
          },
        },
      },
    });
  },

  // Buscar usuários de um domicílio
  getByHousehold: async (householdId: string) => {
    return prisma.household_members.findMany({
      where: { household_id: householdId },
      include: {
        user: true,
      },
    });
  },

  // Criar um novo usuário
  create: async (data: {
    full_name?: string;
    email?: string;
    id: string; // Supabase Auth ID
    timezone?: string;
    username?: string;
    avatar_url?: string;
  }) => {
    return prisma.profiles.create({
      data,
    });
  },

  // Atualizar um usuário
  update: async (
    id: string,
    data: {
      full_name?: string;
      email?: string;
      timezone?: string;
      username?: string;
      avatar_url?: string;
    }
  ) => {
    return prisma.profiles.update({
      where: { id },
      data,
    });
  },

  // Atualizar preferências do usuário
  updatePreferences: async (
    id: string,
    data: {
      timezone?: string;
    }
  ) => {
    return prisma.profiles.update({
      where: { id },
      data,
    });
  },

  // Excluir um usuário
  delete: async (id: string) => {
    await prisma.feeding_logs.deleteMany({
      where: { fed_by: id },
    });
    return prisma.profiles.delete({
      where: { id },
    });
  },
}; 
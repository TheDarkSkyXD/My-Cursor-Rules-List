import prisma from '../prisma';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/logger';

export const HouseholdRepository = {
  // Buscar todos os domicílios
  getAll: async () => {
    return prisma.households.findMany();
  },

  // Buscar um domicílio pelo ID
  getById: async (id: string) => {
    return prisma.households.findUnique({
      where: { id },
      include: {
        household_members: {
          include: {
            user: true,
          },
        },
        cats: true,
      },
    });
  },

  // Buscar um domicílio pelo código de convite
  getByInviteCode: async (inviteCode: string) => {
    return prisma.households.findUnique({
      where: { inviteCode },
      include: {
        household_members: {
          include: {
            user: true,
          },
        },
        cats: true,
      },
    });
  },

  // Criar um novo domicílio
  create: async (name: string, owner_id: string) => {
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    return prisma.households.create({
      data: {
        name,
        inviteCode,
        owner_id,
      },
    });
  },

  // Atualizar um domicílio
  update: async (id: string, data: { name?: string }) => {
    return prisma.households.update({
      where: { id },
      data,
    });
  },

  // Gerar um novo código de convite
  refreshInviteCode: async (id: string) => {
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    return prisma.households.update({
      where: { id },
      data: { inviteCode },
    });
  },

  // Adicionar um usuário ao domicílio
  addUser: async (householdId: string, userId: string, role: string) => {
    return prisma.household_members.create({
      data: {
        household_id: householdId,
        user_id: userId,
        role,
      },
    });
  },

  // Remover um usuário do domicílio
  removeUser: async (householdId: string, userId: string) => {
    return prisma.household_members.delete({
      where: {
        household_id_user_id: {
          household_id: householdId,
          user_id: userId,
        },
      },
    });
  },

  // Atualizar o papel de um usuário no domicílio
  updateUserRole: async (householdId: string, userId: string, role: string) => {
    return prisma.household_members.update({
      where: {
        household_id_user_id: {
          household_id: householdId,
          user_id: userId,
        },
      },
      data: { role },
    });
  },
}; 
import prisma from '../prisma';
import { logger } from "@/lib/monitoring/logger";

export const ScheduleRepository = {
  // Buscar todos os agendamentos
  getAll: async () => {
    return prisma.schedules.findMany({
      include: {
        cat: true,
      },
    });
  },

  // Buscar agendamentos de um gato
  getByCat: async (catId: string) => {
    return prisma.schedules.findMany({
      where: { cat_id: catId },
    });
  },

  // Buscar agendamentos de um domicílio
  getByHousehold: async (householdId: string) => {
    return prisma.schedules.findMany({
      where: {
        cat: {
          household_id: householdId,
        },
      },
      include: {
        cat: true,
      },
    });
  },

  // Buscar um agendamento pelo ID
  getById: async (id: string) => {
    return prisma.schedules.findUnique({
      where: { id },
      include: {
        cat: true,
      },
    });
  },

  // Criar um novo agendamento
  create: async (data: {
    catId: string;
    type: string;
    interval: number;
    times: string[];
    overrideUntil?: Date;
  }) => {
    return prisma.schedules.create({
      data: {
        type: data.type,
        interval: data.interval,
        times: data.times,
        cat: {
          connect: { id: data.catId },
        },
      },
      include: {
        cat: true,
      },
    });
  },

  // Atualizar um agendamento
  update: async (
    id: string,
    data: {
      type?: string;
      interval?: number;
      times?: string[];
      overrideUntil?: Date | null;
    }
  ) => {
    const { overrideUntil, ...restOfData } = data;
    return prisma.schedules.update({
      where: { id },
      data: restOfData,
      include: {
        cat: true,
      },
    });
  },

  // Excluir um agendamento
  delete: async (id: string) => {
    return prisma.schedules.delete({
      where: { id },
    });
  },

  // Criar uma substituição temporária
  createOverride: async (
    id: string,
    data: {
      type: string;
      interval: number;
      times: string[];
      overrideUntil: Date;
    }
  ) => {
    return prisma.schedules.update({
      where: { id },
      data,
    });
  },

  // Remover uma substituição temporária
  removeOverride: async (id: string) => {
    return prisma.schedules.update({
      where: { id },
      data: {
        enabled: true,
      },
    });
  },

  // Criar agendamentos em massa para um grupo
  // The catGroup model does not exist in prisma.schema, so this function is commented out.
  /* 
  createForGroup: async (
    groupId: string, // groupId to string
    data: {
      type: string;
      interval: number;
      times: string[]; // times to string[]
      overrideUntil?: Date;
    }
  ) => {
    // Buscar todos os gatos do grupo
    const group = await prisma.catGroup.findUnique({ 
      where: { id: groupId }, 
      include: {
        cats: true, 
      },
    });

    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    // Criar agendamentos para cada gato do grupo
    const schedules = await Promise.all(
      group.cats.map(async (cat) => {
        return prisma.schedules.create({
          data: {
            type: data.type,
            interval: data.interval,
            times: data.times,
            // overrideUntil: data.overrideUntil, // Removed: field does not exist
            cat: {
              connect: { id: cat.id }, 
            },
          },
        });
      })
    );

    return schedules;
  },
  */
}; 
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/monitoring/logger";

export async function getCatByIdServer(id: string) {
  if (!id || typeof id !== "string") {
    return null;
  }

  try {
    const cat = await prisma.cats.findUnique({
      where: { id },
      include: {
        household: true,
        feeding_logs: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            feeder: true
          }
        }
      }
    });

    return cat;
  } catch (error) {
    console.error('Error fetching cat by ID:', error);
    return null;
  }
} 
import { FeedingLog, StatisticsData, TimeSeriesDataPoint, CatPortion } from "@/lib/types";
import { FeedingRepository } from "@/lib/repositories/feeding-repository";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function getFeedingStatistics(
  period: string = "7dias", 
  catId: string = "todos",
  householdId: number
): Promise<StatisticsData & { feedingLogs: FeedingLog[] }> {
  try {
    console.log("Buscando logs de alimentação para household:", householdId);
    
    // Determinar o período de tempo
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case "7dias":
        startDate = subDays(endDate, 7);
        break;
      case "30dias":
        startDate = subDays(endDate, 30);
        break;
      case "3meses":
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    console.log("Período de busca:", { startDate, endDate });

    // Buscar logs de alimentação
    const rawLogs = await FeedingRepository.getByHousehold(String(householdId));
    console.log("Logs encontrados:", rawLogs.length);

    // Map raw logs to FeedingLog type
    const logs: FeedingLog[] = rawLogs.map((log: any) => ({
      id: log.id,
      catId: log.cat_id,
      userId: log.fed_by || log.feeder?.id || log.user_id,
      timestamp: log.fed_at || log.timestamp,
      amount: log.amount ?? log.portion_size ?? null,
      portionSize: log.amount ?? log.portion_size ?? null,
      notes: log.notes ?? null,
      createdAt: log.created_at ?? null,
      status: log.status ?? undefined,
      mealType: log.meal_type ?? undefined,
      householdId: log.household_id ?? undefined,
      cat: log.cat,
      user: log.feeder ? {
        id: log.feeder.id,
        name: log.feeder.full_name ?? log.feeder.username ?? null,
        avatar: log.feeder.avatar_url ?? null,
      } : undefined,
    }));
    
    // Filtrar logs pelo período e gato (se especificado)
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const dateInRange = logDate >= startDate && logDate <= endDate;
      const catMatch = catId === "all" || log.catId?.toString() === catId;
      console.log("Filtrando log:", { 
        logDate, 
        dateInRange, 
        catMatch, 
        catId: log.catId, 
        selectedCat: catId 
      });
      return dateInRange && catMatch;
    });
    console.log("Logs filtrados:", filteredLogs.length);

    // Calcular estatísticas básicas
    const totalFeedings = filteredLogs.length;
    const validPortions = filteredLogs.filter(log => log.portionSize !== null && log.portionSize > 0);
    const averagePortionSize = validPortions.length > 0
      ? validPortions.reduce((sum, log) => sum + (log.portionSize || 0), 0) / validPortions.length
      : 0;

    console.log("Estatísticas básicas:", { totalFeedings, averagePortionSize });

    // Calcular dados de série temporal
    const timeSeriesData = calculateTimeSeriesData(filteredLogs, startDate, endDate);
    console.log("Dados de série temporal:", timeSeriesData);

    // Calcular dados de porção por gato
    const catPortionData = calculateCatPortionData(filteredLogs);
    console.log("Dados de porção por gato:", catPortionData);

    // Calcular distribuição de horários
    const timeDistributionData = calculateTimeDistributionData(filteredLogs);
    console.log("Distribuição de horários:", timeDistributionData);

    // Calcular dias consecutivos e refeições perdidas
    const { maxConsecutiveDays, missedSchedules } = calculateConsecutiveDaysAndMissedSchedules(filteredLogs);
    console.log("Dias consecutivos e refeições perdidas:", { maxConsecutiveDays, missedSchedules });

    return {
      totalFeedings,
      averagePortionSize,
      maxConsecutiveDays,
      missedSchedules,
      timeSeriesData,
      catPortionData,
      timeDistributionData,
      feedingLogs: filteredLogs,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    throw new Error("Falha ao buscar estatísticas de alimentação");
  }
}

function calculateTimeSeriesData(logs: FeedingLog[], startDate: Date, endDate: Date): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === currentDate.toDateString();
    });

    const totalPortions = dayLogs.reduce((sum, log) => sum + (log.portionSize || 0), 0);

    dataPoints.push({
      name: currentDate.toISOString().split('T')[0],
      valor: totalPortions,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}

function calculateCatPortionData(logs: FeedingLog[]): CatPortion[] {
  const catPortions = new Map<string, number>();
  
  logs.forEach(log => {
    if (log.portionSize && log.portionSize > 0 && log.cat) {
      const currentValue = catPortions.get(log.cat.name) || 0;
      catPortions.set(log.cat.name, currentValue + log.portionSize);
    }
  });

  const result = Array.from(catPortions).map(([name, value]) => ({ name, value }));
  console.log("Dados de porção por gato calculados:", result);
  return result;
}

function calculateTimeDistributionData(logs: FeedingLog[]): TimeSeriesDataPoint[] {
  const hourlyDistribution = new Array(24).fill(0);
  
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourlyDistribution[hour]++;
  });

  const result = hourlyDistribution.map((count, hour) => ({
    name: `${hour.toString().padStart(2, '0')}:00`,
    valor: count,
  }));

  console.log("Distribuição de horários calculada:", result);
  return result;
}

function calculateConsecutiveDaysAndMissedSchedules(logs: FeedingLog[]): { maxConsecutiveDays: number; missedSchedules: number } {
  if (logs.length === 0) {
    return { maxConsecutiveDays: 0, missedSchedules: 0 };
  }

  // Ordenar logs por data
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let currentStreak = 1;
  let maxStreak = 1;
  let missedSchedules = 0;
  let lastDate = new Date(sortedLogs[0].timestamp);

  for (let i = 1; i < sortedLogs.length; i++) {
    const currentDate = new Date(sortedLogs[i].timestamp);
    const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (daysDiff > 1) {
      currentStreak = 1;
      missedSchedules += daysDiff - 1;
    }

    lastDate = currentDate;
  }

  return { maxConsecutiveDays: maxStreak, missedSchedules };
} 
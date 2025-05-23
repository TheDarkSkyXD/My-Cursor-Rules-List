import { FeedingLog, StatisticsData, TimeSeriesDataPoint, CatPortion } from "@/lib/types";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";

/**
 * Processa os dados de alimentação e retorna as estatísticas calculadas
 */
export function processStatistics(
  logs: FeedingLog[],
  period: string = "7dias"
): StatisticsData {
  try {
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
      case "90dias":
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    // Filtrar logs pelo período
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    // Calcular estatísticas básicas
    const totalFeedings = filteredLogs.length;
    const validPortions = filteredLogs.filter(log => log.portionSize !== null && log.portionSize > 0);
    const averagePortionSize = validPortions.length > 0
      ? validPortions.reduce((sum, log) => sum + (log.portionSize || 0), 0) / validPortions.length
      : 0;

    // Calcular dados de série temporal
    const timeSeriesData = calculateTimeSeriesData(filteredLogs, startDate, endDate);

    // Calcular dados de porção por gato
    const catPortionData = calculateCatPortionData(filteredLogs);

    // Calcular distribuição de horários
    const timeDistributionData = calculateTimeDistributionData(filteredLogs);

    // Calcular dias consecutivos e refeições perdidas
    const { maxConsecutiveDays, missedSchedules } = calculateConsecutiveDaysAndMissedSchedules(filteredLogs);

    return {
      totalFeedings,
      averagePortionSize,
      maxConsecutiveDays,
      missedSchedules,
      timeSeriesData,
      catPortionData,
      timeDistributionData,
    };
  } catch (error) {
    console.error("Erro ao processar estatísticas:", error);
    throw new Error("Falha ao processar estatísticas de alimentação");
  }
}

function calculateTimeSeriesData(logs: FeedingLog[], startDate: Date, endDate: Date): TimeSeriesDataPoint[] {
  const dailyData = new Map<string, number>();
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyData.set(dateKey, 0);
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  logs.forEach(log => {
    const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
    const currentCount = dailyData.get(dateKey) || 0;
    dailyData.set(dateKey, currentCount + 1);
  });

  return Array.from(dailyData).map(([name, valor]) => ({ name, valor }));
}

function calculateCatPortionData(logs: FeedingLog[]): CatPortion[] {
  const catPortions = new Map<string, number>();
  
  logs.forEach(log => {
    if (log.portionSize && log.portionSize > 0 && log.cat) {
      const currentValue = catPortions.get(log.cat.name) || 0;
      catPortions.set(log.cat.name, currentValue + log.portionSize);
    }
  });

  return Array.from(catPortions).map(([name, value]) => ({ name, value }));
}

function calculateTimeDistributionData(logs: FeedingLog[]): TimeSeriesDataPoint[] {
  const hourDistribution = new Map<string, number>();
  
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;
    const currentCount = hourDistribution.get(hourKey) || 0;
    hourDistribution.set(hourKey, currentCount + 1);
  });

  return Array.from(hourDistribution)
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => {
      const hourA = parseInt(a.name.split(':')[0]);
      const hourB = parseInt(b.name.split(':')[0]);
      return hourA - hourB;
    });
}

function calculateConsecutiveDaysAndMissedSchedules(logs: FeedingLog[]) {
  let maxConsecutiveDays = 0;
  let currentConsecutiveDays = 1;
  let missedSchedules = 0;
  
  // Ordenar logs por data
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i - 1].timestamp);
    const currentDate = new Date(sortedLogs[i].timestamp);
    
    const diffDays = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentConsecutiveDays++;
      maxConsecutiveDays = Math.max(maxConsecutiveDays, currentConsecutiveDays);
    } else if (diffDays > 1) {
      currentConsecutiveDays = 1;
      missedSchedules += diffDays - 1;
    }
  }

  return { maxConsecutiveDays, missedSchedules };
} 
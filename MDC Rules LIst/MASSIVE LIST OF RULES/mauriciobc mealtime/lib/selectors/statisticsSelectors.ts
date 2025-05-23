"use client";

import { useMemo } from "react";
import { useCats } from "@/lib/context/CatsContext";
import { useFeeding } from "@/lib/context/FeedingContext";
import { useUserContext } from "@/lib/context/UserContext";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, getHours, format } from "date-fns";
import { FeedingLog, CatType, Household, User as CurrentUserType } from "@/lib/types";

// Define interfaces for structured data
export interface StatisticsData {
  totalFeedings: number;
  averagePortionSize: number;
  totalPortionSize: number;
  timeSeriesData: TimeSeriesDataPoint[];
  catPortionData: CatPortion[];
  timeDistributionData: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
  name: string; // e.g., 'dd/MM', 'HH:00'
  fullDate?: string; // Optional: 'yyyy-MM-dd' for line chart tooltips
  valor: number;
}

export interface CatPortion {
  name: string;
  value: number;
}

// Helper function to calculate date range
export const getDateRange = (period: string): { start: Date; end: Date } => {
  try {
    const now = new Date();
    
    // Validate period
    if (!period) {
      console.warn('No period provided, defaulting to 7 days');
      return { 
        start: startOfDay(subDays(now, 6)), 
        end: endOfDay(now) 
      };
    }

    switch (period) {
      case "hoje":
        return { 
          start: startOfDay(now), 
          end: endOfDay(now) 
        };
      case "7dias":
        return { 
          start: startOfDay(subDays(now, 6)), 
          end: endOfDay(now) 
        };
      case "30dias":
        return { 
          start: startOfDay(subDays(now, 29)), 
          end: endOfDay(now) 
        };
      case "mesAtual":
        return { 
          start: startOfMonth(now), 
          end: endOfMonth(now) 
        };
      case "mesPassado": {
        const lastMonth = subMonths(now, 1);
        return { 
          start: startOfMonth(lastMonth), 
          end: endOfMonth(lastMonth) 
        };
      }
      default:
        console.warn(`Invalid period "${period}", defaulting to 7 days`);
        return { 
          start: startOfDay(subDays(now, 6)), 
          end: endOfDay(now) 
        };
    }
  } catch (error) {
    console.error('Error calculating date range:', error);
    // Return a safe fallback
    const now = new Date();
    return {
      start: startOfDay(subDays(now, 6)),
      end: endOfDay(now)
    };
  }
}

// --- Main Selector Hook ---

export function useSelectFeedingStatistics(): {
  currentUser: CurrentUserType | null;
  cats: CatType[];
  feedingLogs: FeedingLog[];
  isLoading: boolean;
  error: string | null;
} {
  const { state: catsState } = useCats();
  const { state: feedingState } = useFeeding();
  const { state: userState } = useUserContext();

  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState;
  const { feedingLogs, isLoading: isLoadingFeedings, error: errorFeedings } = feedingState;
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;

  // Combine loading and error states
  const isLoading = isLoadingUser || isLoadingCats || isLoadingFeedings;
  const error = errorCats || errorFeedings || errorUser;

  // Return the raw data and combined states, with proper null handling
  return { 
    currentUser, 
    cats: cats || [], 
    feedingLogs: feedingLogs || [], 
    isLoading, 
    error 
  };
} 
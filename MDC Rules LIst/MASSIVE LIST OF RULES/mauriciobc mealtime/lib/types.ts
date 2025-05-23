import { BaseCat } from "./types/common";
import { ID } from "./types/common"; // Assuming ID might be string | number

// User & Household
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  households: string[]; // IDs of households
  primaryHousehold: string; // ID of primary household
  householdId: string | null;
  preferences: {
    timezone: string;
    language: string; // en-US, pt-BR, es-ES
    notifications: NotificationSettings;
  };
  role: 'admin' | 'user';
  imageUrl?: string;
}

// Define HouseholdMember explicitly
export interface HouseholdMember {
  id?: string;
  userId: string;
  role: 'Admin' | 'Member';
  joinedAt: Date;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: HouseholdMember[];
  cats: string[];
  catGroups: CatGroup[];
  createdAt: Date;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CatGroup {
  id: number;
  name: string;
  catIds: number[];
}

// Cat Profiles
export interface CatType {
  id: string; // UUID
  name: string;
  breed?: string | null; // Added breed as optional
  photo_url?: string | null;
  birthdate?: Date | string | null;
  weight?: number | string | null; // Allow string for form compatibility
  feeding_interval: number | string | null;  // Allow string for form compatibility
  portion_size?: string | null; // Text type
  restrictions?: string | null;
  notes?: string | null;
  householdId: string; // UUID
  createdAt?: Date;
  updatedAt?: Date;
  schedules?: Schedule[];
}

// Define a simplified User type reflecting API GET /feedings response
interface FeedingLogUser {
  id: string; // User ID (UUID) from fed_by
  name?: string | null; // From feeder.full_name
  avatar?: string | null; // From feeder.avatar_url
}

// Updated FeedingLog interface
export interface FeedingLog {
  id: string; // Meal ID (UUID) - Changed from number
  catId: string; // Cat ID (UUID) - Changed from number
  userId: string; // User ID (UUID) who fed - Was string, ensure it's UUID
  timestamp: Date | string; // Timestamp of feeding (from fed_at) - Allow string for initial fetch
  amount?: number | null; // From amount field in the database
  portionSize?: number | null; // Alias for amount, for backward compatibility
  notes?: string | null; // From notes - Kept optional string
  createdAt?: Date | string; // This might not be directly available from /api/feedings GET
  status?: "Normal" | "Comeu Pouco" | "Recusou" | "Vomitou" | "Outro"; // Keep for now, but API uses meal_type
  mealType?: "dry" | "wet" | "treat" | "medicine" | "water"; // Added based on API `meal_type`
  householdId?: string; // Added based on API `household_id`

  // Updated relations based on API response
  cat?: CatType; // Will be undefined from /api/feedings GET
  user?: FeedingLogUser; // Simplified user based on 'feeder' relation
}

// Notifications
export type { Notification, NotificationType, CreateNotificationPayload } from './types/notification';

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  feedingReminders: boolean;
  missedFeedingAlerts: boolean;
  householdUpdates: boolean;
}

// Store the current cat data structure for compatibility
export interface LegacyCatProfile {
  id: number;
  name: string;
  avatar: string;
  regularAmount: string;
  foodUnit: string;
  feedingInterval: number;
  lastFed: string;
  feedingHistory: {
    time: string;
    amount: string;
  }[];
}

export interface Schedule {
  id: string;
  catId: string;
  userId: string;
  type: 'interval' | 'fixedTime';
  interval?: number; // Hours between feedings
  times?: string; // Specific times (e.g., "08:00")
  days: string[];
  enabled: boolean;
  status?: "pending" | "completed" | "missed";
  createdAt?: Date;
  cat?: CatType;
  user?: User;
}

export interface StatisticsData {
  totalFeedings: number;
  averagePortionSize: number;
  maxConsecutiveDays: number;
  missedSchedules: number;
  timeSeriesData: TimeSeriesDataPoint[];
  catPortionData: CatPortion[];
  timeDistributionData: TimeSeriesDataPoint[];
}

export interface TimeSeriesDataPoint {
  name: string;
  valor: number;
}

export interface CatPortion {
  name: string;
  value: number;
}

export interface FeedingFormProps {
  catId: string;
  onMarkAsFed: (amount?: string, notes?: string, timestamp?: Date) => Promise<FeedingLog>;
}

export interface FeedingHistoryProps {
  logs: FeedingLog[];
  onMarkAsFed?: () => void;
}

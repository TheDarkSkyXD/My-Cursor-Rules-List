/**
 * Tipo base para IDs numéricos em toda a aplicação
 */
export type ID = string;

// Add this at the top if Decimal is not defined elsewhere
// If you use a library like decimal.js, import it. Otherwise, fallback to number.
type Decimal = number;

/**
 * Interface base para usuários do sistema
 */
export interface BaseUser {
  id: ID;
  name: string;
  email: string;
  avatar?: string;
  householdId: number | null;
  household?: {
    id: number;
    name: string;
  } | null;
  preferences?: {
    timezone?: string;
    language?: string;
    notifications?: {
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      feedingReminders?: boolean;
      missedFeedingAlerts?: boolean;
      householdUpdates?: boolean;
    };
  };
  role: 'admin' | 'user';
}

/**
 * Interface base para gatos cadastrados no sistema
 */
export interface BaseCat {
  id: ID;
  name: string;
  photoUrl?: string;
  birthdate?: Date;
  weight?: number;
  restrictions?: string;
  notes?: string;
  householdId: ID;
  feedingInterval: number;
  portionSize?: string;
}

/**
 * Interface base para registros de alimentação
 */
export interface BaseFeedingLog {
  id: ID;
  catId: ID;
  userId: ID;
  timestamp: Date;
  portionSize?: number; // Maps to portion_size in the database
  notes?: string;
  status?: "Normal" | "Comeu Pouco" | "Recusou" | "Vomitou" | "Outro" | "completed"; // Maps to status in the database
  createdAt: Date;
}

/**
 * Interface base para famílias/grupos de usuários
 */
export interface BaseHousehold {
  id: number;
  name: string;
  ownerId: number;
}

export interface BaseProfile {
  id: ID;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  updated_at?: Date | null;
}

export interface BaseCats {
  id: ID;
  created_at: Date;
  updated_at: Date;
  name: string;
  birth_date?: Date | null;
  weight?: Decimal | null;
  household_id: ID;
  owner_id: ID;
  photo_url?: string | null;
  restrictions?: string | null;
  notes?: string | null;
  feeding_interval?: number | null; // Integer type for interval in hours
  portion_size?: string | null; // Text type
}

export interface BaseFeedingLogs {
  id: ID;
  created_at: Date;
  updated_at: Date;
  cat_id: ID;
  household_id: ID;
  meal_type: string;
  amount: number;
  unit: string;
  notes?: string | null;
  fed_by?: ID | null;
  fed_at: Date;
}
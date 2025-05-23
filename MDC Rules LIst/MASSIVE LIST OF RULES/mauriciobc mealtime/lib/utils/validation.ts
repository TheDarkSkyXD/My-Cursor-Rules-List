import { BaseUser, BaseCat, BaseFeedingLog, BaseHousehold } from "@/lib/types/common";

/**
 * Valida se um objeto corresponde à interface BaseUser
 */
export function isValidUser(user: unknown): user is BaseUser {
  if (!user || typeof user !== "object") return false;
  const u = user as BaseUser;
  return (
    typeof u.id === "number" &&
    typeof u.name === "string" &&
    typeof u.email === "string" &&
    typeof u.role === "string" &&
    (!u.timezone || typeof u.timezone === "string") &&
    (!u.language || typeof u.language === "string") &&
    (!u.householdId || typeof u.householdId === "number")
  );
}

/**
 * Valida se um objeto corresponde à interface BaseCat
 */
export function isValidCat(cat: unknown): cat is BaseCat {
  if (!cat || typeof cat !== "object") return false;
  const c = cat as BaseCat;
  return (
    typeof c.id === "number" &&
    typeof c.name === "string" &&
    (!c.photoUrl || typeof c.photoUrl === "string") &&
    (!c.birthdate || c.birthdate instanceof Date) &&
    (!c.weight || typeof c.weight === "number") &&
    (!c.restrictions || typeof c.restrictions === "string") &&
    (!c.notes || typeof c.notes === "string") &&
    typeof c.householdId === "number" &&
    typeof c.feeding_interval === "number" &&
    (!c.portion_size || typeof c.portion_size === "number")
  );
}

/**
 * Valida se um objeto corresponde à interface BaseFeedingLog
 */
export function isValidFeedingLog(log: unknown): log is BaseFeedingLog {
  if (!log || typeof log !== "object") return false;
  const l = log as BaseFeedingLog;
  return (
    typeof l.id === "number" &&
    typeof l.catId === "number" &&
    typeof l.userId === "number" &&
    l.timestamp instanceof Date &&
    (!l.portionSize || typeof l.portionSize === "number") &&
    (!l.notes || typeof l.notes === "string") &&
    (!l.status || typeof l.status === "string") &&
    l.createdAt instanceof Date
  );
}

/**
 * Valida se um objeto corresponde à interface BaseHousehold
 */
export function isValidHousehold(household: unknown): household is BaseHousehold {
  if (!household || typeof household !== "object") return false;
  const h = household as BaseHousehold;
  return (
    typeof h.id === "number" &&
    typeof h.name === "string" &&
    typeof h.ownerId === "number"
  );
} 
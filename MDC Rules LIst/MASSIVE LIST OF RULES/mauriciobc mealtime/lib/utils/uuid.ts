import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID v4
 * @returns A UUID string
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Generates a numeric UUID by removing non-numeric characters from a UUID
 * @returns A numeric string derived from a UUID
 */
export const generateNumericUUID = (): string => {
  return uuidv4().replace(/\D/g, '');
}; 
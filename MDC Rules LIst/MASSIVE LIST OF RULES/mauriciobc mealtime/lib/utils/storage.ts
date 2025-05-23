import { useCallback, useEffect, useState } from 'react';
import { StorageService } from './StorageService';

interface StorageOptions {
  version?: number;
  expiryMs?: number;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: number;
}

class StorageService {
  private static instance: StorageService;
  private cache: Map<string, any>;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  get<T>(key: string, options: StorageOptions = {}): T | null {
    try {
      // Check cache first
      const cachedValue = this.cache.get(key);
      if (cachedValue) {
        const { data, timestamp, version } = cachedValue as CachedData<T>;
        
        // Version check
        if (options.version && version !== options.version) {
          this.remove(key);
          return null;
        }

        // Expiry check
        if (options.expiryMs && Date.now() - timestamp > options.expiryMs) {
          this.remove(key);
          return null;
        }

        return data;
      }

      // Check localStorage
      const storedValue = localStorage.getItem(key);
      if (!storedValue) {
        return null;
      }

      const parsed = JSON.parse(storedValue) as CachedData<T>;

      // Version check
      if (options.version && parsed.version !== options.version) {
        this.remove(key);
        return null;
      }

      // Expiry check
      if (options.expiryMs && Date.now() - parsed.timestamp > options.expiryMs) {
        this.remove(key);
        return null;
      }

      // Update cache
      this.cache.set(key, parsed);
      return parsed.data;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }

  set<T>(key: string, data: T, options: StorageOptions = {}): void {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: options.version ?? 1
      };

      // Update cache
      this.cache.set(key, cachedData);

      // Update localStorage
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
    }
  }

  remove(key: string): void {
    try {
      // Clear from cache
      this.cache.delete(key);

      // Clear from localStorage
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  }

  clear(): void {
    try {
      // Clear cache
      this.cache.clear();

      // Clear localStorage
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

// Export the singleton instance
export const storageService = StorageService.getInstance();

// Re-export the StorageOptions type for convenience
export type { StorageOptions } from './StorageService';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {}
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = storageService.get<T>(key, options);
    return item !== null ? item : initialValue;
  });

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    storageService.set(key, value, options);
  }, [key, options]);

  useEffect(() => {
    const item = storageService.get<T>(key, options);
    if (item !== null) {
      setStoredValue(item);
    }
  }, [key, options]);

  return [storedValue, setValue];
}

// Example usage:
/*
// Direct usage
storageService.set('user-preferences', { theme: 'dark' });
const preferences = storageService.get('user-preferences');

// Hook usage
const [preferences, setPreferences] = useLocalStorage('user-preferences', { theme: 'light' }, { version: 1 });
*/ 
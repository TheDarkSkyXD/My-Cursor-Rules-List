import { Cache } from './cache';

interface StorageOptions {
  version?: number;
  expiryMs?: number;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: number;
}

// Utility for managing storage with caching and persistence
export class StorageService {
  private static instance: StorageService;
  private cache: Cache<string, CachedData<any>>;

  constructor() {
    this.cache = new Cache({
      maxSize: 1000, // Store up to 1000 items
      ttl: 24 * 60 * 60 * 1000 // 24 hours TTL
    });
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
      if (cachedValue !== undefined) {
        const { data, timestamp, version } = cachedValue;
        
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

        return data as T;
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

  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    try {
      const cachedData: CachedData<T> = {
        data: value,
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

// Example usage:
// const storage = new StorageService();
// storage.set('user', { id: 1, name: 'John Doe' });
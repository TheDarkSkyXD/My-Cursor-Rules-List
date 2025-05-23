interface ImageCacheEntry {
  data: Buffer;
  timestamp: number;
}

class ImageCache {
  private cache: Map<string, ImageCacheEntry>;
  private maxAge: number; // em milissegundos
  private maxSize: number;

  constructor(maxAge: number = 24 * 60 * 60 * 1000, maxSize: number = 1000) {
    this.cache = new Map();
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<Buffer | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se a entrada expirou
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: Buffer): Promise<void> {
    // Limpar entradas antigas se o cache estiver cheio
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Exportar uma instância única do cache
export const imageCache = new ImageCache(); 
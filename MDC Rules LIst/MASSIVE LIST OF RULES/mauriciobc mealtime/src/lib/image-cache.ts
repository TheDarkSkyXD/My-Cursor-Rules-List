import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ImageCacheError } from './image-errors';
import { Singleton } from '@/lib/utils/singleton';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

interface CacheMetadata {
  lastAccessed: number;
  size: number;
  type: 'user' | 'cat' | 'thumbnail';
}

interface CacheEntry {
  metadata: CacheMetadata;
  data: Buffer;
}

class ImageCache extends Singleton<ImageCache> {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private cacheDir: string;

  protected constructor() {
    super();
    this.cache = new Map();
    this.maxSize = 100 * 1024 * 1024; // 100MB
    this.cacheDir = path.join(process.cwd(), 'tmp', 'image-cache');
    this.initializeCacheDir();
  }

  private async initializeCacheDir() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      throw new ImageCacheError('Falha ao inicializar diretório de cache');
    }
  }

  private async cleanupCache() {
    try {
      let totalSize = 0;
      const entries = Array.from(this.cache.entries());
      
      // Ordenar por último acesso (mais antigos primeiro)
      entries.sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);

      for (const [key, entry] of entries) {
        totalSize += entry.metadata.size;
        
        if (totalSize > this.maxSize) {
          // Remover do cache
          this.cache.delete(key);
          
          // Remover arquivo do disco
          const filePath = path.join(this.cacheDir, key);
          try {
            await unlink(filePath);
          } catch (error) {
            console.error(`Erro ao remover arquivo de cache: ${filePath}`, error);
            throw new ImageCacheError('Falha ao remover arquivo de cache');
          }
        }
      }
    } catch (error) {
      throw new ImageCacheError('Falha ao limpar cache');
    }
  }

  public async get(key: string): Promise<Buffer | null> {
    try {
      const entry = this.cache.get(key);
      
      if (entry) {
        // Atualizar último acesso
        entry.metadata.lastAccessed = Date.now();
        return entry.data;
      }

      // Tentar carregar do disco
      const filePath = path.join(this.cacheDir, key);
      try {
        const data = await readFile(filePath);
        const stats = fs.statSync(filePath);
        
        // Adicionar ao cache em memória
        this.cache.set(key, {
          metadata: {
            lastAccessed: Date.now(),
            size: stats.size,
            type: this.getImageTypeFromKey(key)
          },
          data
        });

        // Limpar cache se necessário
        await this.cleanupCache();
        
        return data;
      } catch (error) {
        return null;
      }
    } catch (error) {
      throw new ImageCacheError('Falha ao obter imagem do cache');
    }
  }

  public async set(key: string, data: Buffer, type: 'user' | 'cat' | 'thumbnail'): Promise<void> {
    try {
      const filePath = path.join(this.cacheDir, key);
      
      // Salvar no disco
      await writeFile(filePath, data);
      
      // Adicionar ao cache em memória
      this.cache.set(key, {
        metadata: {
          lastAccessed: Date.now(),
          size: data.length,
          type
        },
        data
      });

      // Limpar cache se necessário
      await this.cleanupCache();
    } catch (error) {
      throw new ImageCacheError('Falha ao salvar imagem no cache');
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      // Remover do cache em memória
      this.cache.delete(key);
      
      // Remover arquivo do disco
      const filePath = path.join(this.cacheDir, key);
      try {
        await unlink(filePath);
      } catch (error) {
        console.error(`Erro ao remover arquivo de cache: ${filePath}`, error);
        throw new ImageCacheError('Falha ao remover arquivo de cache');
      }
    } catch (error) {
      throw new ImageCacheError('Falha ao remover imagem do cache');
    }
  }

  private getImageTypeFromKey(key: string): 'user' | 'cat' | 'thumbnail' {
    if (key.includes('/humans/')) return 'user';
    if (key.includes('/cats/')) return 'cat';
    return 'thumbnail';
  }

  public getStats() {
    let totalSize = 0;
    let countByType = {
      user: 0,
      cat: 0,
      thumbnail: 0
    };

    for (const entry of this.cache.values()) {
      totalSize += entry.metadata.size;
      countByType[entry.metadata.type]++;
    }

    return {
      totalSize,
      countByType,
      totalEntries: this.cache.size
    };
  }

  setMaxSize(size: number): void {
    this.maxSize = size;
    this.trimCache();
  }

  private trimCache(): void {
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = ImageCache.getInstance(); 
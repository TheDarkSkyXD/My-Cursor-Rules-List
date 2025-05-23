import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Session } from '@collabx/shared';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const redisPrefix = isProduction ? (process.env.REDIS_PREFIX || '') : '';
    const host = redisPrefix + (process.env.REDIS_HOST || 'localhost');
    const port = parseInt(process.env.REDIS_PORT || '6379');
    
    this.logger.log(`Connecting to Redis at ${host}:${port}${isProduction ? ' with TLS' : ''}`);
    
    const config: any = {
      host: host,
      port: port,
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 5000);
        this.logger.log(`Redis connection attempt ${times} failed. Retrying in ${delay}ms`);
        return delay;
      }
    };
    
    // Only use TLS in production
    if (isProduction) {
      config.tls = {};
    }
    
    this.redis = new Redis(config);
    
    // Add event listeners for better troubleshooting
    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
    
    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });
  }

  // General-purpose Redis methods
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  // Session-specific methods
  async getSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    // Convert users Map back from array
    session.users = new Map(Object.entries(session.users));
    return session;
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    // Convert users Map to array for Redis storage
    const sessionData = {
      ...session,
      users: Object.fromEntries(session.users),
    };
    await this.redis.set(
      `${this.SESSION_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      'EX',
      this.SESSION_TTL,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
  }

  async updateSessionLastActive(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.setSession(sessionId, session);
    }
  }

  async setSessionTTL(sessionId: string, ttl: number): Promise<void> {
    await this.redis.expire(`${this.SESSION_PREFIX}${sessionId}`, ttl);
  }

  async getAllSessions(): Promise<Session[]> {
    const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
    const sessions: Session[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        session.users = new Map(Object.entries(session.users));
        sessions.push(session);
      }
    }

    return sessions;
  }
}

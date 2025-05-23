import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { ConfigService } from '@nestjs/config';
import { RedisRateLimiter } from '../redis-rate-limiter';
import { RedisService } from '../../services/redis.service';

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;
  let mockRedisService: Partial<RedisService>;
  let mockConfigService: Partial<ConfigService>;
  let mockSocket: Partial<Socket>;
  let module: TestingModule;

  beforeEach(async () => {
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
      del: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const configs = {
          'RATE_LIMIT_ENABLED': 'true',
          'RATE_LIMIT_JOIN_WINDOW_MS': 60000,
          'RATE_LIMIT_JOIN_MAX': 10,
          'RATE_LIMIT_CONTENT_WINDOW_MS': 1000,
          'RATE_LIMIT_CONTENT_MAX': 20,
          'RATE_LIMIT_CURSOR_WINDOW_MS': 1000,
          'RATE_LIMIT_CURSOR_MAX': 50,
          'RATE_LIMIT_SELECTION_WINDOW_MS': 1000,
          'RATE_LIMIT_SELECTION_MAX': 20,
          'RATE_LIMIT_TYPING_WINDOW_MS': 1000,
          'RATE_LIMIT_TYPING_MAX': 10,
          'RATE_LIMIT_SYNC_WINDOW_MS': 10000,
          'RATE_LIMIT_SYNC_MAX': 5,
          'RATE_LIMIT_GLOBAL_WINDOW_MS': 60000,
          'RATE_LIMIT_GLOBAL_MAX': 100
        };
        
        return configs[key] || null;
      }),
    };

    mockSocket = {
      id: 'test-socket-id',
      data: { userId: 'test-user-id' },
      handshake: {
        query: {
          sessionId: 'test-session',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        auth: {},
      },
    };

    module = await Test.createTestingModule({
      providers: [
        RedisRateLimiter,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    rateLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);
    // Call onModuleInit manually since it's not called by NestJS in tests
    rateLimiter.onModuleInit();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('isRateLimited', () => {
    it('should return false when under rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:test-session:test-user-id`;
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('1');
      (mockRedisService.set as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(false);
      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(mockRedisService.set).toHaveBeenCalledWith(key, '2', expect.any(Number));
    });

    it('should return true when exceeding rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:test-session:test-user-id`;
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('11');

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(key);
    });

    it('should handle new keys', async () => {
      const key = `rate_limit:${MessageType.JOIN}:test-session:test-user-id`;
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce(null);
      (mockRedisService.set as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result.limited).toBe(false);
      expect(mockRedisService.set).toHaveBeenCalledWith(key, '1', expect.any(Number));
    });

    it('should handle Redis errors gracefully', async () => {
      (mockRedisService.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      const result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );

      expect(result).toEqual({
        limited: false,
        message: 'Error checking rate limit',
      });
    });
  });

  describe('clear', () => {
    it('should clear rate limit for socket', async () => {
      (mockRedisService.del as jest.Mock).mockResolvedValue(undefined);

      await rateLimiter.clear(mockSocket as Socket);

      // The clear method should delete rate limits for all event types
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.JOIN}:test-session:test-user-id`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.CONTENT_CHANGE}:test-session:test-user-id`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.CURSOR_MOVE}:test-session:test-user-id`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.SELECTION_CHANGE}:test-session:test-user-id`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.TYPING_STATUS}:test-session:test-user-id`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.SYNC_REQUEST}:test-session:test-user-id`,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      // Only reject the first call to simulate an error during deletion
      (mockRedisService.del as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        rateLimiter.clear(mockSocket as Socket),
      ).resolves.not.toThrow();
      
      // Verify del was at least called once, which indicates the method tried to clear a key
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });
});

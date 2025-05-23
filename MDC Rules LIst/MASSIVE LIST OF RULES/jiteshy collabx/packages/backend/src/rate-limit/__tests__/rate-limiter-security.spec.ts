import { Test, TestingModule } from '@nestjs/testing';
import { RedisRateLimiter } from '../redis-rate-limiter';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { RedisService } from '../../services/redis.service';
import { ConfigService } from '@nestjs/config';

describe('Rate Limiter Security', () => {
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
    // Call onModuleInit manually since it's not called in tests
    rateLimiter.onModuleInit();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Rate Limiting Security', () => {
    it('should check rate limiting for join events', async () => {
      // Test when below limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('3'); // Below limit
      (mockRedisService.set as jest.Mock).mockResolvedValueOnce('OK');
      
      let result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );
      expect(result.limited).toBe(false);
      
      // Test when at limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('20'); // Above limit
      
      result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );
      expect(result.limited).toBe(true);
      
      expect(mockRedisService.get).toHaveBeenCalledTimes(2);
    });

    it('should check rate limiting for content change events', async () => {
      // Test when below limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('3'); // Below limit
      (mockRedisService.set as jest.Mock).mockResolvedValueOnce('OK');
      
      let result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.CONTENT_CHANGE,
      );
      expect(result.limited).toBe(false);
      
      // Test when at limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('20'); // Above limit
      
      result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.CONTENT_CHANGE,
      );
      expect(result.limited).toBe(true);
      
      expect(mockRedisService.get).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent rate limit checks efficiently', async () => {
      const attempts = 10;
      const startTime = performance.now();

      // Mock get to return a value that won't trigger rate limiting
      (mockRedisService.get as jest.Mock).mockResolvedValue('1');
      (mockRedisService.set as jest.Mock).mockResolvedValue('OK');

      const promises = Array.from({ length: attempts }, () =>
        rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockRedisService.get).toHaveBeenCalled();
    });
  });

  describe('DDoS Protection', () => {
    it('should handle rate limit checks for high-frequency requests', async () => {
      // Test when below limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('3'); // Below limit
      (mockRedisService.set as jest.Mock).mockResolvedValueOnce('OK');
      
      let result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );
      expect(result.limited).toBe(false);
      
      // Test when at limit
      (mockRedisService.get as jest.Mock).mockResolvedValueOnce('20'); // Above limit
      
      result = await rateLimiter.isRateLimited(
        mockSocket as Socket,
        MessageType.JOIN,
      );
      expect(result.limited).toBe(true);
      
      expect(mockRedisService.get).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple event types concurrently', async () => {
      const eventTypes = [
        MessageType.JOIN,
        MessageType.CONTENT_CHANGE,
        MessageType.LANGUAGE_CHANGE,
        MessageType.CURSOR_MOVE,
      ];
      const requestsPerType = 5;
      const startTime = performance.now();

      // Mock get to return a value that won't trigger rate limiting
      (mockRedisService.get as jest.Mock).mockResolvedValue('1');
      (mockRedisService.set as jest.Mock).mockResolvedValue('OK');

      const promises = eventTypes.flatMap((eventType) =>
        Array.from({ length: requestsPerType }, () =>
          rateLimiter.isRateLimited(mockSocket as Socket, eventType),
        ),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should handle all requests within 2 seconds
      expect(mockRedisService.get).toHaveBeenCalled();
    });
  });

  describe('Resource Cleanup', () => {
    it('should clear rate limits efficiently on disconnect', async () => {
      const startTime = performance.now();
      (mockRedisService.del as jest.Mock).mockResolvedValue(1);

      await rateLimiter.clear(mockSocket as Socket);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50); // Cleanup should be fast
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it('should handle multiple concurrent cleanup requests', async () => {
      const cleanupCount = 10;
      const startTime = performance.now();
      (mockRedisService.del as jest.Mock).mockResolvedValue(1);

      const promises = Array.from({ length: cleanupCount }, () =>
        rateLimiter.clear(mockSocket as Socket),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should handle all cleanups within 1 second
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });
}); 
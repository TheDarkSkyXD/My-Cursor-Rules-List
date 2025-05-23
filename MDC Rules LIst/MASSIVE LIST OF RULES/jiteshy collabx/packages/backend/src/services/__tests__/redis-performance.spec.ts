import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis.service';
import { Redis } from 'ioredis';
import { Session } from '@collabx/shared';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  expire: jest.fn(),
  on: jest.fn(),
  ttl: jest.fn(),
};

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => mockRedis);
  return { Redis };
});

describe('RedisService Performance', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Operations Performance', () => {
    it('should handle rapid session creation efficiently', async () => {
      const sessions = 100;
      const startTime = performance.now();

      for (let i = 0; i < sessions; i++) {
        const sessionId = `test-session-${i}`;
        const session: Session = {
          id: sessionId,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        await service.setSession(sessionId, session);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / sessions;
      expect(averageTime).toBeLessThan(10); // Each session creation should take less than 10ms
    });

    it('should handle concurrent session reads efficiently', async () => {
      const reads = 1000;
      const startTime = performance.now();

      // Set up a test session
      const sessionId = 'test-session';
      const session: Session = {
        id: sessionId,
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };
      await service.setSession(sessionId, session);

      // Perform concurrent reads
      const readPromises = Array(reads).fill(null).map(() => service.getSession(sessionId));
      await Promise.all(readPromises);

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / reads;
      expect(averageTime).toBeLessThan(1); // Each read should take less than 1ms
    });

    it('should handle session updates efficiently', async () => {
      const updates = 1000;
      const startTime = performance.now();

      // Set up a test session
      const sessionId = 'test-session';
      const session: Session = {
        id: sessionId,
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };
      await service.setSession(sessionId, session);

      // Perform updates
      for (let i = 0; i < updates; i++) {
        session.content = `updated content ${i}`;
        await service.setSession(sessionId, session);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / updates;
      expect(averageTime).toBeLessThan(1); // Each update should take less than 1ms
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk session retrieval efficiently', async () => {
      const sessions = 1000;
      const startTime = performance.now();

      // Set up test sessions
      for (let i = 0; i < sessions; i++) {
        const sessionId = `test-session-${i}`;
        const session: Session = {
          id: sessionId,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        await service.setSession(sessionId, session);
      }

      // Mock keys to return all session keys
      mockRedis.keys.mockResolvedValueOnce(
        Array.from({ length: sessions }, (_, i) => `session:test-session-${i}`)
      );

      // Mock get to return session data
      mockRedis.get.mockImplementation((key) => {
        const sessionId = key.replace('session:', '');
        return Promise.resolve(JSON.stringify({
          id: sessionId,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: {},
          createdAt: Date.now(),
        }));
      });

      // Retrieve all sessions
      const result = await service.getAllSessions();
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / sessions;

      expect(result).toHaveLength(sessions);
      expect(averageTime).toBeLessThan(1); // Each session retrieval should take less than 1ms
    });

    it('should handle concurrent TTL updates efficiently', async () => {
      const operations = 1000;
      const startTime = performance.now();

      // Set up test sessions
      for (let i = 0; i < operations; i++) {
        const sessionId = `test-session-${i}`;
        const session: Session = {
          id: sessionId,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        await service.setSession(sessionId, session);
      }

      // Perform concurrent TTL updates
      const updatePromises = Array(operations)
        .fill(null)
        .map((_, i) => service.setSessionTTL(`test-session-${i}`, 3600));
      await Promise.all(updatePromises);

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(1); // Each operation should take less than 1ms
      expect(mockRedis.expire).toHaveBeenCalledTimes(operations);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const operations = 10000;

      // Perform heavy operations
      for (let i = 0; i < operations; i++) {
        const sessionId = `test-session-${i}`;
        const session: Session = {
          id: sessionId,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        await service.setSession(sessionId, session);
        await service.setSessionTTL(sessionId, 3600);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;

      // Memory usage should not grow significantly
      expect(memoryDiff).toBeLessThan(50 * 1024 * 1024); // Less than 50MB difference
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle connection errors quickly', async () => {
      const startTime = performance.now();
      mockRedis.set.mockRejectedValueOnce(new Error('Connection error'));

      try {
        await service.setSession('test-session', {
          id: 'test-session',
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        });
      } catch (error) {
        // Expected error
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Error handling should be fast
    });
  });
}); 
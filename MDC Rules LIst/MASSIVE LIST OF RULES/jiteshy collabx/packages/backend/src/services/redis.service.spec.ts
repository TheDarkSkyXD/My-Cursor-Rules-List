import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';
import { Session } from '@collabx/shared';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  expire: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => mockRedis);
  return { Redis };
});

describe('RedisService', () => {
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

  describe('getSession', () => {
    it('should return null if session does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getSession('test-session');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('session:test-session');
    });

    it('should return session if exists', async () => {
      const sessionData = {
        id: 'test-session',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: { '1': { id: '1', username: 'test', color: '#000000', lastActive: Date.now(), sessionId: 'test-session' } },
        createdAt: Date.now(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await service.getSession('test-session');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('test-session');
        expect(result.users).toBeInstanceOf(Map);
        expect(result.users.get('1')).toBeDefined();
      }
    });
  });

  describe('setSession', () => {
    it('should set session with TTL', async () => {
      const session: Session = {
        id: 'test-session',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([['1', { id: '1', username: 'test', color: '#000000', lastActive: Date.now(), sessionId: 'test-session' }]]),
        createdAt: Date.now(),
      };

      await service.setSession('test-session', session);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:test-session',
        expect.any(String),
        'EX',
        86400, // 24 hours in seconds
      );
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      const session1 = {
        id: 'session1',
        content: 'content1',
        language: 'javascript',
        lastActive: Date.now(),
        users: { '1': { id: '1', username: 'user1', color: '#000000', lastActive: Date.now(), sessionId: 'session1' } },
        createdAt: Date.now(),
      };

      const session2 = {
        id: 'session2',
        content: 'content2',
        language: 'javascript',
        lastActive: Date.now(),
        users: { '2': { id: '2', username: 'user2', color: '#000000', lastActive: Date.now(), sessionId: 'session2' } },
        createdAt: Date.now(),
      };

      mockRedis.keys.mockResolvedValue(['session:session1', 'session:session2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(session1))
        .mockResolvedValueOnce(JSON.stringify(session2));

      const result = await service.getAllSessions();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session1');
      expect(result[1].id).toBe('session2');
      expect(result[0].users).toBeInstanceOf(Map);
      expect(result[1].users).toBeInstanceOf(Map);
    });

    it('should return empty array if no sessions exist', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await service.getAllSessions();

      expect(result).toHaveLength(0);
    });
  });

  describe('setSessionTTL', () => {
    it('should set TTL for session', async () => {
      await service.setSessionTTL('test-session', 3600);

      expect(mockRedis.expire).toHaveBeenCalledWith('session:test-session', 3600);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      await service.deleteSession('test-session');

      expect(mockRedis.del).toHaveBeenCalledWith('session:test-session');
    });
  });
}); 
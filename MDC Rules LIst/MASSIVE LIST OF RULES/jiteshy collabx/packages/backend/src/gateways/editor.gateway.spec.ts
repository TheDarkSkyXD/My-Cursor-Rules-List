import { Test, TestingModule } from '@nestjs/testing';
import { EditorGateway } from './editor.gateway';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../services/session.service';
import { ConfigService } from '@nestjs/config';
import { MessageType, User } from '@collabx/shared';
import { RedisRateLimiter } from '../rate-limit/redis-rate-limiter';

jest.mock('socket.io', () => {
  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };
  return {
    Server: jest.fn().mockImplementation(() => mockServer),
  };
});

const mockRedisRateLimiter = {
  isRateLimited: jest.fn().mockResolvedValue({ limited: false }),
  clear: jest.fn().mockResolvedValue(undefined),
};

describe('EditorGateway', () => {
  let gateway: EditorGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        query: { sessionId: 'test123' },
      },
      data: {},
      emit: jest.fn(),
      join: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Socket>;

    mockSessionService = {
      getOrCreateSession: jest.fn(),
      addUserToSession: jest.fn(),
      removeUserFromSession: jest.fn(),
      updateSessionContent: jest.fn(),
      updateSessionLanguage: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditorGateway,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisRateLimiter,
          useValue: mockRedisRateLimiter,
        },
      ],
    }).compile();

    gateway = module.get<EditorGateway>(EditorGateway);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should handle valid connection', async () => {
      const mockSession = {
        id: 'test123',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(mockSession);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('test123');
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_RESPONSE, {
        content: mockSession.content,
        language: mockSession.language,
        users: [],
      });
    });

    it('should handle connection without session ID', async () => {
      mockSocket.handshake.query = {};

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, {
        message: 'Session ID is required',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoin', () => {
    it('should handle valid join request', async () => {
      const mockUser: User = {
        id: 'test-user-id',
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test123',
      };

      mockRedisRateLimiter.isRateLimited.mockReturnValue({ limited: false });
      mockSessionService.addUserToSession.mockResolvedValue(mockUser);

      await gateway.handleJoin(mockSocket, { username: 'testuser' });

      expect(mockSessionService.addUserToSession).toHaveBeenCalledWith(
        'test123',
        'testuser',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.JOIN, { user: mockUser });
      expect(mockSocket.to).toHaveBeenCalledWith('test123');
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.USER_JOINED, { user: mockUser });
    });

    it('should handle rate limited join request', async () => {
      mockRedisRateLimiter.isRateLimited.mockReturnValue({
        limited: true,
        message: 'Too many join attempts',
      });

      await gateway.handleJoin(mockSocket, { username: 'testuser' });

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many join attempts',
      });
      expect(mockSessionService.addUserToSession).not.toHaveBeenCalled();
    });

    it('should handle session full error', async () => {
      mockRedisRateLimiter.isRateLimited.mockReturnValue({ limited: false });
      mockSessionService.addUserToSession.mockRejectedValue(new Error('Session is full'));

      await gateway.handleJoin(mockSocket, { username: 'testuser' });

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, {
        type: 'SESSION_FULL',
        message: 'Session is full',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnect', async () => {
      mockSocket.data.userId = 'test-user-id';
      const mockUser: User = {
        id: 'test-user-id',
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test123',
      };

      const mockSession = {
        id: 'test123',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([['test-user-id', mockUser]]),
        createdAt: Date.now(),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(mockSession);

      await gateway.handleDisconnect(mockSocket);

      expect(mockSessionService.removeUserFromSession).toHaveBeenCalledWith(
        'test123',
        'test-user-id',
      );
      expect(mockServer.to).toHaveBeenCalledWith('test123');
      expect(mockServer.emit).toHaveBeenCalledWith(MessageType.USER_LEFT, { user: mockUser });
    });
  });

  describe('handleContentChange', () => {
    it('should handle valid content change', async () => {
      mockSocket.data.userId = 'test-user-id';
      const mockUser: User = {
        id: 'test-user-id',
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test123',
      };

      mockSessionService.getOrCreateSession.mockResolvedValue({
        id: 'test123',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([['test-user-id', mockUser]]),
        createdAt: Date.now(),
      });

      await gateway.handleContentChange(mockSocket, { content: 'new content' });

      expect(mockSessionService.updateSessionContent).toHaveBeenCalledWith(
        'test123',
        'new content',
      );
      expect(mockSocket.to).toHaveBeenCalledWith('test123');
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
        content: 'new content',
        user: mockUser,
      });
    });
  });

  describe('handleLanguageChange', () => {
    it('should handle valid language change', async () => {
      mockSocket.data.userId = 'test-user-id';
      const mockUser: User = {
        id: 'test-user-id',
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test123',
      };

      mockSessionService.getOrCreateSession.mockResolvedValue({
        id: 'test123',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([['test-user-id', mockUser]]),
        createdAt: Date.now(),
      });

      await gateway.handleLanguageChange(mockSocket, { language: 'python' });

      expect(mockSessionService.updateSessionLanguage).toHaveBeenCalledWith(
        'test123',
        'python',
      );
      expect(mockSocket.to).toHaveBeenCalledWith('test123');
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, {
        language: 'python',
        user: mockUser,
      });
    });
  });
}); 
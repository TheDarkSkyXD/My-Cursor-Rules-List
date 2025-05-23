import { SocketService } from '../socketService';
import { MessageType, User } from '@collabx/shared';
import { Manager, Socket } from 'socket.io-client';

jest.mock('socket.io-client', () => ({
  Manager: jest.fn(),
  Socket: jest.fn(),
}));

type SocketEventHandler = (...args: unknown[]) => void;
type SocketEventTuple = [string, SocketEventHandler];

describe('Collaborative Editing', () => {
  let socketService: SocketService;
  let mockSocket: jest.Mocked<typeof Socket>;
  const mockStoreHandlers = {
    setContent: jest.fn(),
    setLanguage: jest.fn(),
    setError: jest.fn(),
    resetEditor: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
    updateCursor: jest.fn(),
    updateSelection: jest.fn(),
    resetUser: jest.fn(),
    onSessionFull: jest.fn(),
  };
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      connected: false,
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<typeof Socket>;

    (Manager as jest.Mock).mockReturnValue({
      socket: jest.fn().mockReturnValue(mockSocket),
    });
    socketService = new SocketService('test-session', 'testuser', onError, mockStoreHandlers);
  });

  const findEventHandler = (eventName: string): SocketEventHandler | undefined => {
    const eventTuple = mockSocket.on.mock.calls.find((call) => call[0] === eventName) as
      | SocketEventTuple
      | undefined;
    return eventTuple?.[1];
  };

  describe('Content Synchronization', () => {
    it('handles out-of-order content changes', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const contentChangeHandler = findEventHandler(MessageType.CONTENT_CHANGE);
      if (!contentChangeHandler) {
        throw new Error('Content change handler not found');
      }

      const user1: User = {
        id: '1',
        username: 'user1',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };

      const user2: User = {
        id: '2',
        username: 'user2',
        color: '#00ff00',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };

      // Simulate out-of-order content changes
      contentChangeHandler({ content: 'content2', user: user2 });
      contentChangeHandler({ content: 'content1', user: user1 });

      // Verify that the latest content is applied
      expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('content2');
    });

    it('handles rapid content changes from multiple users', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const contentChangeHandler = findEventHandler(MessageType.CONTENT_CHANGE);
      if (!contentChangeHandler) {
        throw new Error('Content change handler not found');
      }

      const users = [
        {
          id: '1',
          username: 'user1',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
        {
          id: '2',
          username: 'user2',
          color: '#00ff00',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
        {
          id: '3',
          username: 'user3',
          color: '#0000ff',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      ];

      // Simulate rapid content changes from multiple users
      for (let i = 0; i < 10; i++) {
        const user = users[i % users.length];
        contentChangeHandler({ content: `content${i}`, user });
      }

      // Verify that all content changes were processed
      expect(mockStoreHandlers.setContent).toHaveBeenCalledTimes(10);
    });
  });

  describe('State Recovery', () => {
    it('recovers state after connection loss', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      // Simulate connection loss
      const disconnectHandler = findEventHandler('disconnect');
      if (disconnectHandler) {
        disconnectHandler();
      }

      // Simulate reconnection
      const syncResponseHandler = findEventHandler(MessageType.SYNC_RESPONSE);
      if (!syncResponseHandler) {
        throw new Error('Sync response handler not found');
      }

      const mockUsers = [
        {
          id: '1',
          username: 'user1',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      ];

      syncResponseHandler({
        content: 'recovered content',
        language: 'javascript',
        users: mockUsers,
      });

      // Verify state recovery
      expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('recovered content');
      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith('javascript');
      expect(mockStoreHandlers.addUser).toHaveBeenCalledWith(mockUsers[0]);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid content changes gracefully', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const contentChangeHandler = findEventHandler(MessageType.CONTENT_CHANGE);
      if (!contentChangeHandler) {
        throw new Error('Content change handler not found');
      }

      // Simulate invalid content change
      contentChangeHandler({ content: null, user: null });

      // Verify error handling
      expect(onError).toHaveBeenCalled();
    });

    it('requests sync after error recovery', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const errorHandler = findEventHandler(MessageType.ERROR);
      if (!errorHandler) {
        throw new Error('Error handler not found');
      }

      // Simulate error
      errorHandler({ type: 'INVALID_PAYLOAD', message: 'Invalid content' });

      // Verify sync request
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_REQUEST);
    });
  });
});

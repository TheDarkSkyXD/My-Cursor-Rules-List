import { SocketService } from '../socketService';
import { MessageType, User } from '@collabx/shared';
import { Manager, Socket } from 'socket.io-client';

jest.mock('socket.io-client', () => ({
  Manager: jest.fn(),
  Socket: jest.fn(),
}));

type SocketEventHandler = (...args: unknown[]) => void;
type SocketEventTuple = [string, SocketEventHandler];

describe('Language Synchronization', () => {
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
    updateTypingStatus: jest.fn(),
    removeTypingStatus: jest.fn(),
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

  describe('Language Change Flow', () => {
    it('sends language change message to server', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const newLanguage = 'python';
      socketService.sendMessage(MessageType.LANGUAGE_CHANGE, {
        language: newLanguage,
        user: {
          id: '1',
          username: 'testuser',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, {
        language: newLanguage,
        user: {
          id: '1',
          username: 'testuser',
          color: '#ff0000',
          lastActive: expect.any(Number),
          sessionId: 'test-session',
        },
      });
    });

    it('updates local language state when receiving language change', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const languageChangeHandler = findEventHandler(MessageType.LANGUAGE_CHANGE);
      if (!languageChangeHandler) {
        throw new Error('Language change handler not found');
      }

      const newLanguage = 'python';
      languageChangeHandler({
        language: newLanguage,
        user: {
          id: '2',
          username: 'otheruser',
          color: '#00ff00',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });

      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith(newLanguage);
    });

    it('handles multiple rapid language changes', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const languageChangeHandler = findEventHandler(MessageType.LANGUAGE_CHANGE);
      if (!languageChangeHandler) {
        throw new Error('Language change handler not found');
      }

      const languages = ['python', 'javascript', 'typescript', 'java'];
      const user: User = {
        id: '2',
        username: 'otheruser',
        color: '#00ff00',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };

      languages.forEach((lang) => {
        languageChangeHandler({ language: lang, user });
      });

      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledTimes(languages.length);
      expect(mockStoreHandlers.setLanguage).toHaveBeenLastCalledWith(
        languages[languages.length - 1],
      );
    });

    it('recovers language state after reconnection', () => {
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

      // Simulate reconnection with sync response
      const syncResponseHandler = findEventHandler(MessageType.SYNC_RESPONSE);
      if (!syncResponseHandler) {
        throw new Error('Sync response handler not found');
      }

      const savedLanguage = 'python';
      syncResponseHandler({
        content: 'test content',
        language: savedLanguage,
        users: [],
      });

      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith(savedLanguage);
    });

    it('handles invalid language change gracefully', () => {
      socketService.connect();
      const connectHandler = findEventHandler('connect');
      if (connectHandler) {
        connectHandler();
        mockSocket.connected = true;
      }

      const languageChangeHandler = findEventHandler(MessageType.LANGUAGE_CHANGE);
      if (!languageChangeHandler) {
        throw new Error('Language change handler not found');
      }

      // Simulate invalid language change
      languageChangeHandler({ language: null, user: null });

      expect(onError).toHaveBeenCalled();
    });

    it('syncs language changes across all users in a session', () => {
      // Create two socket services to simulate multiple users
      const socketService1 = new SocketService('test-session', 'user1', onError, mockStoreHandlers);
      const mockStoreHandlers2 = {
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
        updateTypingStatus: jest.fn(),
        removeTypingStatus: jest.fn(),
      };
      const socketService2 = new SocketService(
        'test-session',
        'user2',
        onError,
        mockStoreHandlers2,
      );

      // Create mock sockets for both services
      const mockSocket1 = {
        on: jest.fn(),
        emit: jest.fn(),
        connected: false,
        disconnect: jest.fn(),
      } as unknown as jest.Mocked<typeof Socket>;

      const mockSocket2 = {
        on: jest.fn(),
        emit: jest.fn(),
        connected: false,
        disconnect: jest.fn(),
      } as unknown as jest.Mocked<typeof Socket>;

      // Mock Manager for both services
      (Manager as jest.Mock).mockImplementation((url, options) => ({
        socket: jest.fn().mockImplementation((namespace) => {
          if (options.query.username === 'user1') {
            return mockSocket1;
          } else {
            return mockSocket2;
          }
        }),
      }));

      // Connect both services
      socketService1.connect();
      socketService2.connect();

      // Simulate successful connection for both
      const connectHandler1 = mockSocket1.on.mock.calls.find((call) => call[0] === 'connect')?.[1];

      const connectHandler2 = mockSocket2.on.mock.calls.find((call) => call[0] === 'connect')?.[1];

      if (connectHandler1) {
        connectHandler1();
        mockSocket1.connected = true;
      }

      if (connectHandler2) {
        connectHandler2();
        mockSocket2.connected = true;
      }

      // User1 changes the language
      const newLanguage = 'python';
      socketService1.sendMessage(MessageType.LANGUAGE_CHANGE, {
        language: newLanguage,
        user: {
          id: '1',
          username: 'user1',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });

      // Find the language change handler for user2
      const languageChangeHandler2 = mockSocket2.on.mock.calls.find(
        (call) => call[0] === MessageType.LANGUAGE_CHANGE,
      )?.[1];

      if (languageChangeHandler2) {
        // Simulate the language change event being received by user2
        languageChangeHandler2({
          language: newLanguage,
          user: {
            id: '1',
            username: 'user1',
            color: '#ff0000',
            lastActive: Date.now(),
            sessionId: 'test-session',
          },
        });

        // Verify that user2's language was updated
        expect(mockStoreHandlers2.setLanguage).toHaveBeenCalledWith(newLanguage);
      } else {
        throw new Error('Language change handler not found for user2');
      }
    });
  });
});

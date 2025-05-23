import { SocketService } from '../socketService';
import { MessageType, User } from '@collabx/shared';
import { StoreHandlers } from '../types';
import { expect } from '@jest/globals';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  Manager: jest.fn().mockImplementation(() => ({
    socket: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn().mockImplementation(() => true),
      connect: jest.fn(),
      disconnect: jest.fn().mockImplementation(function(this: any) {
        // Clean up event listeners
        this.on.mock.calls.forEach(([event, handler]: [string, Function]) => {
          this.removeAllListeners(event);
        });
        this.connected = false;
      }),
      connected: false,
      removeAllListeners: jest.fn(),
    }),
    removeAllListeners: jest.fn(),
  })),
}));

describe('SocketService Performance', () => {
  let socketService: SocketService;
  let mockOnError: jest.Mock;
  let mockStoreHandlers: StoreHandlers;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnError = jest.fn();
    mockStoreHandlers = {
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
    socketService = new SocketService('test-session', 'testuser', mockOnError, mockStoreHandlers);
  });

  afterEach(() => {
    socketService.disconnect();
    jest.clearAllMocks();
  });

  describe('Connection Performance', () => {
    it('should establish connection within acceptable time', async () => {
      const startTime = performance.now();
      socketService.connect();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Connection setup should take less than 100ms
    });

    it('should handle rapid connect/disconnect cycles efficiently', () => {
      const cycles = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < cycles; i++) {
        socketService.connect();
        socketService.disconnect();
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / cycles;
      
      expect(averageTime).toBeLessThan(10); // Each cycle should take less than 10ms on average
    });
  });

  describe('Message Handling Performance', () => {
    it('should handle high-frequency content changes efficiently', () => {
      socketService.connect();
      const socket = socketService['socket'];
      socket.connected = true;
      
      const changes = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < changes; i++) {
        socketService.sendMessage(MessageType.CONTENT_CHANGE, {
          content: `test content ${i}`,
          user: {
            id: '1',
            username: 'testuser',
            color: '#ff0000',
            lastActive: Date.now(),
            sessionId: 'test-session',
          },
        });
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / changes;
      
      expect(averageTime).toBeLessThan(1); // Each message should be processed in less than 1ms
    });
  });

  describe('Memory Usage', () => {
    it('should clean up resources properly after disconnect', () => {
      socketService.connect();
      const socket = socketService['socket'];
      socket.connected = true;
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate heavy usage with message sending
      for (let i = 0; i < 1000; i++) {
        socketService.sendMessage(MessageType.CONTENT_CHANGE, {
          content: `test content ${i}`,
          user: {
            id: '1',
            username: 'testuser',
            color: '#ff0000',
            lastActive: Date.now(),
            sessionId: 'test-session',
          },
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      socketService.disconnect();
      const finalMemory = process.memoryUsage().heapUsed;
      
      // Memory difference should be minimal after cleanup
      expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // Less than 1MB difference
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover from errors quickly', () => {
      socketService.connect();
      const startTime = performance.now();
      
      // Simulate error and recovery
      socketService['handleError']({ type: 'SYNC_ERROR', message: 'Test error' });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Error recovery should be fast
    });
  });
}); 
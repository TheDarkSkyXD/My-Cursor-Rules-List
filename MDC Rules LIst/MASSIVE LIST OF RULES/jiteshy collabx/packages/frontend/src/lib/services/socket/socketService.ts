import { Manager } from 'socket.io-client';
import { MessageType, User, UserTypingStatus } from '@collabx/shared';
import type {
  SocketPayloads,
  SocketEvents,
  StoreHandlers,
  SocketConnectionState,
  SocketError,
  ErrorRecoveryOptions,
} from './types';
import { NotificationService } from '../notification/notificationService';

const DEFAULT_ERROR_RECOVERY_OPTIONS: ErrorRecoveryOptions = {
  maxRetries: 5,
  retryDelay: 1000,
  backoffFactor: 2,
  maxRetryDelay: 5000,
};

/**
 * Service for managing WebSocket connections and handling real-time communication.
 * Provides methods for connecting, disconnecting, and sending/receiving messages.
 */
export class SocketService {
  private socket: ReturnType<typeof Manager.prototype.socket> | null = null;
  private manager: ReturnType<typeof Manager> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionState: SocketConnectionState = {
    reconnectAttempts: 0,
    maxReconnectAttempts: DEFAULT_ERROR_RECOVERY_OPTIONS.maxRetries,
    isInitialConnection: true,
    isConnecting: false,
    isDisconnecting: false,
  };

  /**
   * Creates a new SocketService instance.
   * @param sessionId - Unique identifier for the collaborative session
   * @param username - Display name of the current user
   * @param onError - Callback function for handling connection errors
   * @param storeHandlers - Object containing handlers for updating application state
   */
  constructor(
    private sessionId: string,
    private username: string,
    private onError: (message: string) => void,
    private storeHandlers: StoreHandlers,
    private errorRecoveryOptions: ErrorRecoveryOptions = DEFAULT_ERROR_RECOVERY_OPTIONS,
  ) {}

  /**
   * Establishes WebSocket connection with the server.
   * Configures connection options and sets up event listeners.
   */
  connect(): void {
    if (
      this.socket?.connected ||
      this.connectionState.isConnecting ||
      this.connectionState.isDisconnecting
    ) {
      return;
    }

    this.connectionState.isConnecting = true;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }

      this.manager = new Manager(wsUrl, {
        path: '/api/ws',
        query: {
          sessionId: this.sessionId,
          username: this.username,
        },
        reconnection: false,
        timeout: 20000,
        autoConnect: true,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      this.socket = this.manager.socket('/');
      this.setupEventListeners();
    } catch (error) {
      this.handleConnectionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Closes the WebSocket connection and cleans up resources.
   */
  disconnect(): void {
    if (this.connectionState.isDisconnecting) {
      return;
    }

    this.connectionState.isDisconnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.manager) {
      this.manager.removeAllListeners();
      this.manager = null;
    }

    this.connectionState = {
      ...this.connectionState,
      reconnectAttempts: 0,
      isConnecting: false,
      isDisconnecting: false,
    };
  }

  /**
   * Sends a message to the server.
   * @param type - Type of the message (event name)
   * @param payload - Data to be sent with the message
   */
  sendMessage<T extends MessageType>(type: T, payload: SocketPayloads[T]): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit(type, payload);
  }

  /**
   * Sets up event listeners for various WebSocket events.
   * Handles connection, disconnection, and message events.
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    const events: SocketEvents = {
      [MessageType.JOIN]: this.handleJoin.bind(this),
      [MessageType.LEAVE]: this.handleLeave.bind(this),
      [MessageType.CONTENT_CHANGE]: this.handleContentChange.bind(this),
      [MessageType.LANGUAGE_CHANGE]: this.handleLanguageChange.bind(this),
      [MessageType.USER_JOINED]: this.handleUserJoined.bind(this),
      [MessageType.USER_LEFT]: this.handleUserLeft.bind(this),
      [MessageType.CURSOR_MOVE]: this.handleCursorMove.bind(this),
      [MessageType.SELECTION_CHANGE]: this.handleSelectionChange.bind(this),
      [MessageType.ERROR]: this.handleError.bind(this),
      [MessageType.UNDO_REDO_STACK]: this.handleUndoRedoStack.bind(this),
      [MessageType.UNDO]: this.handleUndo.bind(this),
      [MessageType.REDO]: this.handleRedo.bind(this),
      [MessageType.SYNC_RESPONSE]: this.handleSyncResponse.bind(this),
      [MessageType.SYNC_REQUEST]: this.handleSyncRequest.bind(this),
      [MessageType.TYPING_STATUS]: this.handleTypingStatus.bind(this),
    };

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', () => {
      this.handleDisconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      this.handleConnectError(error);
    });

    this.socket.on('error', (error: Error) => {
      this.handleError(error);
    });

    Object.entries(events).forEach(([event, handler]) => {
      this.socket?.on(event, (data: unknown) => {
        handler(data as never);
      });
    });
  }

  /**
   * Handles successful connection to the WebSocket server.
   * Logs connection details and updates connection state.
   */
  private handleConnect(): void {
    this.connectionState.isConnecting = false;
    this.connectionState.reconnectAttempts = 0;
    this.connectionState.lastSuccessfulConnection = new Date();
    this.connectionState.lastError = undefined;

    // If we were reconnecting, show success notification
    if (!this.connectionState.isInitialConnection) {
      NotificationService.showReconnectionSuccess();
    }

    if (this.connectionState.isInitialConnection) {
      if (!this.socket?.connected) {
        return;
      }
      const joinPayload = { username: this.username };
      this.socket.emit(MessageType.JOIN, joinPayload, (response: unknown) => {
        if (response && typeof response === 'object' && 'user' in response) {
          this.handleJoin(response as { user: User });
        }
      });
      this.connectionState.isInitialConnection = false;
    } else {
      this.socket?.emit(MessageType.SYNC_REQUEST);
    }
  }

  /**
   * Handles WebSocket connection errors.
   * Logs error details and calls error callback.
   * @param error - Error object containing connection failure details
   */
  private handleConnectError(error: Error): void {
    this.handleConnectionError(error);
  }

  /**
   * Handles disconnection from the WebSocket server.
   * Logs disconnection details and updates connection state.
   */
  private handleDisconnect(): void {
    this.connectionState.isConnecting = false;

    if (
      !this.connectionState.isDisconnecting &&
      this.connectionState.reconnectAttempts < this.connectionState.maxReconnectAttempts
    ) {
      const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 5000);

      this.reconnectTimeout = setTimeout(() => {
        this.connectionState.reconnectAttempts++;
        this.connect();
      }, delay);
    } else if (!this.connectionState.isDisconnecting) {
      this.onError('Failed to connect to server. Please refresh the page.');
      this.disconnect();
    }
  }

  /**
   * Handles general connection errors.
   * Logs error details and calls error callback.
   * @param error - Error object containing connection failure details
   */
  private handleConnectionError(error: Error): void {
    const socketError: SocketError = {
      type: 'CONNECTION_ERROR',
      message: error.message,
      details: error,
    };

    this.connectionState.lastError = socketError;
    this.connectionState.isConnecting = false;

    this.onError(`Connection error: ${error.message}`);
    this.attemptErrorRecovery();
  }

  private attemptErrorRecovery(): void {
    if (this.connectionState.reconnectAttempts >= this.errorRecoveryOptions.maxRetries) {
      this.handleMaxRetriesExceeded();
      return;
    }

    const delay = this.calculateRetryDelay();
    console.log(`Reconnection attempt ${this.connectionState.reconnectAttempts + 1} of ${this.errorRecoveryOptions.maxRetries} in ${delay}ms`);
    
    // Show reconnecting notification
    NotificationService.showReconnecting(
      this.connectionState.reconnectAttempts + 1,
      this.errorRecoveryOptions.maxRetries
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connectionState.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private calculateRetryDelay(): number {
    const { retryDelay, backoffFactor, maxRetryDelay } = this.errorRecoveryOptions;
    const delay = Math.min(
      retryDelay * Math.pow(backoffFactor, this.connectionState.reconnectAttempts),
      maxRetryDelay,
    );
    return delay;
  }

  private handleMaxRetriesExceeded(): void {
    const error: SocketError = {
      type: 'CONNECTION_ERROR',
      message: 'Maximum reconnection attempts exceeded',
      details: this.connectionState.lastError,
    };

    NotificationService.showReconnectionFailed();
    this.onError(
      'Connection to server lost. Please check your internet connection and refresh the page.',
    );
    this.disconnect();
  }

  private handleError(error: any): void {
    this.connectionState.lastError = error;
    this.connectionState.isConnecting = false;

    const socketError: SocketError = {
      type: error.type || 'CONNECTION_ERROR',
      message: error.message,
      details: error,
    };

    this.connectionState.lastError = socketError;

    if (error.type === 'SESSION_FULL') {
      this.storeHandlers.onSessionFull();
      return;
    } else if (error.type === 'DUPLICATE_USERNAME') {
      const message = 'Username is already taken. Please choose a different username.';
      this.onError(message);
      this.storeHandlers.setError(message);
    } else if (error.type === 'SYNC_ERROR') {
      this.handleSyncError();
    } else if (error.type === 'INVALID_PAYLOAD') {
      this.handleInvalidPayloadError();
    } else {
      this.onError(error.message);
      this.storeHandlers.setError(error.message);
    }

    this.attemptErrorRecovery();
  }

  private handleSyncError(): void {
    console.warn('Sync error occurred, requesting full sync');
    this.socket?.emit(MessageType.SYNC_REQUEST);
  }

  private handleInvalidPayloadError(): void {
    console.warn('Invalid payload received, requesting state refresh');
    this.socket?.emit(MessageType.SYNC_REQUEST);
  }

  private handleSyncResponse(payload: SocketPayloads[MessageType.SYNC_RESPONSE]): void {
    if (!payload) {
      this.onError('Invalid sync response received');
      return;
    }

    if (this.connectionState.isInitialConnection) {
      this.storeHandlers.resetEditor();
      this.storeHandlers.resetUser();
      this.connectionState.isInitialConnection = false;
    }

    if (typeof payload.content === 'string') {
      this.storeHandlers.setContent(payload.content);
    }
    if (typeof payload.language === 'string') {
      this.storeHandlers.setLanguage(payload.language);
    }

    if (Array.isArray(payload.users)) {
      this.storeHandlers.resetUser();
      
      payload.users.forEach((user) => {
        if (user && typeof user.id === 'string' && typeof user.username === 'string') {
          this.storeHandlers.addUser(user);
        }
      });
    }
  }

  private handleUserJoined(payload: SocketPayloads[MessageType.USER_JOINED]): void {
    if (!payload || !payload.user || !payload.user.id || !payload.user.username) {
      console.warn('Invalid user joined payload:', payload);
      return;
    }
    this.storeHandlers.addUser(payload.user);
    NotificationService.showUserJoined(payload.user.username, this.username);
  }

  private handleUserLeft(payload: SocketPayloads[MessageType.USER_LEFT]): void {
    if (!payload || !payload.user || !payload.user.id || !payload.user.username) {
      console.warn('Invalid user left payload:', payload);
      return;
    }

    // Remove the user from the store
    this.storeHandlers.removeUser(payload.user.id);
    
    // Show notification
    NotificationService.showUserLeft(payload.user.username, this.username);
  }

  private handleTypingStatus(payload: SocketPayloads[MessageType.TYPING_STATUS]): void {
    if (!payload || !payload.user || !payload.user.id) {
      console.warn('Invalid typing status payload:', payload);
      return;
    }

    const typingStatus: UserTypingStatus = {
      user: payload.user,
      isTyping: payload.isTyping,
      lastTyped: Date.now()
    };

    this.storeHandlers.updateTypingStatus(payload.user.id, typingStatus);
  }

  private handleContentChange(payload: SocketPayloads[MessageType.CONTENT_CHANGE]): void {
    if (!payload || !payload.content) {
      console.warn('Invalid content change payload:', payload);
      this.onError('Invalid content change payload received');
      return;
    }
    this.storeHandlers.setContent(payload.content);
  }

  private handleLanguageChange(payload: SocketPayloads[MessageType.LANGUAGE_CHANGE]): void {
    if (!payload || !payload.language) {
      console.warn('Invalid language change payload:', payload);
      this.onError('Invalid language change payload received');
      return;
    }
    this.storeHandlers.setLanguage(payload.language);
  }

  private handleCursorMove(payload: SocketPayloads[MessageType.CURSOR_MOVE]): void {
    if (
      !payload ||
      !payload.user ||
      !payload.user.id ||
      !payload.position ||
      !payload.position.top ||
      !payload.position.left
    ) {
      console.warn('Invalid cursor move payload:', payload);
      return;
    }
    this.storeHandlers.updateCursor(payload);
  }

  private handleSelectionChange(payload: SocketPayloads[MessageType.SELECTION_CHANGE]): void {
    if (
      !payload ||
      !payload.user ||
      !payload.user.id ||
      !payload.selection ||
      typeof payload.selection.start !== 'number' ||
      typeof payload.selection.end !== 'number'
    ) {
      console.warn('Invalid selection change payload:', payload);
      return;
    }
    this.storeHandlers.updateSelection(payload);
  }

  private handleJoin(payload: SocketPayloads[MessageType.JOIN]): void {
    if (payload?.user && payload.user.id && payload.user.username) {
      this.storeHandlers.addUser(payload.user);
      NotificationService.showUserJoined(payload.user.username, this.username);
      this.connectionState.isInitialConnection = false;
    }
  }

  private handleLeave(): void {
    // Implementation for leave event
  }

  private handleUndoRedoStack(): void {
    // Implementation for undo/redo stack event
  }

  private handleUndo(): void {
    // Implementation for undo event
  }

  private handleRedo(): void {
    // Implementation for redo event
  }

  private handleSyncRequest(): void {
    // Implementation for sync request event
  }
}

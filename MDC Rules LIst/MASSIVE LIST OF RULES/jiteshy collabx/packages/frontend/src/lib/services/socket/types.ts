import { User, UserCursor, UserSelection, MessageType, UserTypingStatus } from '@collabx/shared';

export interface SocketPayloads {
  [MessageType.JOIN]: { user: User };
  [MessageType.LEAVE]: never;
  [MessageType.CONTENT_CHANGE]: { content: string; user: User };
  [MessageType.LANGUAGE_CHANGE]: { language: string; user: User };
  [MessageType.USER_JOINED]: { user: User };
  [MessageType.USER_LEFT]: { user: User };
  [MessageType.CURSOR_MOVE]: { position: { top: number; left: number }; user: User };
  [MessageType.SELECTION_CHANGE]: { selection: { start: number; end: number }; user: User };
  [MessageType.ERROR]: {
    type: SocketErrorType;
    message: string;
    details?: unknown;
  };
  [MessageType.UNDO_REDO_STACK]: never;
  [MessageType.UNDO]: never;
  [MessageType.REDO]: never;
  [MessageType.SYNC_RESPONSE]: { content: string; language: string; users: User[] };
  [MessageType.SYNC_REQUEST]: never;
  [MessageType.TYPING_STATUS]: { user: User; isTyping: boolean };
}

export type SocketEvents = {
  [MessageType.JOIN]: (payload: SocketPayloads[MessageType.JOIN]) => void;
  [MessageType.LEAVE]: (payload: SocketPayloads[MessageType.LEAVE]) => void;
  [MessageType.CONTENT_CHANGE]: (payload: SocketPayloads[MessageType.CONTENT_CHANGE]) => void;
  [MessageType.LANGUAGE_CHANGE]: (payload: SocketPayloads[MessageType.LANGUAGE_CHANGE]) => void;
  [MessageType.USER_JOINED]: (payload: SocketPayloads[MessageType.USER_JOINED]) => void;
  [MessageType.USER_LEFT]: (payload: SocketPayloads[MessageType.USER_LEFT]) => void;
  [MessageType.CURSOR_MOVE]: (payload: SocketPayloads[MessageType.CURSOR_MOVE]) => void;
  [MessageType.SELECTION_CHANGE]: (payload: SocketPayloads[MessageType.SELECTION_CHANGE]) => void;
  [MessageType.ERROR]: (payload: SocketPayloads[MessageType.ERROR]) => void;
  [MessageType.UNDO_REDO_STACK]: (payload: SocketPayloads[MessageType.UNDO_REDO_STACK]) => void;
  [MessageType.UNDO]: (payload: SocketPayloads[MessageType.UNDO]) => void;
  [MessageType.REDO]: (payload: SocketPayloads[MessageType.REDO]) => void;
  [MessageType.SYNC_RESPONSE]: (payload: SocketPayloads[MessageType.SYNC_RESPONSE]) => void;
  [MessageType.SYNC_REQUEST]: (payload: SocketPayloads[MessageType.SYNC_REQUEST]) => void;
  [MessageType.TYPING_STATUS]: (payload: SocketPayloads[MessageType.TYPING_STATUS]) => void;
};

/**
 * Handlers for updating application state based on WebSocket events.
 */
export interface StoreHandlers {
  /** Updates the editor content */
  setContent: (content: string) => void;
  /** Updates the editor language */
  setLanguage: (language: string) => void;
  /** Sets an error message */
  setError: (error: string) => void;
  /** Resets the editor state */
  resetEditor: () => void;
  /** Adds a user to the session */
  addUser: (user: User) => void;
  /** Removes a user from the session */
  removeUser: (userId: string) => void;
  /** Updates a user's cursor position */
  updateCursor: (cursor: UserCursor) => void;
  /** Updates a user's text selection */
  updateSelection: (selection: UserSelection) => void;
  /** Resets the user state */
  resetUser: () => void;
  /** Handles session full event */
  onSessionFull: () => void;
  /** Updates a user's typing status */
  updateTypingStatus: (userId: string, status: UserTypingStatus) => void;
  /** Removes a user's typing status */
  removeTypingStatus: (userId: string) => void;
}

export type SocketErrorType =
  | 'SESSION_FULL'
  | 'DUPLICATE_USERNAME'
  | 'CONNECTION_ERROR'
  | 'SYNC_ERROR'
  | 'INVALID_PAYLOAD'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR';

export interface SocketError {
  type: SocketErrorType;
  message: string;
  code?: number;
  details?: unknown;
}

/**
 * Configuration options for error recovery and reconnection attempts.
 */
export interface ErrorRecoveryOptions {
  /** Maximum number of reconnection attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  retryDelay: number;
  /** Factor by which retry delay increases */
  backoffFactor: number;
  /** Maximum delay between retries in milliseconds */
  maxRetryDelay: number;
}

/**
 * Represents the current state of a WebSocket connection.
 */
export interface SocketConnectionState {
  /** Number of reconnection attempts made */
  reconnectAttempts: number;
  /** Maximum number of reconnection attempts allowed */
  maxReconnectAttempts: number;
  /** Whether this is the initial connection */
  isInitialConnection: boolean;
  /** Whether the socket is currently connecting */
  isConnecting: boolean;
  /** Whether the socket is currently disconnecting */
  isDisconnecting: boolean;
  /** Timestamp of the last successful connection */
  lastSuccessfulConnection?: Date;
  /** Last error that occurred */
  lastError?: SocketError;
}

/**
 * Enumeration of all WebSocket message types used in the application.
 */
export enum MessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  CONTENT_CHANGE = 'content_change',
  LANGUAGE_CHANGE = 'language_change',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  ERROR = 'error',
  UNDO_REDO_STACK = 'undo_redo_stack',
  UNDO = 'undo',
  REDO = 'redo',
  SYNC_RESPONSE = 'sync_response',
  SYNC_REQUEST = 'sync_request',
  TYPING_STATUS = 'typing_status',
}

/**
 * Represents a user in a collaborative session.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Display name of the user */
  username: string;
  /** Color assigned to the user for visual distinction */
  color: string;
  /** Timestamp of the user's last activity */
  lastActive: number;
  /** ID of the session the user is in */
  sessionId: string;
}

/**
 * Represents a user's cursor position in the editor.
 */
export interface UserCursor {
  /** Cursor position coordinates */
  position: {
    /** Vertical position from the top */
    top: number;
    /** Horizontal position from the left */
    left: number;
  };
  /** User who owns the cursor */
  user: User;
}

/**
 * Represents a user's text selection in the editor.
 */
export interface UserSelection {
  /** Selection range in the editor */
  selection: {
    /** Starting position of the selection */
    start: number;
    /** Ending position of the selection */
    end: number;
  };
  /** User who owns the selection */
  user: User;
}

/**
 * Represents a collaborative editing session.
 */
export interface Session {
  /** Unique identifier for the session */
  id: string;
  /** Current content of the editor */
  content: string;
  /** Programming language of the editor */
  language: string;
  /** Map of users in the session */
  users: Map<string, User>;
  /** Timestamp of the session's last activity */
  lastActive: number;
  /** Timestamp when the session was created */
  createdAt: number;
}

/**
 * Types of errors that can occur in WebSocket communication.
 */
export type SocketErrorType =
  | 'SESSION_FULL'
  | 'DUPLICATE_USERNAME'
  | 'CONNECTION_ERROR'
  | 'SYNC_ERROR'
  | 'INVALID_PAYLOAD'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR';

/**
 * Represents a WebSocket error response.
 */
export interface SocketError {
  /** Type of the error */
  type: SocketErrorType;
  /** Human-readable error message */
  message: string;
  /** Optional error code */
  code?: number;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Configuration for rate limiting.
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Error message to display when limit is exceeded */
  message: string;
}

/**
 * Current state of rate limiting for a client.
 */
export interface RateLimitState {
  /** Current request count */
  count: number;
  /** Timestamp when the rate limit will reset */
  resetTime: number;
}

/**
 * Represents an error message with type.
 */
export interface ErrorMessage {
  /** Error message text */
  message: string;
  /** Type of error */
  type: string;
}

/**
 * Represents a user's typing status in the editor.
 */
export interface UserTypingStatus {
  /** User who is typing */
  user: User;
  /** Whether the user is currently typing */
  isTyping: boolean;
  /** Timestamp of the last typing activity */
  lastTyped: number;
}
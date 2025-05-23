export interface ContentChangeMessage {
  content: string;
  sessionId: string;
}

/**
 * Represents a cursor movement message in the editor.
 */
export interface CursorMoveMessage {
  /** New cursor position */
  position: number;
  /** ID of the session */
  sessionId: string;
  /** ID of the user moving the cursor */
  userId: string;
}

export interface SelectionChangeMessage {
  selection: {
    start: number;
    end: number;
  };
  sessionId: string;
  userId: string;
}

export interface LanguageChangeMessage {
  language: string;
  sessionId: string;
}

/**
 * Represents a user joining a session.
 */
export interface JoinMessage {
  /** Username of the joining user */
  username: string;
  /** ID of the session to join */
  sessionId: string;
}

/**
 * Represents a user leaving a session.
 */
export interface LeaveMessage {
  /** ID of the session */
  sessionId: string;
  /** ID of the leaving user */
  userId: string;
}

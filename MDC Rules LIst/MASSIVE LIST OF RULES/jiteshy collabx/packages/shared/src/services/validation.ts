import { MessageType, SocketError, SocketErrorType } from '../types';

/**
 * Service for validating WebSocket messages and session data.
 * Provides methods for validating session IDs, session links, and event payloads.
 */
export class ValidationService {
  /**
   * Validates a session ID format.
   * Session IDs must be alphanumeric strings.
   * @param sessionId - The session ID to validate
   * @returns SocketError object if validation fails, null otherwise
   */
  static validateSessionId(sessionId: string): SocketError | null {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session ID',
      };
    }

    // Validate session ID format (alphanumeric only)
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(sessionId)) {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Session ID must contain only letters and numbers',
      };
    }

    return null;
  }

  /**
   * Validates a session link format.
   * Session links must be valid URLs with alphanumeric session IDs.
   * @param sessionLink - The session link to validate
   * @returns SocketError object if validation fails, null otherwise
   */
  static validateSessionLink(sessionLink: string): SocketError | null {
    if (!sessionLink || typeof sessionLink !== 'string') {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session link',
      };
    }

    try {
      const url = new URL(sessionLink);
      const sessionId = url.pathname.slice(1); // Remove leading slash
      return this.validateSessionId(sessionId);
    } catch {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session link format',
      };
    }
  }

  static validateUsername(username: string): SocketError | null {
    if (!username || typeof username !== 'string') {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid username',
      };
    }
    if (username.length < 3 || username.length > 20) {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Username must be between 3 and 20 characters',
      };
    }
    return null;
  }

  /**
   * Validates event payload based on message type.
   * Ensures payload structure matches expected format for each event type.
   * @param type - The type of message being validated
   * @param payload - The payload to validate
   * @returns SocketError object if validation fails, null otherwise
   */
  static validateEventPayload(type: MessageType, payload: unknown): SocketError | null {
    switch (type) {
      case MessageType.JOIN:
        if (!payload || typeof payload !== 'object' || !('username' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid join payload',
          };
        }
        return this.validateUsername((payload as { username: string }).username);

      case MessageType.CONTENT_CHANGE:
        if (!payload || typeof payload !== 'object' || !('content' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid content change payload',
          };
        }
        if (typeof (payload as { content: string }).content !== 'string') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Content must be a string',
          };
        }
        return null;

      case MessageType.LANGUAGE_CHANGE:
        if (!payload || typeof payload !== 'object' || !('language' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid language change payload',
          };
        }
        if (typeof (payload as { language: string }).language !== 'string') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Language must be a string',
          };
        }
        return null;

      case MessageType.CURSOR_MOVE:
        if (!payload || typeof payload !== 'object' || !('position' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid cursor move payload',
          };
        }
        const position = (payload as { position: { top: number; left: number } }).position;
        if (!position || typeof position.top !== 'number' || typeof position.left !== 'number') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid cursor position',
          };
        }
        return null;

      case MessageType.SELECTION_CHANGE:
        if (!payload || typeof payload !== 'object' || !('selection' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid selection change payload',
          };
        }
        const selection = (payload as { selection: { start: number; end: number } }).selection;
        if (!selection || typeof selection.start !== 'number' || typeof selection.end !== 'number') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid selection range',
          };
        }
        return null;

      case MessageType.TYPING_STATUS:
        if (!payload || typeof payload !== 'object' || !('isTyping' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid typing status payload',
          };
        }
        if (typeof (payload as { isTyping: boolean }).isTyping !== 'boolean') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'isTyping must be a boolean',
          };
        }
        return null;

      default:
        return null;
    }
  }

  static generateValidSessionId(length: number = 8): string {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
    }
    return result;
  }
} 
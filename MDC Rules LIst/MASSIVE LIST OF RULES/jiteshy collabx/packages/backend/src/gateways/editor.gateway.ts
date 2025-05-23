import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageType, User, ValidationService } from '@collabx/shared';
import { SessionService } from '../services/session.service';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { RedisRateLimiter } from '../rate-limit/redis-rate-limiter';

/**
 * WebSocket gateway for handling real-time collaborative editing functionality.
 * Manages user connections, session state, and event handling for the editor.
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  path: '/api/ws',
  serveClient: false,
  transports: ['polling', 'websocket'],
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: true,
  allowEIO3: true,
  namespace: '/',
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,
})
export class EditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rateLimiter: RedisRateLimiter;

  constructor(
    private configService: ConfigService,
    private sessionService: SessionService,
    private redisRateLimiter: RedisRateLimiter
  ) {
    this.rateLimiter = redisRateLimiter;
  }

  /**
   * Handles new WebSocket connections.
   * Validates session ID and initializes user session.
   * @param client - The WebSocket client connection
   */
  async handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    if (!sessionId) {
      client.emit(MessageType.ERROR, { message: 'Session ID is required' });
      client.disconnect();
      return;
    }

    const validationError = ValidationService.validateSessionId(sessionId);
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      client.disconnect();
      return;
    }

    try {
      const session = await this.sessionService.getOrCreateSession(sessionId);
      client.join(sessionId);

      const response = {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      };
      client.emit(MessageType.SYNC_RESPONSE, response);
    } catch (error) {
      console.error('Error handling connection:', error);
      client.emit(MessageType.ERROR, { message: 'Failed to join session' });
      client.disconnect();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * Removes user from session and notifies other users.
   * @param client - The WebSocket client connection
   */
  async handleDisconnect(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const userId = client.data.userId;

    if (userId && sessionId) {
      try {
        const session = await this.sessionService.getOrCreateSession(sessionId);
        const user = session.users.get(userId);

        if (user) {
          await this.sessionService.removeUserFromSession(sessionId, userId);
          this.server.to(sessionId).emit(MessageType.USER_LEFT, { user });
          
          const updatedSession = await this.sessionService.getOrCreateSession(sessionId);
          const updatedUsers = Array.from(updatedSession.users.values());
          this.server.to(sessionId).emit(MessageType.SYNC_RESPONSE, {
            content: updatedSession.content,
            language: updatedSession.language,
            users: updatedUsers
          });
        }
        
        // Clear rate limits for this user
        await this.rateLimiter.clear(client);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  }

  /**
   * Handles user join requests.
   * Validates request, checks rate limits, and adds user to session.
   * @param client - The WebSocket client connection
   * @param payload - Join request payload containing username
   * @param callback - Optional callback function for response
   */
  @SubscribeMessage(MessageType.JOIN)
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { username: string },
    callback?: (response: { user: User }) => void,
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    if (!sessionId) {
      client.emit(MessageType.ERROR, { message: 'Session ID is required' });
      return;
    }

    const validationError = ValidationService.validateEventPayload(
      MessageType.JOIN,
      payload,
    );
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.JOIN,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || 'Too many join attempts. Please try again later.',
      });
      return;
    }

    try {
      const user = await this.sessionService.addUserToSession(sessionId, payload.username);
      client.data.userId = user.id;

      client.emit(MessageType.JOIN, { user });
      if (typeof callback === 'function') {
        callback({ user });
      }

      client.to(sessionId).emit(MessageType.USER_JOINED, { user });

      const session = await this.sessionService.getOrCreateSession(sessionId);
      this.server.to(sessionId).emit(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      });
    } catch (error) {
      console.error('Error handling join:', error);
      client.emit(MessageType.ERROR, {
        type: error.message === 'Session is full' ? 'SESSION_FULL' : 'JOIN_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Updates the user's last activity timestamp to prevent inactivity cleanup
   * @param client - The WebSocket client connection
   */
  private async updateUserActivity(client: Socket): Promise<void> {
    try {
      const sessionId = client.handshake.query.sessionId as string;
      const userId = client.data.userId;
      
      if (sessionId && userId) {
        const session = await this.sessionService.getOrCreateSession(sessionId);
        const user = session.users.get(userId);
        
        if (user) {
          user.lastActive = Date.now();
          session.lastActive = Date.now();
          await this.sessionService.updateUser(sessionId, userId, user);
        }
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  /**
   * Handles editor content changes.
   * Broadcasts changes to all users in the session.
   * @param client - The WebSocket client connection
   * @param payload - Content change payload
   */
  @SubscribeMessage(MessageType.CONTENT_CHANGE)
  async handleContentChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(
      MessageType.CONTENT_CHANGE,
      payload,
    );

    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.CONTENT_CHANGE,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      await this.sessionService.updateSessionContent(sessionId, payload.content);
      const user = await this.getUserFromSocket(client);
      if (user) {
        client.to(sessionId).emit(MessageType.CONTENT_CHANGE, {
          content: payload.content,
          user,
        });
      }
    } catch (error) {
      console.error('Error handling content change:', error);
    }
  }

  /**
   * Handles editor language changes.
   * Broadcasts language changes to all users in the session.
   * @param client - The WebSocket client connection
   * @param payload - Language change payload
   */
  @SubscribeMessage(MessageType.LANGUAGE_CHANGE)
  async handleLanguageChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(
      MessageType.LANGUAGE_CHANGE,
      payload,
    );

    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.LANGUAGE_CHANGE,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      await this.sessionService.updateSessionLanguage(sessionId, payload.language);
      const user = await this.getUserFromSocket(client);
      if (user) {
        client.to(sessionId).emit(MessageType.LANGUAGE_CHANGE, {
          language: payload.language,
          user,
        });
      }
    } catch (error) {
      console.error('Error handling language change:', error);
    }
  }

  /**
   * Handles cursor position updates.
   * Broadcasts cursor position to other users in the session.
   * @param client - The WebSocket client connection
   * @param payload - Cursor position payload
   */
  @SubscribeMessage(MessageType.CURSOR_MOVE)
  async handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { position: { top: number; left: number } },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(
      MessageType.CURSOR_MOVE,
      payload,
    );

    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.CURSOR_MOVE,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      const user = await this.getUserFromSocket(client);
      if (user) {
        client.to(sessionId).emit(MessageType.CURSOR_MOVE, {
          position: payload.position,
          user,
        });
      }
    } catch (error) {
      console.error('Error handling cursor move:', error);
    }
  }

  /**
   * Handles text selection updates.
   * Broadcasts selection changes to other users in the session.
   * @param client - The WebSocket client connection
   * @param payload - Selection change payload
   */
  @SubscribeMessage(MessageType.SELECTION_CHANGE)
  async handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { selection: { start: number; end: number } },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(
      MessageType.SELECTION_CHANGE,
      payload,
    );

    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.SELECTION_CHANGE,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      const user = await this.getUserFromSocket(client);
      if (user) {
        client.to(sessionId).emit(MessageType.SELECTION_CHANGE, {
          selection: payload.selection,
          user,
        });
      }
    } catch (error) {
      console.error('Error handling selection change:', error);
    }
  }

  /**
   * Handles session state sync requests.
   * Sends current session state to requesting client.
   * @param client - The WebSocket client connection
   */
  @SubscribeMessage(MessageType.SYNC_REQUEST)
  async handleSyncRequest(@ConnectedSocket() client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    if (!sessionId) return;

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.SYNC_REQUEST,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      const session = await this.sessionService.getOrCreateSession(sessionId);
      client.emit(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      });
    } catch (error) {
      console.error('Error handling sync request:', error);
    }
  }

  /**
   * Handles user typing status updates.
   * Broadcasts typing status to other users in the session.
   * @param client - The WebSocket client connection
   * @param payload - Typing status payload
   */
  @SubscribeMessage(MessageType.TYPING_STATUS)
  async handleTypingStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { isTyping: boolean },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(
      MessageType.TYPING_STATUS,
      payload,
    );

    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(
      client,
      MessageType.TYPING_STATUS,
    );
    if (rateLimitResult.limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message,
      });
      return;
    }

    try {
      await this.updateUserActivity(client);
      const user = await this.getUserFromSocket(client);
      if (user) {
        client.to(sessionId).emit(MessageType.TYPING_STATUS, {
          isTyping: payload.isTyping,
          user,
        });
      }
    } catch (error) {
      console.error('Error handling typing status:', error);
    }
  }

  /**
   * Retrieves user information from socket connection.
   * @param client - The WebSocket client connection
   * @returns User object or null if not found
   */
  private async getUserFromSocket(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const userId = client.data.userId;
    if (!sessionId || !userId) return null;
    
    try {
      const session = await this.sessionService.getOrCreateSession(sessionId);
      return session.users.get(userId);
    } catch (error) {
      console.error('Error getting user from socket:', error);
      return null;
    }
  }
}

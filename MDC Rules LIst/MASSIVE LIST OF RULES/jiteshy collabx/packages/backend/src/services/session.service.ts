import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Session, User } from '@collabx/shared';
import {
  DEFAULT_CONTENT,
  DEFAULT_LANGUAGE,
  getRandomColor,
} from '@collabx/shared';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly MAX_USERS_PER_SESSION: number;
  private readonly SESSION_TTL: number;
  private readonly EMPTY_SESSION_TTL: number;
  private readonly INACTIVITY_TIMEOUT: number;
  private readonly CLEANUP_INTERVAL: number;
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.MAX_USERS_PER_SESSION = this.configService.get<number>('MAX_USERS_PER_SESSION', 5);
    this.SESSION_TTL = this.configService.get<number>('SESSION_TTL', 14400); // 4 hours in seconds
    this.EMPTY_SESSION_TTL = this.configService.get<number>('EMPTY_SESSION_TTL', 3600); // 1 hour in seconds
    this.INACTIVITY_TIMEOUT = this.configService.get<number>('INACTIVITY_TIMEOUT', 900); // 15 minutes in seconds
    this.CLEANUP_INTERVAL = this.configService.get<number>('SESSION_CLEANUP_INTERVAL', 7200000); // 2 hours in ms
  }

  onModuleInit() {
    // Schedule session cleanup to run periodically
    setInterval(() => {
      this.logger.log('Running scheduled inactive session cleanup');
      this.cleanupInactiveSessions().catch(err => {
        this.logger.error(`Error during session cleanup: ${err.message}`, err.stack);
      });
    }, this.CLEANUP_INTERVAL);
    
    this.logger.log(`Session cleanup scheduled to run every ${this.CLEANUP_INTERVAL/60000} minutes`);
  }

  async getOrCreateSession(sessionId: string): Promise<Session> {
    let session = await this.redisService.getSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        content: DEFAULT_CONTENT,
        language: DEFAULT_LANGUAGE,
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };
      await this.redisService.setSession(sessionId, session);
      // Set initial TTL for new session
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
    return session;
  }

  async addUserToSession(sessionId: string, username: string): Promise<User> {
    const session = await this.getOrCreateSession(sessionId);

    // Check for duplicate username
    if (
      Array.from(session.users.values()).some(
        (user) => user.username === username,
      )
    ) {
      throw new Error('Username already taken');
    }

    // Check if session is full
    if (session.users.size >= this.MAX_USERS_PER_SESSION) {
      throw new Error('Session is full');
    }

    // Create new user
    const userId = uuidv4();
    const user: User = {
      id: userId,
      username,
      color: getRandomColor(),
      lastActive: Date.now(),
      sessionId,
    };

    // Add user to session
    session.users.set(userId, user);
    session.lastActive = Date.now();
    await this.redisService.setSession(sessionId, session);

    return user;
  }

  async removeUserFromSession(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      const user = session.users.get(userId);
      if (user) {
        session.users.delete(userId);
        session.lastActive = Date.now();

        if (session.users.size === 0) {
          await this.redisService.setSessionTTL(
            sessionId,
            this.EMPTY_SESSION_TTL,
          );
        }

        await this.redisService.setSession(sessionId, session);
      }
    }
  }

  async updateSessionContent(
    sessionId: string,
    content: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.content = content;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

  async updateSessionLanguage(
    sessionId: string,
    language: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.language = language;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

  /**
   * Updates a user's data in a session
   * @param sessionId - ID of the session containing the user
   * @param userId - ID of the user to update
   * @param userData - Updated user data
   */
  async updateUser(
    sessionId: string,
    userId: string,
    userData: User,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session && session.users.has(userId)) {
      session.users.set(userId, userData);
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
  }

  async cleanupInactiveSessions(): Promise<void> {
    const sessions = await this.redisService.getAllSessions();
    const now = Date.now();
    let sessionsRemoved = 0;
    let usersRemoved = 0;

    for (const session of sessions) {
      const timeSinceLastActive = now - session.lastActive;
      
      // Clean up inactive users from active sessions
      if (session.users.size > 0) {
        for (const [userId, user] of session.users.entries()) {
          const userInactivityTime = now - (user.lastActive || session.lastActive);
          if (userInactivityTime >= this.INACTIVITY_TIMEOUT * 1000) {
            session.users.delete(userId);
            usersRemoved++;
            this.logger.debug(`Removed inactive user ${user.username} from session ${session.id}`);
          }
        }
        
        // Update session if we've removed users
        if (usersRemoved > 0) {
          session.lastActive = now;
          await this.redisService.setSession(session.id, session);
        }
      }
      
      // Delete entirely inactive sessions
      if (timeSinceLastActive >= this.INACTIVITY_TIMEOUT * 1000 || session.users.size === 0) {
        await this.redisService.deleteSession(session.id);
        sessionsRemoved++;
        this.logger.debug(`Removed inactive session ${session.id}`);
      }
    }
    
    if (sessionsRemoved > 0 || usersRemoved > 0) {
      this.logger.log(`Cleanup completed: Removed ${sessionsRemoved} inactive sessions and ${usersRemoved} disconnected users`);
    }
  }
}

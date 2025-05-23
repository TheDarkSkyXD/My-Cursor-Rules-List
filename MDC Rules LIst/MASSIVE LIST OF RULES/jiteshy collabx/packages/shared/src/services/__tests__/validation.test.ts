import { ValidationService } from '../validation';
import { MessageType, SocketError } from '../../types';

describe('ValidationService', () => {
  describe('validateSessionId', () => {
    it('should return null for valid alphanumeric session ID', () => {
      const validIds = ['abc123', '123abc', 'ABC123', 'abcDEF123'];
      validIds.forEach(id => {
        const result = ValidationService.validateSessionId(id);
        expect(result).toBeNull();
      });
    });

    it('should return error for session ID with special characters', () => {
      const invalidIds = ['abc-123', 'abc_123', 'abc.123', 'abc@123'];
      invalidIds.forEach(id => {
        const result = ValidationService.validateSessionId(id);
        expect(result).toEqual({
          type: 'INVALID_PAYLOAD',
          message: 'Session ID must contain only letters and numbers',
        });
      });
    });

    it('should return error for empty string', () => {
      const result = ValidationService.validateSessionId('');
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session ID',
      });
    });

    it('should return error for non-string input', () => {
      const result = ValidationService.validateSessionId(null as any);
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session ID',
      });
    });
  });

  describe('validateSessionLink', () => {
    it('should return null for valid session link', () => {
      const validLinks = [
        'http://localhost:3000/abc123',
        'http://localhost:3000/123abc',
        'http://localhost:3000/ABC123',
        'http://localhost:3000/abcDEF123'
      ];
      validLinks.forEach(link => {
        const result = ValidationService.validateSessionLink(link);
        expect(result).toBeNull();
      });
    });

    it('should return error for session link with invalid session ID', () => {
      const invalidLinks = [
        'http://localhost:3000/abc-123',
        'http://localhost:3000/abc_123',
        'http://localhost:3000/abc.123',
        'http://localhost:3000/abc@123'
      ];
      invalidLinks.forEach(link => {
        const result = ValidationService.validateSessionLink(link);
        expect(result).toEqual({
          type: 'INVALID_PAYLOAD',
          message: 'Session ID must contain only letters and numbers',
        });
      });
    });

    it('should return error for invalid session link', () => {
      const invalidLink = 'not-a-url';
      const result = ValidationService.validateSessionLink(invalidLink);
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session link format',
      });
    });

    it('should return error for empty string', () => {
      const result = ValidationService.validateSessionLink('');
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session link',
      });
    });

    it('should return error for non-string input', () => {
      const result = ValidationService.validateSessionLink(null as any);
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session link',
      });
    });
  });

  describe('validateEventPayload', () => {
    it('should validate join payload correctly', () => {
      const validPayload = { username: 'testuser' };
      const result = ValidationService.validateEventPayload(MessageType.JOIN, validPayload);
      expect(result).toBeNull();
    });

    it('should validate content change payload correctly', () => {
      const validPayload = { content: 'test content' };
      const result = ValidationService.validateEventPayload(MessageType.CONTENT_CHANGE, validPayload);
      expect(result).toBeNull();
    });

    it('should validate language change payload correctly', () => {
      const validPayload = { language: 'javascript' };
      const result = ValidationService.validateEventPayload(MessageType.LANGUAGE_CHANGE, validPayload);
      expect(result).toBeNull();
    });

    it('should return error for invalid payload type', () => {
      const invalidPayload = { invalid: 'data' };
      const result = ValidationService.validateEventPayload(MessageType.JOIN, invalidPayload);
      expect(result).toEqual({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid join payload',
      });
    });
  });
}); 
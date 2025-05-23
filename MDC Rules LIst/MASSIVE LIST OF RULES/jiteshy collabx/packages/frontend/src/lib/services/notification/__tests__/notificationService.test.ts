import { NotificationService } from '../notificationService';
import { toast } from 'sonner';

// Mock the sonner toast library
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    error: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showUserJoined', () => {
    it('should show notification when another user joins', () => {
      const username = 'testuser';
      const currentUsername = 'currentuser';
      
      NotificationService.showUserJoined(username, currentUsername);
      
      expect(toast.success).toHaveBeenCalledWith(`${username} joined the session`);
    });

    it('should not show notification when user joins their own session', () => {
      const username = 'testuser';
      const currentUsername = 'testuser';
      
      NotificationService.showUserJoined(username, currentUsername);
      
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle empty usernames gracefully', () => {
      const username = '';
      const currentUsername = 'currentuser';
      
      NotificationService.showUserJoined(username, currentUsername);
      
      expect(toast.success).toHaveBeenCalledWith(' joined the session');
    });
  });

  describe('showUserLeft', () => {
    it('should show notification when another user leaves', () => {
      const username = 'testuser';
      const currentUsername = 'currentuser';
      
      NotificationService.showUserLeft(username, currentUsername);
      
      expect(toast.info).toHaveBeenCalledWith(`${username} left the session`);
    });

    it('should not show notification when user leaves their own session', () => {
      const username = 'testuser';
      const currentUsername = 'testuser';
      
      NotificationService.showUserLeft(username, currentUsername);
      
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('should handle empty usernames gracefully', () => {
      const username = '';
      const currentUsername = 'currentuser';
      
      NotificationService.showUserLeft(username, currentUsername);
      
      expect(toast.info).toHaveBeenCalledWith(' left the session');
    });
  });

  describe('Connection Status Notifications', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should show reconnecting notification with attempt count', () => {
      NotificationService.showReconnecting(2, 5);
      expect(toast.loading).toHaveBeenCalledWith(
        'Connection lost. Reconnecting... (Attempt 2/5)',
        {
          id: 'reconnection-status',
          duration: Infinity
        }
      );
    });

    it('should show reconnection failed notification', () => {
      NotificationService.showReconnectionFailed();
      expect(toast.error).toHaveBeenCalledWith(
        'Connection lost. Please check your internet connection and refresh the page.',
        {
          id: 'reconnection-status',
          duration: Infinity
        }
      );
    });

    it('should show reconnection success notification', () => {
      NotificationService.showReconnectionSuccess();
      expect(toast.success).toHaveBeenCalledWith(
        'Connection restored!',
        {
          id: 'reconnection-status',
          duration: 3000
        }
      );
    });
  });
}); 
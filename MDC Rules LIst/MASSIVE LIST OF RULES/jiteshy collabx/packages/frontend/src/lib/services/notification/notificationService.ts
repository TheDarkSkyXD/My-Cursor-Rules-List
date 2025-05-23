import { toast } from 'sonner';

export class NotificationService {
  static showUserJoined(username: string, currentUsername: string) {
    if (username !== currentUsername) {
      toast.success(`${username} joined the session`);
    }
  }

  static showUserLeft(username: string, currentUsername: string) {
    if (username !== currentUsername) {
      toast.info(`${username} left the session`);
    }
  }

  // Add new methods for connection status
  static showReconnecting(attempt: number, maxAttempts: number) {
    toast.loading(
      `Connection lost. Reconnecting... (Attempt ${attempt}/${maxAttempts})`,
      {
        id: 'reconnection-status', // Use a fixed ID to update the same toast
        duration: Infinity // Keep the toast until we succeed or fail
      }
    );
  }

  static showReconnectionFailed() {
    toast.error(
      'Connection lost. Please check your internet connection and refresh the page.',
      {
        id: 'reconnection-status', // Replace the reconnecting toast
        duration: Infinity
      }
    );
  }

  static showReconnectionSuccess() {
    toast.success('Connection restored!', {
      id: 'reconnection-status', // Replace the reconnecting toast
      duration: 3000 // Show success briefly then dismiss
    });
  }
}

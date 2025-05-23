import {
  getUserNotifications,
  getUnreadNotificationsCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/lib/services/notificationService';

global.fetch = jest.fn();

describe('notificationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('returns paginated notifications on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          notifications: [
            { id: 1, title: 'Test', message: 'Msg', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false
        })
      });
      const result = await getUserNotifications(1, 10);
      expect(result.data[0]).toHaveProperty('id', '1');
      expect(result.total).toBe(1);
    });

    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
        headers: { get: () => 'application/json' }
      });
      await expect(getUserNotifications(1, 10)).rejects.toThrow();
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('returns count on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ count: 3 })
      });
      const count = await getUnreadNotificationsCount();
      expect(count).toBe(3);
    });
    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
        headers: { get: () => 'application/json' }
      });
      await expect(getUnreadNotificationsCount()).rejects.toThrow();
    });
  });

  describe('createNotification', () => {
    const payload = { title: 'Test', message: 'Msg', type: 'info' };
    it('creates notification and returns it', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({
          id: '1', title: 'Test', message: 'Msg', type: 'info', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })
      });
      const result = await createNotification(payload);
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'Test');
    });
    it('throws if required fields are missing', async () => {
      await expect(createNotification({ title: '', message: '', type: '' } as any)).rejects.toThrow();
    });
    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
        headers: { get: () => 'application/json' }
      });
      await expect(createNotification(payload)).rejects.toThrow();
    });
  });

  describe('markNotificationAsRead', () => {
    it('calls PATCH and resolves on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await expect(markNotificationAsRead('1')).resolves.toBeUndefined();
    });
    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('Not found'), headers: { get: () => 'application/json' } });
      await expect(markNotificationAsRead('1')).rejects.toThrow();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('calls PATCH and resolves on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await expect(markAllNotificationsAsRead()).resolves.toBeUndefined();
    });
    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('Server error'), headers: { get: () => 'application/json' } });
      await expect(markAllNotificationsAsRead()).rejects.toThrow();
    });
  });

  describe('deleteNotification', () => {
    it('calls DELETE and resolves on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      await expect(deleteNotification('1')).resolves.toBeUndefined();
    });
    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('Not found'), headers: { get: () => 'application/json' } });
      await expect(deleteNotification('1')).rejects.toThrow();
    });
  });
}); 
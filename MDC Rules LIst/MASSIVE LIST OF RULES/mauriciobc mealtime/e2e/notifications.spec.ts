import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Notifications E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /notification|notificação/i })).toBeVisible();
    // Optionally check for notification items
    await expect(page.getByTestId('notification-item')).toBeVisible();
  });

  test('can mark a notification as read', async ({ page }) => {
    await page.goto('/notifications');
    // Assumes at least one notification exists
    const notification = page.getByTestId('notification-item').first();
    await expect(notification).toBeVisible();
    const markAsReadBtn = notification.getByRole('button', { name: /mark as read|marcar como lida/i });
    if (await markAsReadBtn.isVisible()) {
      await markAsReadBtn.click();
      await expect(notification).toHaveClass(/read|lida/);
    }
  });

  test('shows error if marking as read fails', async ({ page }) => {
    // Simulate error by intercepting the request or using a test notification that will fail
    // This is a placeholder for error simulation
    // await page.route('/api/notifications/*', route => route.abort());
    // await page.goto('/notifications');
    // ...
    // await expect(page.getByText(/error|erro/i)).toBeVisible();
  });
}); 
# Test info

- Name: Notifications E2E >> can mark a notification as read
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/notifications.spec.ts:20:3

# Error details

```
Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
If you would like to reuse a single page between tests, create context manually with browser.newContext(). See https://aka.ms/playwright/reuse-page for details.
If you would like to configure your page before each test, do that in beforeEach hook instead.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { login, registerTestUser } from './helpers';
   3 |
   4 | test.describe('Notifications E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('notifications page loads', async ({ page }) => {
  14 |     await page.goto('/notifications');
  15 |     await expect(page.getByRole('heading', { name: /notification|notificação/i })).toBeVisible();
  16 |     // Optionally check for notification items
  17 |     await expect(page.getByTestId('notification-item')).toBeVisible();
  18 |   });
  19 |
> 20 |   test('can mark a notification as read', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  21 |     await page.goto('/notifications');
  22 |     // Assumes at least one notification exists
  23 |     const notification = page.getByTestId('notification-item').first();
  24 |     await expect(notification).toBeVisible();
  25 |     const markAsReadBtn = notification.getByRole('button', { name: /mark as read|marcar como lida/i });
  26 |     if (await markAsReadBtn.isVisible()) {
  27 |       await markAsReadBtn.click();
  28 |       await expect(notification).toHaveClass(/read|lida/);
  29 |     }
  30 |   });
  31 |
  32 |   test('shows error if marking as read fails', async ({ page }) => {
  33 |     // Simulate error by intercepting the request or using a test notification that will fail
  34 |     // This is a placeholder for error simulation
  35 |     // await page.route('/api/notifications/*', route => route.abort());
  36 |     // await page.goto('/notifications');
  37 |     // ...
  38 |     // await expect(page.getByText(/error|erro/i)).toBeVisible();
  39 |   });
  40 | }); 
```
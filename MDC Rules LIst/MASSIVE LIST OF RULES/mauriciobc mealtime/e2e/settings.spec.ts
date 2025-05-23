import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Settings E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings|configuração/i })).toBeVisible();
  });

  test('specific settings page loads', async ({ page }) => {
    // This test assumes at least one settings id exists (e.g., 1)
    await page.goto('/settings/1');
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('can update a setting', async ({ page }) => {
    await page.goto('/settings/1');
    await page.getByLabel(/name|nome/i).fill('Playwright Setting');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('Playwright Setting')).toBeVisible();
  });

  test('shows error on missing setting name', async ({ page }) => {
    await page.goto('/settings/1');
    await page.getByLabel(/name|nome/i).fill('');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });
}); 
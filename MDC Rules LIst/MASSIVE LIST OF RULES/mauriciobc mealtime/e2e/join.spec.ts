import { test, expect } from '@playwright/test';
// import { login } from './helpers';

test.describe('Join/Invite E2E', () => {
  // If join requires authentication, uncomment below:
  // test.beforeEach(async ({ page }) => {
  //   await login(page);
  // });

  test('join page loads', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByRole('heading', { name: /join|entrar|convite/i })).toBeVisible();
    await expect(page.getByLabel(/code|código/i)).toBeVisible();
  });

  test('can join with a valid code', async ({ page }) => {
    await page.goto('/join');
    await page.getByLabel(/code|código/i).fill('VALIDCODE123');
    await page.getByRole('button', { name: /join|entrar/i }).click();
    // Should redirect or show success
    await expect(page).not.toHaveURL(/join/);
    await expect(page.getByText(/success|sucesso/i)).toBeVisible();
  });

  test('shows error on invalid code', async ({ page }) => {
    await page.goto('/join');
    await page.getByLabel(/code|código/i).fill('INVALIDCODE');
    await page.getByRole('button', { name: /join|entrar/i }).click();
    await expect(page.getByText(/invalid|incorreto|not found|não encontrado/i)).toBeVisible();
  });

  test('shows error on missing code', async ({ page }) => {
    await page.goto('/join');
    await page.getByRole('button', { name: /join|entrar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });
}); 
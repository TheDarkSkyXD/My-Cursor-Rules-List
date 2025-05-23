import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Profile E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|perfil/i })).toBeVisible();
    await expect(page.getByText(/edit|editar/i)).toBeVisible();
  });

  test('profile edit page loads', async ({ page }) => {
    await page.goto('/profile/edit');
    await expect(page.getByRole('heading', { name: /edit|editar/i })).toBeVisible();
    await expect(page.getByLabel(/name|nome/i)).toBeVisible();
  });

  test('can update profile info', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.getByLabel(/name|nome/i).fill('Playwright User');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('Playwright User')).toBeVisible();
  });

  test('shows error on missing profile name', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.getByLabel(/name|nome/i).fill('');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });
}); 
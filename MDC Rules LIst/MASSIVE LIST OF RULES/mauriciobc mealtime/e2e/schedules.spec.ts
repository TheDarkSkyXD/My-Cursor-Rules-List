import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Schedules E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('schedules list page loads', async ({ page }) => {
    await page.goto('/schedules');
    await expect(page.getByRole('heading', { name: /schedule|agendamento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  });

  test('add new schedule page loads', async ({ page }) => {
    await page.goto('/schedules/new');
    await expect(page.getByRole('heading', { name: /add|novo/i })).toBeVisible();
    await expect(page.getByLabel(/name|nome/i)).toBeVisible();
  });

  test('can add a new schedule', async ({ page }) => {
    await page.goto('/schedules/new');
    await page.getByLabel(/name|nome/i).fill('Playwright Schedule');
    // Fill other required fields if any
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page).toHaveURL(/schedules/);
    await expect(page.getByText('Playwright Schedule')).toBeVisible();
  });

  test('shows error on missing schedule name', async ({ page }) => {
    await page.goto('/schedules/new');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can edit a schedule', async ({ page }) => {
    // Assumes a schedule with id 1 exists
    await page.goto('/schedules/1');
    await page.getByText(/edit|editar/i).click();
    await page.getByLabel(/name|nome/i).fill('Playwright Schedule Edited');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('Playwright Schedule Edited')).toBeVisible();
  });

  test('can delete a schedule', async ({ page }) => {
    // Assumes a schedule with id 1 exists
    await page.goto('/schedules/1');
    await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
    if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
      await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
    }
    await expect(page).toHaveURL(/schedules/);
  });
}); 
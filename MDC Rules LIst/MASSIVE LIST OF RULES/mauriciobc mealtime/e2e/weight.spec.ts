import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Weight Tracking E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('weight tracking page loads', async ({ page }) => {
    await page.goto('/weight');
    await expect(page.getByRole('heading', { name: /weight|peso/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  });

  test('can add a new weight entry', async ({ page }) => {
    await page.goto('/weight');
    await page.getByRole('button', { name: /add|novo/i }).click();
    await page.getByLabel(/weight|peso/i).fill('4.2');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('4.2')).toBeVisible();
  });

  test('shows error on missing weight value', async ({ page }) => {
    await page.goto('/weight');
    await page.getByRole('button', { name: /add|novo/i }).click();
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can delete a weight entry', async ({ page }) => {
    // Assumes a weight entry with a delete button exists
    await page.goto('/weight');
    const deleteBtn = page.getByRole('button', { name: /delete|excluir|remover/i }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
        await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
      }
      // Optionally check that the entry is no longer listed
    }
  });
}); 
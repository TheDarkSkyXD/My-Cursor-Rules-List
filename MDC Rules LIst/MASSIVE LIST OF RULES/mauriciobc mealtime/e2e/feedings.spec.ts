import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Feeding Log E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('feedings list page loads', async ({ page }) => {
    await page.goto('/feedings');
    await expect(page.getByRole('heading', { name: /feeding|alimentação/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  });

  test('can add a new feeding', async ({ page }) => {
    await page.goto('/feedings/new');
    await page.getByLabel(/cat|gato/i).selectOption({ index: 0 });
    await page.getByLabel(/amount|quantidade/i).fill('50');
    // Fill other required fields if any
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page).toHaveURL(/feedings/);
    await expect(page.getByText('50')).toBeVisible();
  });

  test('shows error on missing feeding fields', async ({ page }) => {
    await page.goto('/feedings/new');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can edit a feeding', async ({ page }) => {
    // Assumes a feeding with id 1 exists
    await page.goto('/feedings/1');
    await page.getByText(/edit|editar/i).click();
    await page.getByLabel(/amount|quantidade/i).fill('60');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('60')).toBeVisible();
  });

  test('can delete a feeding', async ({ page }) => {
    // Assumes a feeding with id 1 exists
    await page.goto('/feedings/1');
    await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
    if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
      await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
    }
    await expect(page).toHaveURL(/feedings/);
  });

  test('feeding detail page loads', async ({ page }) => {
    // This test assumes at least one feeding exists with id 1
    await page.goto('/feedings/1');
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText(/edit|editar/i)).toBeVisible();
  });
}); 
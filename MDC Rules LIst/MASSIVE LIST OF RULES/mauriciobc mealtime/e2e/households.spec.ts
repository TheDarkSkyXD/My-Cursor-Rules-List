import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Household Management E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('households list page loads', async ({ page }) => {
    await page.goto('/households');
    await expect(page.getByRole('heading', { name: /household|residência/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  });

  test('can add a new household', async ({ page }) => {
    await page.goto('/households/new');
    await page.getByLabel(/name|nome/i).fill('Playwright Household');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page).toHaveURL(/households/);
    await expect(page.getByText('Playwright Household')).toBeVisible();
  });

  test('shows error on missing household name', async ({ page }) => {
    await page.goto('/households/new');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can edit a household', async ({ page }) => {
    // Assumes a household with id 1 exists
    await page.goto('/households/1');
    await page.getByText(/edit|editar/i).click();
    await page.getByLabel(/name|nome/i).fill('Playwright Household Edited');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('Playwright Household Edited')).toBeVisible();
  });

  test('can delete a household', async ({ page }) => {
    // Assumes a household with id 1 exists
    await page.goto('/households/1');
    await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
    if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
      await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
    }
    await expect(page).toHaveURL(/households/);
  });

  test('household members page loads', async ({ page }) => {
    await page.goto('/households/1/members');
    await expect(page.getByRole('heading', { name: /members|membros/i })).toBeVisible();
  });
}); 
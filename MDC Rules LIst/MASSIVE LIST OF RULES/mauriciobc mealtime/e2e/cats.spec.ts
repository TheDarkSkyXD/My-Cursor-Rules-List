import { test, expect } from '@playwright/test';
import { login, registerTestUser } from './helpers';

test.describe('Cat Management E2E', () => {
  test.beforeAll(async ({ page }) => {
    await registerTestUser(page);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('cats list page loads', async ({ page }) => {
    await page.goto('/cats');
    await expect(page.getByRole('heading', { name: /cats|gatos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  });

  test('full authenticated cat flow: create, edit, delete', async ({ page }) => {
    // Create
    await page.goto('/cats/new');
    await page.getByLabel(/name|nome/i).fill('E2E Cat');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page).toHaveURL(/cats/);
    await expect(page.getByText('E2E Cat')).toBeVisible();

    // Find the created cat and go to its detail page (assume it's the only or first one)
    await page.click(`text=E2E Cat`);
    await expect(page.getByRole('heading')).toBeVisible();

    // Edit
    await page.getByText(/edit|editar/i).click();
    await page.getByLabel(/name|nome/i).fill('E2E Cat Edited');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('E2E Cat Edited')).toBeVisible();

    // Delete
    await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
    if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
      await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
    }
    await expect(page).toHaveURL(/cats/);
    await expect(page.getByText('E2E Cat Edited')).not.toBeVisible();
  });

  test('can add a new cat', async ({ page }) => {
    await page.goto('/cats/new');
    await page.getByLabel(/name|nome/i).fill('Playwright Cat');
    // Fill other required fields if any
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    // Should redirect to cats list or show success
    await expect(page).toHaveURL(/cats/);
    await expect(page.getByText('Playwright Cat')).toBeVisible();
  });

  test('shows error on missing cat name', async ({ page }) => {
    await page.goto('/cats/new');
    await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can edit a cat', async ({ page }) => {
    // Assumes a cat with id 1 exists
    await page.goto('/cats/1');
    await page.getByText(/edit|editar/i).click();
    await page.getByLabel(/name|nome/i).fill('Playwright Cat Edited');
    await page.getByRole('button', { name: /save|salvar/i }).click();
    await expect(page.getByText('Playwright Cat Edited')).toBeVisible();
  });

  test('can delete a cat', async ({ page }) => {
    // Assumes a cat with id 1 exists
    await page.goto('/cats/1');
    await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
    // Confirm deletion if modal appears
    if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
      await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
    }
    await expect(page).toHaveURL(/cats/);
    // Optionally check that the cat is no longer listed
  });

  test('cat detail page loads', async ({ page }) => {
    // This test assumes at least one cat exists with id 1
    await page.goto('/cats/1');
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText(/edit|editar/i)).toBeVisible();
  });
}); 
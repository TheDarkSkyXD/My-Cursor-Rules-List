# Test info

- Name: Cat Management E2E >> can delete a cat
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/cats.spec.ts:71:3

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
   4 | test.describe('Cat Management E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('cats list page loads', async ({ page }) => {
  14 |     await page.goto('/cats');
  15 |     await expect(page.getByRole('heading', { name: /cats|gatos/i })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  17 |   });
  18 |
  19 |   test('full authenticated cat flow: create, edit, delete', async ({ page }) => {
  20 |     // Create
  21 |     await page.goto('/cats/new');
  22 |     await page.getByLabel(/name|nome/i).fill('E2E Cat');
  23 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  24 |     await expect(page).toHaveURL(/cats/);
  25 |     await expect(page.getByText('E2E Cat')).toBeVisible();
  26 |
  27 |     // Find the created cat and go to its detail page (assume it's the only or first one)
  28 |     await page.click(`text=E2E Cat`);
  29 |     await expect(page.getByRole('heading')).toBeVisible();
  30 |
  31 |     // Edit
  32 |     await page.getByText(/edit|editar/i).click();
  33 |     await page.getByLabel(/name|nome/i).fill('E2E Cat Edited');
  34 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  35 |     await expect(page.getByText('E2E Cat Edited')).toBeVisible();
  36 |
  37 |     // Delete
  38 |     await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
  39 |     if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  40 |       await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  41 |     }
  42 |     await expect(page).toHaveURL(/cats/);
  43 |     await expect(page.getByText('E2E Cat Edited')).not.toBeVisible();
  44 |   });
  45 |
  46 |   test('can add a new cat', async ({ page }) => {
  47 |     await page.goto('/cats/new');
  48 |     await page.getByLabel(/name|nome/i).fill('Playwright Cat');
  49 |     // Fill other required fields if any
  50 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  51 |     // Should redirect to cats list or show success
  52 |     await expect(page).toHaveURL(/cats/);
  53 |     await expect(page.getByText('Playwright Cat')).toBeVisible();
  54 |   });
  55 |
  56 |   test('shows error on missing cat name', async ({ page }) => {
  57 |     await page.goto('/cats/new');
  58 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  59 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  60 |   });
  61 |
  62 |   test('can edit a cat', async ({ page }) => {
  63 |     // Assumes a cat with id 1 exists
  64 |     await page.goto('/cats/1');
  65 |     await page.getByText(/edit|editar/i).click();
  66 |     await page.getByLabel(/name|nome/i).fill('Playwright Cat Edited');
  67 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  68 |     await expect(page.getByText('Playwright Cat Edited')).toBeVisible();
  69 |   });
  70 |
> 71 |   test('can delete a cat', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  72 |     // Assumes a cat with id 1 exists
  73 |     await page.goto('/cats/1');
  74 |     await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
  75 |     // Confirm deletion if modal appears
  76 |     if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  77 |       await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  78 |     }
  79 |     await expect(page).toHaveURL(/cats/);
  80 |     // Optionally check that the cat is no longer listed
  81 |   });
  82 |
  83 |   test('cat detail page loads', async ({ page }) => {
  84 |     // This test assumes at least one cat exists with id 1
  85 |     await page.goto('/cats/1');
  86 |     await expect(page.getByRole('heading')).toBeVisible();
  87 |     await expect(page.getByText(/edit|editar/i)).toBeVisible();
  88 |   });
  89 | }); 
```
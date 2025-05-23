# Test info

- Name: Feeding Log E2E >> feedings list page loads
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/feedings.spec.ts:13:3

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
   4 | test.describe('Feeding Log E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
> 13 |   test('feedings list page loads', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  14 |     await page.goto('/feedings');
  15 |     await expect(page.getByRole('heading', { name: /feeding|alimentação/i })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  17 |   });
  18 |
  19 |   test('can add a new feeding', async ({ page }) => {
  20 |     await page.goto('/feedings/new');
  21 |     await page.getByLabel(/cat|gato/i).selectOption({ index: 0 });
  22 |     await page.getByLabel(/amount|quantidade/i).fill('50');
  23 |     // Fill other required fields if any
  24 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  25 |     await expect(page).toHaveURL(/feedings/);
  26 |     await expect(page.getByText('50')).toBeVisible();
  27 |   });
  28 |
  29 |   test('shows error on missing feeding fields', async ({ page }) => {
  30 |     await page.goto('/feedings/new');
  31 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  32 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  33 |   });
  34 |
  35 |   test('can edit a feeding', async ({ page }) => {
  36 |     // Assumes a feeding with id 1 exists
  37 |     await page.goto('/feedings/1');
  38 |     await page.getByText(/edit|editar/i).click();
  39 |     await page.getByLabel(/amount|quantidade/i).fill('60');
  40 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  41 |     await expect(page.getByText('60')).toBeVisible();
  42 |   });
  43 |
  44 |   test('can delete a feeding', async ({ page }) => {
  45 |     // Assumes a feeding with id 1 exists
  46 |     await page.goto('/feedings/1');
  47 |     await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
  48 |     if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  49 |       await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  50 |     }
  51 |     await expect(page).toHaveURL(/feedings/);
  52 |   });
  53 |
  54 |   test('feeding detail page loads', async ({ page }) => {
  55 |     // This test assumes at least one feeding exists with id 1
  56 |     await page.goto('/feedings/1');
  57 |     await expect(page.getByRole('heading')).toBeVisible();
  58 |     await expect(page.getByText(/edit|editar/i)).toBeVisible();
  59 |   });
  60 | }); 
```
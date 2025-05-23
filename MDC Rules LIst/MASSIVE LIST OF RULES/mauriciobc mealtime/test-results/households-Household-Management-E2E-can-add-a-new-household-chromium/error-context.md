# Test info

- Name: Household Management E2E >> can add a new household
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/households.spec.ts:19:3

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
   4 | test.describe('Household Management E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('households list page loads', async ({ page }) => {
  14 |     await page.goto('/households');
  15 |     await expect(page.getByRole('heading', { name: /household|residência/i })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  17 |   });
  18 |
> 19 |   test('can add a new household', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  20 |     await page.goto('/households/new');
  21 |     await page.getByLabel(/name|nome/i).fill('Playwright Household');
  22 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  23 |     await expect(page).toHaveURL(/households/);
  24 |     await expect(page.getByText('Playwright Household')).toBeVisible();
  25 |   });
  26 |
  27 |   test('shows error on missing household name', async ({ page }) => {
  28 |     await page.goto('/households/new');
  29 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  30 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  31 |   });
  32 |
  33 |   test('can edit a household', async ({ page }) => {
  34 |     // Assumes a household with id 1 exists
  35 |     await page.goto('/households/1');
  36 |     await page.getByText(/edit|editar/i).click();
  37 |     await page.getByLabel(/name|nome/i).fill('Playwright Household Edited');
  38 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  39 |     await expect(page.getByText('Playwright Household Edited')).toBeVisible();
  40 |   });
  41 |
  42 |   test('can delete a household', async ({ page }) => {
  43 |     // Assumes a household with id 1 exists
  44 |     await page.goto('/households/1');
  45 |     await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
  46 |     if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  47 |       await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  48 |     }
  49 |     await expect(page).toHaveURL(/households/);
  50 |   });
  51 |
  52 |   test('household members page loads', async ({ page }) => {
  53 |     await page.goto('/households/1/members');
  54 |     await expect(page.getByRole('heading', { name: /members|membros/i })).toBeVisible();
  55 |   });
  56 | }); 
```
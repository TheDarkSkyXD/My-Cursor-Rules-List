# Test info

- Name: Weight Tracking E2E >> can delete a weight entry
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/weight.spec.ts:34:3

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
   4 | test.describe('Weight Tracking E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('weight tracking page loads', async ({ page }) => {
  14 |     await page.goto('/weight');
  15 |     await expect(page.getByRole('heading', { name: /weight|peso/i })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  17 |   });
  18 |
  19 |   test('can add a new weight entry', async ({ page }) => {
  20 |     await page.goto('/weight');
  21 |     await page.getByRole('button', { name: /add|novo/i }).click();
  22 |     await page.getByLabel(/weight|peso/i).fill('4.2');
  23 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  24 |     await expect(page.getByText('4.2')).toBeVisible();
  25 |   });
  26 |
  27 |   test('shows error on missing weight value', async ({ page }) => {
  28 |     await page.goto('/weight');
  29 |     await page.getByRole('button', { name: /add|novo/i }).click();
  30 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  31 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  32 |   });
  33 |
> 34 |   test('can delete a weight entry', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  35 |     // Assumes a weight entry with a delete button exists
  36 |     await page.goto('/weight');
  37 |     const deleteBtn = page.getByRole('button', { name: /delete|excluir|remover/i }).first();
  38 |     if (await deleteBtn.isVisible()) {
  39 |       await deleteBtn.click();
  40 |       if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  41 |         await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  42 |       }
  43 |       // Optionally check that the entry is no longer listed
  44 |     }
  45 |   });
  46 | }); 
```
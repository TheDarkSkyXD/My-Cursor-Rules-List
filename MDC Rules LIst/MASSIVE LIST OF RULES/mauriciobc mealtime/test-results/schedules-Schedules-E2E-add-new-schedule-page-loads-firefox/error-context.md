# Test info

- Name: Schedules E2E >> add new schedule page loads
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/schedules.spec.ts:19:3

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
   4 | test.describe('Schedules E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('schedules list page loads', async ({ page }) => {
  14 |     await page.goto('/schedules');
  15 |     await expect(page.getByRole('heading', { name: /schedule|agendamento/i })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: /add|novo/i })).toBeVisible();
  17 |   });
  18 |
> 19 |   test('add new schedule page loads', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  20 |     await page.goto('/schedules/new');
  21 |     await expect(page.getByRole('heading', { name: /add|novo/i })).toBeVisible();
  22 |     await expect(page.getByLabel(/name|nome/i)).toBeVisible();
  23 |   });
  24 |
  25 |   test('can add a new schedule', async ({ page }) => {
  26 |     await page.goto('/schedules/new');
  27 |     await page.getByLabel(/name|nome/i).fill('Playwright Schedule');
  28 |     // Fill other required fields if any
  29 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  30 |     await expect(page).toHaveURL(/schedules/);
  31 |     await expect(page.getByText('Playwright Schedule')).toBeVisible();
  32 |   });
  33 |
  34 |   test('shows error on missing schedule name', async ({ page }) => {
  35 |     await page.goto('/schedules/new');
  36 |     await page.getByRole('button', { name: /add|criar|salvar|save/i }).click();
  37 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  38 |   });
  39 |
  40 |   test('can edit a schedule', async ({ page }) => {
  41 |     // Assumes a schedule with id 1 exists
  42 |     await page.goto('/schedules/1');
  43 |     await page.getByText(/edit|editar/i).click();
  44 |     await page.getByLabel(/name|nome/i).fill('Playwright Schedule Edited');
  45 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  46 |     await expect(page.getByText('Playwright Schedule Edited')).toBeVisible();
  47 |   });
  48 |
  49 |   test('can delete a schedule', async ({ page }) => {
  50 |     // Assumes a schedule with id 1 exists
  51 |     await page.goto('/schedules/1');
  52 |     await page.getByRole('button', { name: /delete|excluir|remover/i }).click();
  53 |     if (await page.getByRole('button', { name: /confirm|sim|yes/i }).isVisible()) {
  54 |       await page.getByRole('button', { name: /confirm|sim|yes/i }).click();
  55 |     }
  56 |     await expect(page).toHaveURL(/schedules/);
  57 |   });
  58 | }); 
```
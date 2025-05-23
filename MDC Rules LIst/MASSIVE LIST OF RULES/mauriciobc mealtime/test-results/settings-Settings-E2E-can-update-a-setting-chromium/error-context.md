# Test info

- Name: Settings E2E >> can update a setting
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/settings.spec.ts:24:3

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
   4 | test.describe('Settings E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('settings page loads', async ({ page }) => {
  14 |     await page.goto('/settings');
  15 |     await expect(page.getByRole('heading', { name: /settings|configuração/i })).toBeVisible();
  16 |   });
  17 |
  18 |   test('specific settings page loads', async ({ page }) => {
  19 |     // This test assumes at least one settings id exists (e.g., 1)
  20 |     await page.goto('/settings/1');
  21 |     await expect(page.getByRole('heading')).toBeVisible();
  22 |   });
  23 |
> 24 |   test('can update a setting', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  25 |     await page.goto('/settings/1');
  26 |     await page.getByLabel(/name|nome/i).fill('Playwright Setting');
  27 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  28 |     await expect(page.getByText('Playwright Setting')).toBeVisible();
  29 |   });
  30 |
  31 |   test('shows error on missing setting name', async ({ page }) => {
  32 |     await page.goto('/settings/1');
  33 |     await page.getByLabel(/name|nome/i).fill('');
  34 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  35 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  36 |   });
  37 | }); 
```
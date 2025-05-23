# Test info

- Name: Profile E2E >> can update profile info
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/profile.spec.ts:25:3

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
   4 | test.describe('Profile E2E', () => {
   5 |   test.beforeAll(async ({ page }) => {
   6 |     await registerTestUser(page);
   7 |   });
   8 |
   9 |   test.beforeEach(async ({ page }) => {
  10 |     await login(page);
  11 |   });
  12 |
  13 |   test('profile page loads', async ({ page }) => {
  14 |     await page.goto('/profile');
  15 |     await expect(page.getByRole('heading', { name: /profile|perfil/i })).toBeVisible();
  16 |     await expect(page.getByText(/edit|editar/i)).toBeVisible();
  17 |   });
  18 |
  19 |   test('profile edit page loads', async ({ page }) => {
  20 |     await page.goto('/profile/edit');
  21 |     await expect(page.getByRole('heading', { name: /edit|editar/i })).toBeVisible();
  22 |     await expect(page.getByLabel(/name|nome/i)).toBeVisible();
  23 |   });
  24 |
> 25 |   test('can update profile info', async ({ page }) => {
     |   ^ Error: "context" and "page" fixtures are not supported in "beforeAll" since they are created on a per-test basis.
  26 |     await page.goto('/profile/edit');
  27 |     await page.getByLabel(/name|nome/i).fill('Playwright User');
  28 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  29 |     await expect(page.getByText('Playwright User')).toBeVisible();
  30 |   });
  31 |
  32 |   test('shows error on missing profile name', async ({ page }) => {
  33 |     await page.goto('/profile/edit');
  34 |     await page.getByLabel(/name|nome/i).fill('');
  35 |     await page.getByRole('button', { name: /save|salvar/i }).click();
  36 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  37 |   });
  38 | }); 
```
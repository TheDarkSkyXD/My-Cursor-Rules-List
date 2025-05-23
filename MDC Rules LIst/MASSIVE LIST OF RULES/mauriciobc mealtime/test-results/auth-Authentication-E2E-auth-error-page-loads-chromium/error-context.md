# Test info

- Name: Authentication E2E >> auth error page loads
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/auth.spec.ts:73:3

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: getByText(/error|invalid/i) resolved to 2 elements:
    1) <h1 class="text-4xl font-bold tracking-tight">Authentication Error</h1> aka getByRole('heading', { name: 'Authentication Error' })
    2) <p class="text-lg text-gray-600">We encountered an error while trying to authentic…</p> aka getByText('We encountered an error while')

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByText(/error|invalid/i)

    at /home/mauriciobc/Documentos/Code/mealtime/e2e/auth.spec.ts:75:52
```

# Page snapshot

```yaml
- status:
  - img
  - text: Static route
  - button "Hide static indicator":
    - img
- alert
- banner:
  - link "MealTime":
    - /url: /
    - img "MealTime"
- main:
  - heading "Authentication Error" [level=1]
  - paragraph: We encountered an error while trying to authenticate you. This could happen if the authentication link expired or was already used.
  - link "Return to Login":
    - /url: /login
  - paragraph: If you continue to experience issues, please contact support.
- link "Início":
  - /url: /
  - img
  - text: Início
- link "Gatos":
  - /url: /cats
  - img
  - text: Gatos
- link "Domicílios":
  - /url: /households
  - img
  - text: Domicílios
- link "Agenda":
  - /url: /schedules
  - img
  - text: Agenda
- link "Peso":
  - /url: /weight
  - img
  - text: Peso
- link "Estatísticas":
  - /url: /statistics
  - img
  - text: Estatísticas
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const TEST_EMAIL = 'testuser@example.com';
   4 | const TEST_PASSWORD = 'password123';
   5 |
   6 | // Utility to register a user (for login tests)
   7 | async function registerTestUser(page) {
   8 |   await page.goto('/signup');
   9 |   await page.getByLabel('Email').fill(TEST_EMAIL);
  10 |   await page.getByLabel('Password').fill(TEST_PASSWORD);
  11 |   await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  12 |   // Wait for redirect or success message
  13 |   await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
  14 | }
  15 |
  16 | test.describe('Authentication E2E', () => {
  17 |   test('login page loads and form is present', async ({ page }) => {
  18 |     await page.goto('/login');
  19 |     await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  20 |     await expect(page.getByLabel('Email')).toBeVisible();
  21 |     await expect(page.getByLabel('Password')).toBeVisible();
  22 |   });
  23 |
  24 |   test('can register a new user', async ({ page }) => {
  25 |     const uniqueEmail = `user${Date.now()}@example.com`;
  26 |     await page.goto('/signup');
  27 |     await page.getByLabel('Email').fill(uniqueEmail);
  28 |     await page.getByLabel('Password').fill(TEST_PASSWORD);
  29 |     await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  30 |     // Should redirect to login or show success
  31 |     await expect(page).toHaveURL(/login/);
  32 |   });
  33 |
  34 |   test('shows error on duplicate registration', async ({ page }) => {
  35 |     await registerTestUser(page);
  36 |     await page.goto('/signup');
  37 |     await page.getByLabel('Email').fill(TEST_EMAIL);
  38 |     await page.getByLabel('Password').fill(TEST_PASSWORD);
  39 |     await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  40 |     await expect(page.getByText(/already exists|já existe|duplicate/i)).toBeVisible();
  41 |   });
  42 |
  43 |   test('shows error on missing signup fields', async ({ page }) => {
  44 |     await page.goto('/signup');
  45 |     await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  46 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  47 |   });
  48 |
  49 |   test('can login with valid credentials', async ({ page }) => {
  50 |     await registerTestUser(page);
  51 |     await page.goto('/login');
  52 |     await page.getByLabel('Email').fill(TEST_EMAIL);
  53 |     await page.getByLabel('Password').fill(TEST_PASSWORD);
  54 |     await page.getByRole('button', { name: /login|entrar/i }).click();
  55 |     // Should redirect to dashboard/home or show success
  56 |     await expect(page).not.toHaveURL(/login/);
  57 |   });
  58 |
  59 |   test('shows error on invalid login', async ({ page }) => {
  60 |     await page.goto('/login');
  61 |     await page.getByLabel('Email').fill('wrong@example.com');
  62 |     await page.getByLabel('Password').fill('wrongpassword');
  63 |     await page.getByRole('button', { name: /login|entrar/i }).click();
  64 |     await expect(page.getByText(/invalid|incorreto|not found/i)).toBeVisible();
  65 |   });
  66 |
  67 |   test('shows error on missing login fields', async ({ page }) => {
  68 |     await page.goto('/login');
  69 |     await page.getByRole('button', { name: /login|entrar/i }).click();
  70 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  71 |   });
  72 |
  73 |   test('auth error page loads', async ({ page }) => {
  74 |     await page.goto('/auth/auth-code-error');
> 75 |     await expect(page.getByText(/error|invalid/i)).toBeVisible();
     |                                                    ^ Error: expect.toBeVisible: Error: strict mode violation: getByText(/error|invalid/i) resolved to 2 elements:
  76 |   });
  77 | }); 
```
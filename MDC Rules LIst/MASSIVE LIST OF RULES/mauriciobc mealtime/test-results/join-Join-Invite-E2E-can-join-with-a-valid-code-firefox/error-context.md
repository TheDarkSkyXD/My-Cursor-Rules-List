# Test info

- Name: Join/Invite E2E >> can join with a valid code
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/join.spec.ts:16:3

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/code|código/i)

    at /home/mauriciobc/Documentos/Code/mealtime/e2e/join.spec.ts:18:43
```

# Page snapshot

```yaml
- status:
  - img
  - text: Static route
  - button "Hide static indicator":
    - img
- alert
- main:
  - text: MealTime Entre com seu email e senha ou use o Google Email
  - textbox "Email"
  - text: Senha
  - textbox "Senha"
  - button:
    - img
  - button "Entrar com Email"
  - text: Ou continue com
  - button "Entrar com Google":
    - img
    - text: Entrar com Google
  - text: Não tem uma conta?
  - link "Registre-se":
    - /url: /signup
  - text: Ao entrar, você concorda com nossos
  - link "Termos de Serviço":
    - /url: /terms
  - text: e
  - link "Política de Privacidade":
    - /url: /privacy
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | // import { login } from './helpers';
   3 |
   4 | test.describe('Join/Invite E2E', () => {
   5 |   // If join requires authentication, uncomment below:
   6 |   // test.beforeEach(async ({ page }) => {
   7 |   //   await login(page);
   8 |   // });
   9 |
  10 |   test('join page loads', async ({ page }) => {
  11 |     await page.goto('/join');
  12 |     await expect(page.getByRole('heading', { name: /join|entrar|convite/i })).toBeVisible();
  13 |     await expect(page.getByLabel(/code|código/i)).toBeVisible();
  14 |   });
  15 |
  16 |   test('can join with a valid code', async ({ page }) => {
  17 |     await page.goto('/join');
> 18 |     await page.getByLabel(/code|código/i).fill('VALIDCODE123');
     |                                           ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  19 |     await page.getByRole('button', { name: /join|entrar/i }).click();
  20 |     // Should redirect or show success
  21 |     await expect(page).not.toHaveURL(/join/);
  22 |     await expect(page.getByText(/success|sucesso/i)).toBeVisible();
  23 |   });
  24 |
  25 |   test('shows error on invalid code', async ({ page }) => {
  26 |     await page.goto('/join');
  27 |     await page.getByLabel(/code|código/i).fill('INVALIDCODE');
  28 |     await page.getByRole('button', { name: /join|entrar/i }).click();
  29 |     await expect(page.getByText(/invalid|incorreto|not found|não encontrado/i)).toBeVisible();
  30 |   });
  31 |
  32 |   test('shows error on missing code', async ({ page }) => {
  33 |     await page.goto('/join');
  34 |     await page.getByRole('button', { name: /join|entrar/i }).click();
  35 |     await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  36 |   });
  37 | }); 
```
import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'password123';

// Utility to register a user (for login tests)
async function registerTestUser(page) {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  // Wait for redirect or success message
  await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
}

test.describe('Authentication E2E', () => {
  test('login page loads and form is present', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('can register a new user', async ({ page }) => {
    const uniqueEmail = `user${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
    // Should redirect to login or show success
    await expect(page).toHaveURL(/login/);
  });

  test('shows error on duplicate registration', async ({ page }) => {
    await registerTestUser(page);
    await page.goto('/signup');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
    await expect(page.getByText(/already exists|já existe|duplicate/i)).toBeVisible();
  });

  test('shows error on missing signup fields', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('can login with valid credentials', async ({ page }) => {
    await registerTestUser(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login|entrar/i }).click();
    // Should redirect to dashboard/home or show success
    await expect(page).not.toHaveURL(/login/);
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /login|entrar/i }).click();
    await expect(page.getByText(/invalid|incorreto|not found/i)).toBeVisible();
  });

  test('shows error on missing login fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /login|entrar/i }).click();
    await expect(page.getByText(/required|obrigatório/i)).toBeVisible();
  });

  test('auth error page loads', async ({ page }) => {
    await page.goto('/auth/auth-code-error');
    await expect(page.getByText(/error|invalid/i)).toBeVisible();
  });
}); 
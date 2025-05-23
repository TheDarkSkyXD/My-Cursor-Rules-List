import { Page } from '@playwright/test';

export const TEST_EMAIL = 'testuser@example.com';
export const TEST_PASSWORD = 'password123';

export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /login|entrar/i }).click();
  // Wait for redirect or dashboard
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
}

export async function registerTestUser(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign up|register|cadastrar/i }).click();
  // Wait for redirect or success
  await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 }).catch(() => {});
} 
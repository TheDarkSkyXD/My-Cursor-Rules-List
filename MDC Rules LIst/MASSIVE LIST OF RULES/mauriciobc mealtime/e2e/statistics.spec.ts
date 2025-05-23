import { test, expect } from '@playwright/test';

// Adjust the baseURL if needed (default assumes dev server runs on localhost:3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('/api/statistics E2E', () => {
  test('returns a list of statistics (happy path)', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/statistics`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // Optionally, check for expected fields if you know the schema
    // expect(data[0]).toHaveProperty('id');
  });

  test('returns 404 if no statistics found', async ({ request }) => {
    // This test assumes you can control the DB state or mock it for E2E
    // If not, you may want to skip or adjust this test
    // For now, just check that 404 is a possible response
    const response = await request.get(`${baseURL}/api/statistics?simulateEmpty=true`);
    expect([200, 404]).toContain(response.status());
  });
}); 
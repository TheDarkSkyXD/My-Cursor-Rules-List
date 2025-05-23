# Test info

- Name: /api/statistics E2E >> returns a list of statistics (happy path)
- Location: /home/mauriciobc/Documentos/Code/mealtime/e2e/statistics.spec.ts:7:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
    at /home/mauriciobc/Documentos/Code/mealtime/e2e/statistics.spec.ts:9:31
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // Adjust the baseURL if needed (default assumes dev server runs on localhost:3000)
   4 | const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
   5 |
   6 | test.describe('/api/statistics E2E', () => {
   7 |   test('returns a list of statistics (happy path)', async ({ request }) => {
   8 |     const response = await request.get(`${baseURL}/api/statistics`);
>  9 |     expect(response.status()).toBe(200);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  10 |     const data = await response.json();
  11 |     expect(Array.isArray(data)).toBe(true);
  12 |     // Optionally, check for expected fields if you know the schema
  13 |     // expect(data[0]).toHaveProperty('id');
  14 |   });
  15 |
  16 |   test('returns 404 if no statistics found', async ({ request }) => {
  17 |     // This test assumes you can control the DB state or mock it for E2E
  18 |     // If not, you may want to skip or adjust this test
  19 |     // For now, just check that 404 is a possible response
  20 |     const response = await request.get(`${baseURL}/api/statistics?simulateEmpty=true`);
  21 |     expect([200, 404]).toContain(response.status());
  22 |   });
  23 | }); 
```
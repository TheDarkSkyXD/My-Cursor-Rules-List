# Supabase Scheduled Notifications: Implementation Checklist

This checklist guides you through implementing a robust, production-ready scheduled notification system using Prisma for schema/migrations and Supabase for execution.

---

## 1. Prisma Schema & Migrations
- [x] In `prisma/schema.prisma`, add the `ScheduledNotification` model with proper indexing:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  model ScheduledNotification {
    id          String   @id @default(uuid())
    userId      String
    catId       String?
    type        String
    title       String
    message     String
    deliverAt   DateTime
    delivered   Boolean  @default(false)
    deliveredAt DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([delivered, deliverAt])
  }
  ```
- [x] Standardize on UTC for all timestamps (validate/normalize incoming `deliverAt`).
- [x] Plan retention: add an optional `expiresAt` field or schedule a cleanup job (e.g., delete delivered records older than 30 days).
- [x] Run migration:
  ```bash
  npx prisma migrate dev --name add_scheduledNotifications
  ```

---

## 2. Runtime Environment & Data Access

Choose where your scheduled-notification handlers will run:

- [x] **Option A: Next.js API Routes (Node.js on Netlify)**
  - [x] Create `app/api/scheduled-notifications/route.ts` and `app/api/scheduled-notifications/deliver/route.ts` in your Next.js app.
  - [x] Install and configure `@prisma/client`, then:
    ```ts
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    ```

- [ ] **Option B: Supabase Edge Functions (Deno)**
  - [ ] Create Deno functions `schedule-notification` and `deliver-scheduled-notifications` under your Supabase functions directory.
  - [ ] Use the Supabase JS client (`@supabase/supabase-js@2`) with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

- [x] Ensure all service-role credentials (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are stored in protected environment variables and never exposed client-side.

---

## 3. Create Schedule Function (`schedule-notification`)
- [x] Create the handler:
    - **Next.js**: `app/api/scheduled-notifications/route.ts`
- [x] Implement a POST endpoint:
  1. Authenticate request and derive `userId` from the JWT (ignore any client-supplied `userId`).
  2. Validate payload:
     - `type`, `title`, `message` (non-empty)
     - `deliverAt` is a valid ISO-8601 string and in the future (UTC).
  3. Insert into `ScheduledNotification`:
     - **Node**: `prisma.scheduledNotification.create({ data: { ... } })`
  4. Return the created record as JSON.
- [x] Deploy via your chosen platform.

---

## 4. Create Delivery Function (`deliver-scheduled-notifications`)
- [x] Implement the delivery worker:
  1. Get current UTC time.
  2. **Atomically claim & fetch** pending notifications:
     ```sql
     WITH claimed AS (
       UPDATE "ScheduledNotification"
       SET delivered = true, deliveredAt = NOW()
       WHERE delivered = false AND deliverAt <= NOW()
       RETURNING *
     )
     SELECT * FROM claimed;
     ```
     - **Node**: `prisma.$executeRaw` + `prisma.$queryRaw` or within a `$transaction`
  3. For each claimed notification, call your `sendNotification()` logic.
  4. Return a summary `{ delivered: numberOfNotifications }`.
- [x] Handle failures:
  - If send fails, record `lastTriedAt` and implement retry/backoff logic.

---

## 5. Scheduling the Delivery Job
- [x] **Netlify Scheduled Functions**: install and configure the Netlify scheduling plugin in your `netlify.toml`:
  ```toml
  [[plugins]]
    package = "@netlify/plugin-scheduled-functions"

  [[scheduledFunctions]]
    function = "app/api/scheduled-notifications/deliver/route.ts"
    schedule = "* * * * *"   # run every minute
  ```
- [x] **Optional**: you can also annotate your handler file with a schedule comment:
  ```js
  /**
   * @netlify/functions
   * schedule: '* * * * *'
   */
  ```
- [x] No external cron service is needed—Netlify will invoke your `deliver-scheduled-notifications` endpoint on the schedule above.
- [x] **Note:** Delivery scheduling is now fully automated in production.

---

## 6. Frontend Integration
- [x] Extend your service layer with a `scheduleNotification` function:
  ```ts
  export async function scheduleNotification(
    payload: { type: string; title: string; message: string; deliverAt: string }
  ) {
    const res = await fetch('/api/scheduled-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Scheduling failed: ${res.statusText}`);
    return res.json();
  }
  ```
- [x] In your UI (page or component), call `scheduleNotification(payload)` and show toasts on success/error. (**Now only available in the test notifications page, not user-facing**)
- [x] Ensure the user is authenticated (session cookie or JWT).
- [x] Client-side validate `deliverAt` (future date, ISO-8601).
- [x] **Note:** The schedule notification form is only available for internal/testing in `/app/test-notifications/page.tsx`. Production UI does not expose scheduling to users.

---

## 7. Testing & Validation
- [~] Run your app and API routes locally:
  ```bash
  npm run dev    # or `netlify dev` for Netlify functions
  ```
- [ ] Write automated tests (Jest/Vitest):
  1. Schedule a notification.
  2. Stub or mock "now" to control timing.
  3. Invoke delivery function; assert DB state and that `sendNotification` was called.
  4. Simulate send failures; assert retry logic keeps records undelivered.
- [ ] Load-test delivery worker if expecting high volume.

---

## 8. Observability & Cleanup
- [x] Document required env vars in `.env.example`:
  ```env
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  DATABASE_URL=
  ```
- [ ] Add logs in functions (`console.log`, `console.error`) and monitor via Netlify function logs or a third-party (Sentry, Logflare).
- [ ] Schedule a daily cleanup (Next.js API or Netlify function, or `pg_cron`) to delete delivered notifications older than your retention period (e.g., 30 days).

---

## 9. Advanced Enhancements (Optional)
- [ ] Track `lastTriedAt` to apply exponential backoff for retries.
- [ ] Instrument metrics (count, latency, error rates) in your delivery function.
- [ ] Add tests covering time zone edge cases (DST transitions, leap seconds).

**Good luck!** 
# Unified Notification Dispatch Plan

> **IMPORTANT:**
> - In development, you must run the notification cron job with:
>   ```bash
>   npm run cron
>   ```
>   This keeps scheduled notifications working locally.
> - In production (e.g., Vercel), use an external scheduler (GitHub Actions, cron-job.org, etc.) to call:
>   ```
>   GET /api/notifications/feeding-check
>   ```
>   every 5 minutes. Persistent background jobs are not supported on most serverless platforms.

## 1. Notification Types & Triggers

| Type        | Triggered by Cron? | Triggered by Event? | Example Event Source                |
|-------------|--------------------|---------------------|-------------------------------------|
| feeding     | ✅                 | ✅                  | Cron (overdue), feeding registration|
| reminder    | ✅                 | ✅                  | Cron (upcoming), schedule update    |
| warning     | ✅                 | ✅                  | Cron (missed/duplicate), feeding    |
| household   | ❌                 | ✅                  | User joins/leaves household         |
| system      | ❌                 | ✅                  | System update, schedule change      |
| info        | ❌                 | ✅                  | Admin message, general info         |
| error       | ❌                 | ✅                  | Feeding failure, system error       |

---

## 2. Cron-based Notification Flow

- **Runs every N minutes** (via `initializeCronJobs`).
- For each cat:
  - Fetch schedules and last feeding log.
  - Use `generateFeedingNotifications` to determine if a `feeding`, `reminder`, or `warning` notification is due.
  - For each notification, POST to `/api/notifications`.
  - **If a feeding is overdue, send a new reminder notification every 15 minutes after the scheduled time, until the cat is fed. Each reminder is deduplicated using `catId`, `scheduledTime`, and `reminderInterval` in notification metadata.**
- **Metrics**: Use `feedingNotificationMonitor` to track checks, successes, failures, and timing.

---

## 3. Event-driven Notification Flow

- **Direct triggers** in business logic (e.g., user joins household, feeding is registered, schedule is updated, error occurs).
- Call `createNotification` (or POST `/api/notifications`) with the appropriate type (`household`, `system`, `info`, `error`, etc.).
- **Examples**:
  - When a user joins a household, trigger a `household` notification for all members.
  - When a schedule is updated, trigger a `system` notification for the owner.
  - On feeding registration failure, trigger an `error` notification for the user.

---

## 4. API & Persistence

- All notifications are persisted via the `/api/notifications` endpoint.
- Notification types and payloads are validated against the unified type system.
- The API supports creation, listing, marking as read, and deletion.

---

## 5. Monitoring & Observability

- **Cron metrics**: Track notification creation, failures, and timing.
- **Event metrics**: Log event-driven notification triggers and errors.
- **Expose**: Admin/debug endpoint for notification metrics.

---

## 6. Testing

- **Cron tests**: Simulate time, schedules, and logs to ensure correct notifications are generated.
- **Event tests**: Simulate user/system events and assert correct notification creation.
- **Integration**: Ensure both flows can coexist and do not duplicate notifications.

---

## 7. Documentation

- Update `docs/architecture.md` to show both cron and event-driven flows.
- Add trigger examples for each notification type.
- Document how to add new notification types or triggers.

---

## 8. Next Steps

1. ~~Implement `/api/notifications/feeding-check` for the cron job.~~ ✅ **Done: Implemented and committed on 'cron-notifications' branch.**
2. **Ensure all event-driven triggers use the notification API/service.**

### Detailed Plan for Event-Driven Notification Triggers

#### Notification Types & Expected Triggers

- **feeding**
  - Triggered by: Feeding registration (user logs a feeding)
  - Action: Notify relevant users (e.g., household members, owner) that a feeding was registered
  - Implementation: Call `createNotification` after successful feeding registration

- **reminder**
  - Triggered by: Schedule update (user changes feeding schedule)
  - Action: Notify owner/user about upcoming feeding or schedule change
  - Implementation: Call `createNotification` after schedule is updated

- **warning**
  - Triggered by: Feeding registration (duplicate/missed feeding detected)
  - Action: Notify user of missed or duplicate feeding
  - Implementation: Call `createNotification` if feeding registration logic detects a missed/duplicate event

- **household**
  - Triggered by: User joins or leaves a household
  - Action: Notify all household members of the change
  - Implementation: Call `createNotification` for each member when join/leave event occurs

- **system**
  - Triggered by: System-wide updates, schedule changes, or admin actions
  - Action: Notify affected users of system events
  - Implementation: Call `createNotification` in system update or schedule change handlers

- **info**
  - Triggered by: Admin messages, general info broadcasts
  - Action: Notify users of informational messages
  - Implementation: Call `createNotification` when admin/info event is triggered

- **error**
  - Triggered by: Feeding failure, system error, or failed user action
  - Action: Notify user of the error
  - Implementation: Call `createNotification` in error handling logic

#### Implementation Checklist

- [x] Feeding registration triggers `feeding` notification *(implemented in POST handler)*
- [ ] Feeding registration triggers `warning` notification on duplicate/missed *(audit in progress)*
- [x] Schedule update triggers `reminder` or `system` notification *(system notification sent on PATCH /api/schedules/[id], includes updated fields and cat info)*
- [x] User joins/leaves household triggers `household` notification for all members
- [x] System/admin events trigger `system` or `info` notification *(admin-only API route POST /api/notifications/admin-send implemented)*
- [ ] Error handling triggers `error` notification for affected user
- [x] Overdue feeding triggers repeated reminder notifications every 15 minutes, deduplicated by `catId`, `scheduledTime`, and `reminderInterval` *(implemented in cron job)*

#### Next Steps for This Milestone

- [x] Audit and update all business logic to call `createNotification` for the above events *(feeding registration handler updated, warning audit in progress, household join/leave notifications implemented server-side)*
- [x] Ensure notification payloads match the unified type system
- [ ] Add/expand tests for event-driven notification triggers
- [ ] Document trigger points and update architecture docs

---

# Next Milestone: Add/expand tests for event-driven notification triggers

Work is now starting on this milestone. The next step is to review and add/expand automated tests to ensure all event-driven notification triggers are covered and validated.

## Unified Notification Type System (Summary)

- **NotificationType**: One of 'feeding', 'reminder', 'household', 'system', 'info', 'warning', 'error'.

- **Notification** (from `lib/types/notification.ts`):
  - `id: string` (UUID)
  - `title: string`
  - `message: string`
  - `type: NotificationType`
  - `isRead: boolean`
  - `createdAt: string`
  - `updatedAt: string`
  - `userId: string` (UUID)
  - `metadata?: { catId?: string; householdId?: string; actionUrl?: string; icon?: string; scheduledTime?: string; [key: string]: any }`

- **CreateNotificationPayload** (from `lib/types/notification.ts`):
  - `title: string`
  - `message: string`
  - `type: NotificationType`
  - `metadata?: { catId?: string; actionUrl?: string; icon?: string; scheduledTime?: string; [key: string]: any }`
  - (userId and householdId are handled by the API/session, not in the payload)

All notification creation and API payloads must match these structures. The next step is to audit all notification creation points and ensure conformance.

---

# Risk Assessment & Review

## Risks

- **Duplicate Notifications**: If both cron and event-driven flows trigger for the same event, users may receive multiple notifications. 
  - *Mitigation*: Add deduplication logic (e.g., unique constraints, time windows, or idempotency keys).

- **Performance/Scalability**: Cron job may become slow as the number of cats/schedules grows.
  - *Mitigation*: Paginate queries, process in batches, and monitor execution time.

- **Missed Notifications**: If the cron job fails or is delayed, notifications may be late or missed.
  - *Mitigation*: Add monitoring/alerts for cron failures and execution lag.

- **Race Conditions**: Simultaneous event and cron triggers could cause race conditions in notification creation.
  - *Mitigation*: Use database transactions or atomic upserts where possible.

- **API Rate Limits**: High notification volume could hit API or database rate limits.
  - *Mitigation*: Throttle notification creation, use bulk inserts, and monitor API usage.

- **User Preferences**: Not all users may want all notification types.
  - *Mitigation*: Respect user notification settings/preferences in both flows.

- **Testing Complexity**: Ensuring both flows are covered and do not conflict increases test complexity.
  - *Mitigation*: Write comprehensive unit, integration, and E2E tests for both flows.

- **Data Consistency**: Event-driven and cron-driven notifications must not diverge in logic or data.
  - *Mitigation*: Centralize notification logic in shared service functions.

## Review

- The plan unifies cron-based and event-driven notification flows, ensuring all notification types are handled.
- Risks are identified and mitigations proposed.
- The plan is extensible for new notification types and scalable for growth.
- Next steps are actionable and clear.

---

*Registered by AI assistant on behalf of the team. Review and update as implementation progresses.*

---

# Migration Plan: Moving from CRON to Supabase Realtime for Notifications

## Overview
This plan details how to migrate from the current CRON/polling-based notification fetching to a Supabase Realtime-driven approach, enabling instant notification delivery to clients when new rows are inserted into the `notifications` table.

## Step-by-Step Migration Plan

### 1. Prerequisites
- Ensure the `notifications` table is compatible with Supabase Realtime (already verified).
- Supabase Realtime is enabled for the `public` schema by default.
- Obtain your Supabase project URL and anon/public key for the client SDK.

### 2. Client-Side Integration

#### a. Install Supabase JS Client
```bash
npm install @supabase/supabase-js
```

#### b. Initialize Supabase Client
Create a utility (e.g., `lib/supabaseClient.ts`):
```ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### c. Subscribe to Notifications Table
In your `NotificationContext.tsx` (or a new hook), add a subscription:
```ts
import { supabase } from '@/lib/supabaseClient';
useEffect(() => {
  const channel = supabase
    .channel('public:notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` },
      (payload) => {
        // Add the new notification to your context/reducer
        dispatch({ type: 'ADD_NOTIFICATION', payload: payload.new });
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUserId]);
```
- This ensures only notifications for the current user are received.

#### d. Update Notification State
- When a new notification arrives, add it to the top of your notifications list in context/reducer.
- Optionally, increment the unread count if `is_read` is false.

#### e. (Optional) Handle Updates/Deletes
- You can also subscribe to `UPDATE` and `DELETE` events if you want real-time sync for read/removal actions.

### 3. Backend/Notification Creation
- No change needed if you already insert notifications into the `notifications` table.
- If you use CRON to periodically check and insert, you can remove the CRON job once you're confident the real-time approach is working.

### 4. Remove/Refactor Polling or CRON
- Remove any setInterval polling or CRON jobs that fetch notifications.
- Keep REST endpoints for pagination/history, but rely on Realtime for new notifications.

### 5. Testing & Rollout
- Test with multiple users to ensure only relevant notifications are received.
- Test on slow/unstable networks (WebSocket fallback).
- Monitor for duplicate notifications (ensure idempotency in reducer).

### 6. Documentation & Maintenance
- Update your `README.md` and `docs/architecture.md` to reflect the new real-time notification flow.
- Document the Supabase Realtime subscription logic and any changes to the notification context/provider.

### 7. (Optional) Advanced: Server-Side Filtering
- If you want to filter notifications more granularly (e.g., by household, type), adjust the `filter` in the subscription accordingly.

## Summary Table

| Step | Action | File/Location | Notes |
|------|--------|---------------|-------|
| 1    | Install Supabase client | `package.json` | `npm install @supabase/supabase-js` |
| 2    | Create Supabase client | `lib/supabaseClient.ts` | Use env vars for keys |
| 3    | Add Realtime subscription | `NotificationContext.tsx` | Use `useEffect` and `dispatch` |
| 4    | Update reducer for new notifications | `NotificationContext.tsx` | Add to top of list, update unread count |
| 5    | Remove polling/CRON | Context, backend | Only if all triggers are now event-driven |
| 6    | Test & document | All relevant docs | Update architecture diagrams |

---

*Registered by AI assistant: Migration plan for real-time notifications with Supabase Realtime.* 
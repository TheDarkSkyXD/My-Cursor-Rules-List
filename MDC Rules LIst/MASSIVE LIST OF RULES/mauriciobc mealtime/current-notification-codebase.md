# Current Notification Codebase Overview

This document describes the end-to-end implementation of notifications in the codebase, covering data types, API routes, service layer, React context, UI components, and tests.

---

## 1. Data Model & Types

- **Prisma table**: `notifications` (fields: `id`, `user_id`, `title`, `message`, `type`, `metadata`, `is_read`, `created_at`, `updated_at`).
- **TypeScript interfaces**:
  - `lib/types/notification.ts`: client-side model with string UUIDs:
    ```typescript
    export interface Notification {
      id: string;
      title: string;
      message: string;
      type: NotificationType;
      isRead: boolean;
      createdAt: string;
      updatedAt: string;
      userId: string;
      metadata?: { [key: string]: any };
    }
    ```
  - `types/notification.ts`: server-side model with numeric IDs and additional fields.

---

## 2. API Layer (app/api/notifications)

All routes authenticate via Supabase cookies or SSR client, then operate on the `notifications` table.

- **GET /** (`GET /api/notifications`)
  - File: `app/api/notifications/route.ts`
  - Returns paginated notifications for the logged-in user (via `supabase.from('notifications').select().range()`), with `page`, `totalPages`, `hasMore`, etc.

- **POST /** (`POST /api/notifications`)
  - File: `app/api/notifications/route.ts`
  - Creates a new notification. Generates `id` via `crypto.randomUUID()`, sets `user_id` from session, writes to Supabase.

- **PATCH /** (`PATCH /api/notifications`)
  - File: `app/api/notifications/route.ts`
  - Bulk mark as read based on `notificationIds` payload, using Prisma `updateMany`, then revalidates cache tags.

- **DELETE /** (`DELETE /api/notifications`)
  - File: `app/api/notifications/route.ts`
  - Bulk delete via Prisma `deleteMany`, based on `notificationIds`.

- **DELETE by ID** (`DELETE /api/notifications/[id]`)
  - File: `app/api/notifications/[id]/route.ts`
  - Fetches the notification via Prisma `findUnique`, checks `user_id` matches session, then deletes via `prisma.notifications.delete()`.

- **PUT by ID** (`PUT /api/notifications/[id]`)
  - File: `app/api/notifications/[id]/route.ts`
  - Updates `is_read` via Supabase client update.

- **PATCH single** (`PATCH /api/notifications/[id]/read`)
  - File: `app/api/notifications/[id]/read/route.ts`
  - Validates numeric `id`, fetches via `prisma.notification.findUnique`, verifies ownership, updates `isRead: true`, revalidates cache tags.

- **POST read-all** (`POST /api/notifications/read-all`)
  - File: `app/api/notifications/read-all/route.ts`
  - Marks all unread notifications as read for user from header `X-User-ID`, via Prisma `updateMany`.

- **GET unread-count** (`GET /api/notifications/unread-count`)
  - File: `app/api/notifications/unread-count/route.ts`
  - Returns count of unread notifications via `prisma.notifications.count()`.

---

## 3. Service Layer (lib/services/notificationService.ts)

Provides client-side functions to call the above APIs:

- `getUserNotifications(page, limit)`: GET `/api/notifications`, parses JSON, returns `{ data: Notification[], total, page, totalPages, hasMore }`.
- `getUnreadNotificationsCount()`: GET `/api/notifications/unread-count`, returns `count`.
- `createNotification(payload)`: POST `/api/notifications`, sends `{ title, message, type, metadata }`.
- `markNotificationAsRead(id)`: PATCH `/api/notifications`, body `{ notificationIds: [id], read: true }`.
- `markAllNotificationsAsRead()`: POST `/api/notifications/read-all`.
- `deleteNotification(id)`: DELETE `/api/notifications/{id}`, expects 204 No Content.

All functions handle non-OK responses with robust error parsing and logging.

---

## 4. React Context & State Management (lib/context/NotificationContext.tsx)

- Initializes state from `storageService` (localStorage) to persist across sessions.
- Uses a reducer to handle actions:
  - `SET_NOTIFICATIONS`, `APPEND_NOTIFICATIONS` for fetching/pagination.
  - `ADD_NOTIFICATION` for real-time additions.
  - `MARK_NOTIFICATION_READ`, `MARK_ALL_NOTIFICATIONS_READ`, `REMOVE_NOTIFICATION` for updates.
  - `SET_LOADING`, `SET_ERROR`, `SET_PAGE`, `SET_UNREAD_COUNT`.
- Exposes context methods:
  - `refreshNotifications()`, `loadMore()`, `markAsRead(id)`, `markAllAsRead()`, `removeNotification(id)`.
- Persists state back to `storageService` on updates.

---

## 5. UI Components

- **NotificationItem** (`components/notifications/notification-item.tsx`): visual representation of a single notification, shows icon (via `lucide-react`), title, message, "time ago", and optional delete button. On click, navigates if `metadata.actionUrl`.
- **NotificationsPage** (`app/notifications/page.tsx`): uses `useNotifications()`, lists notifications in cards, supports "Mark all read" and individual actions with feedback via `sonner` toast.

---

## 6. Testing

- **Unit/API**: `__tests__/api/notifications.test.ts` (skipped suite) mocks Prisma and NextAuth to test API handlers for GET, PATCH, DELETE, etc.
- **E2E**: `e2e/notifications.spec.ts` uses Playwright to verify notifications page, marking as read and error states.

---

## 7. Observability & Metrics

- **Monitoring**: `lib/monitoring/feeding-notifications.ts` tracks metrics for feeding-related notifications (total checks, failures, timings).
- **Logging**: All API routes and service functions log key events and errors to console, and API routes revalidate cache tags (`next/cache`) for real-time UI updates.

---

**Summary:**
The current implementation uses a hybrid of Supabase client (for CRUD in most API routes), Prisma (for bulk mutations and ownership checks), a dedicated service layer for API communication with robust error handling, a React context for state and persistence, and UI components that consume context. Testing spans unit, integration, and end-to-end to ensure correctness. 
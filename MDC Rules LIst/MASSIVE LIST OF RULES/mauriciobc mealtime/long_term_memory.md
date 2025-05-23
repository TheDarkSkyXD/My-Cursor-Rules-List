# Project Overview & Refactor Status (Supabase Auth Migration)

## Project Summary

*   **Application:** MealTime - Manages cat feeding schedules.
*   **Technology Stack:** Next.js 14, TypeScript, Supabase (Auth, DB - replacing Prisma?), TailwindCSS, Shadcn UI, Prisma (for DB access via API routes).
*   **Architecture:** Refactored context system (Core + Domain).
    *   **Core Contexts:** `UserContext` (Auth/Profile), `LoadingContext` (Implemented), `ErrorContext` (Missing).
    *   **Domain Contexts:** `HouseholdContext`, `CatsContext`, `FeedingContext`, `ScheduleContext` (Dependency needs verification), `NotificationContext`.
*   **Previous State:** Used NextAuth for authentication and Prisma for database interactions.

## Authentication & Data Flow Assessment (Supabase Migration)

*   **Status:** **In Progress**.
*   **Database Interaction:** Prisma (`@/lib/prisma`) is actively used in API routes (`app/api/...`) for DB operations. **No direct Prisma usage found in client/page components or contexts.** This server-side confinement is acceptable for now.
*   **Client-Side State (Contexts):**
    *   `lib/context/UserContext.tsx`: **Compliant.** Uses Supabase client, listens to `onAuthStateChange`. No longer dispatches to `AppContext`.
    *   `lib/context/LoadingContext.tsx`: Implemented and compliant.
    *   `lib/context/AppContext.tsx`: **Removed.** No longer used.
    *   Domain Contexts (`Cats`, `Feeding`, `Household`, `Schedule`, `Notification`): Appear mostly compliant, using `UserContext` and `LoadingContext`. `FeedingContext` usage of `AppContext` removed.
    *   `lib/context/ErrorContext.tsx`: **Missing.** (Should be implemented as per Item #7 in TODO list)
*   **Client-Side Components/Pages:**
    *   `app/page.tsx`: Compliant, uses `useUserContext` and other context hooks.
    *   **Most components/pages (`app/...`, `components/...`) now use `useUserContext` instead of `useSession`.** (e.g., `app/cats/...`, `app/feedings/[id]/page.tsx` refactored).
    *   `components/layout/root-client-layout.tsx`: **Compliant.** No longer wraps children with `AppProvider`. Sets up all other context providers.
*   **Server-Side:**
    *   `@supabase/ssr` library integrated for server-side session management.
    *   `middleware.ts` (root): Mostly compliant. Handles Supabase session refresh and global route protection. CSP needs minor review.
    *   `utils/supabase/middleware.ts`, `utils/supabase/server.ts`: Provide Supabase helpers. **Server helper updated to handle cookies correctly.**
    *   API Routes (`app/api/...`): `/api/settings` confirmed compliant with server-side Supabase auth checks. Others require verification. **Cookie handling updated.** **Prisma client errors observed (Needs Investigation).**
    *   Server Components (`app/layout.tsx`, etc.): Auth handling **unverified**. `app/layout.tsx` defers provider setup to `RootClientLayout`.
*   **Testing:** Mocks for `next-auth` still exist. Tests likely require significant updates.

## Identified Issues & Recommended Next Steps

**High Priority Blockers:**

1.  **Investigate API Route Database Connectivity:** API Routes (`/api/households`, `/api/notifications`) are failing or returning unexpected results. While the Prisma client initialization (`lib/prisma.ts`) seems standard, runtime errors or empty data suggest potential issues with database connectivity (e.g., environment variable access like `DATABASE_URL` within the API route's specific execution environment) or problems with the query/data interaction for the authenticated user in these routes. Needs root cause analysis focusing on the runtime context of these specific API endpoints.
    *   **Update (Fix Applied):** The `/api/settings` route was initially failing to provide the `householdId` because the Prisma query attempted to select `household_id` directly from the `profiles` table. The fix involved modifying the query to fetch the `household_id` through the `household_members` relation (`select: { household_members: { select: { household_id: true }, take: 1 } }`) and accessing it via `userSettings.household_members?.[0]?.household_id`.

**Other Important Tasks:**

2.  **Verify Server-Side Auth:**
    *   Check remaining API routes for `supabase.auth.getUser()` usage.
    *   Check Server Components for `supabase.auth.getUser()` usage.
3.  **Implement/Verify Core Contexts:**
    *   Implement `ErrorContext`.
    *   Verify `ScheduleContext` existence/implementation.
4.  **Review `UserContext` Sync Logic:** Ensure robust synchronization between Supabase auth state and context state.
5.  **Standardize Logout:** Ensure logout is handled consistently (ideally via context).
6.  **Testing:** Update/add tests for Supabase auth flow and remove NextAuth mocks.
7.  **Cleanup:** Remove `next-auth` dependency and related files (`types`, `mocks`, old API route).
8.  **Clarify Prisma Role:** Decide long-term strategy (keep using Prisma in APIs or migrate DB ops to Supabase JS client).
9.  **Documentation:** Update `docs/architecture/contexts.md`, `supabase-auth-todo.md`.

# Cookie Implementation Analysis

## Overview

The application uses a sophisticated cookie management system primarily for handling Supabase authentication state across different parts of the application. The implementation spans multiple layers and contexts, each serving specific purposes in the authentication flow.

## Core Components

### 1. Server-Side Cookie Store (`utils/supabase/server.ts`)
```typescript
const asyncCookieStore = {
  async get(name: string) { ... },
  async set(name: string, value: string, options: CookieOptions) { ... },
  async remove(name: string, options: CookieOptions) { ... }
};
```
- Provides an async wrapper around Next.js's cookie API
- Used by server-side components and API routes
- Handles cookie operations in an async context
- Gracefully handles errors in Server Components

### 2. Middleware Cookie Handler (`utils/supabase/middleware.ts`)
```typescript
const createMiddlewareClient = (request: NextRequest, response: NextResponse) => {
  cookies: {
    getAll() { ... },
    setAll(cookiesToSet) { ... }
  }
};
```
- Specialized for middleware context
- Manages cookie state during request/response cycle
- Ensures cookie modifications persist across the middleware chain

## Information Flow

1. **Initial Request Flow**
   - Request enters through middleware
   - `createMiddlewareClient` initializes cookie handling
   - Session state is checked and updated if needed
   - Modified cookies are attached to the response

2. **API Route Flow**
   - Creates Supabase client with `asyncCookieStore`
   - Retrieves user session from cookies
   - Handles authentication state
   - Updates cookies as needed

3. **Server Component Flow**
   - Uses `asyncCookieStore` for cookie operations
   - Handles cookie errors gracefully
   - Relies on middleware for session refresh

## Key Assumptions & Dependencies

1. **Cookie Naming**
   - Supabase auth tokens follow pattern: `sb-{project-ref}-auth-token`
   - Multiple token versions may exist (`.0`, `.1`, `.2`, etc.)

2. **Cookie Persistence**
   - Middleware refreshes sessions automatically
   - Server Components can ignore certain cookie operation errors
   - Client-side changes trigger appropriate server-side updates

3. **Error Handling**
   - Cookie operations in Server Components may fail silently
   - Middleware handles cookie updates reliably
   *   API routes must explicitly handle cookie-related errors

4. **Security Considerations**
   - Cookies are HTTP-only where possible
   - Secure flag is set in production
   - SameSite attribute is properly configured
   - CSP headers are set up for Supabase domains

## Current Issues & Considerations

1. **Error Handling**
   - Some cookie operations in Server Components silently fail
   - Need to verify error handling consistency across all routes

2. **Session Management**
   - Multiple token versions can exist simultaneously
   - Need to ensure proper cleanup of old tokens
   - Session refresh logic could be optimized

3. **Performance**
   - Cookie operations are async, impacting response time
   - Multiple cookie reads/writes in single request cycle
   - Consider caching strategies for frequent operations

4. **Security**
   - CSP headers need regular review for Supabase endpoints
   - Cookie attributes should be audited periodically
   - Token refresh mechanism needs monitoring

## Recommendations

1. **Immediate Improvements**
   - Implement consistent error handling across all cookie operations
   - Add logging for critical cookie operations
   - Review and optimize session refresh logic

2. **Future Enhancements**
   - Consider implementing cookie operation batching
   - Add metrics for cookie operation performance
   - Enhance security through regular audits
   - Implement proper cleanup of stale tokens

3. **Monitoring**
   - Add telemetry for cookie operations
   - Monitor session refresh patterns
   - Track cookie size and count

## Dependencies

- Next.js Cookies API
- Supabase SSR package
- Custom middleware implementation
- Server-side Supabase client

## Related Files

- `utils/supabase/server.ts`
- `utils/supabase/middleware.ts`
- `middleware.ts`
- Various API routes using cookie authentication 

# API Route Authentication via Middleware Header

**Middleware Logic (`middleware.ts`):**

If a user session exists, the middleware extracts the Supabase Auth User ID (`session.user.id`) and adds it to the request headers as `X-User-ID`.

**API Route Implementation (Example: `/api/feedings`):**
```typescript
import { headers } from 'next/headers';

// Inside the route handler (e.g., GET, POST)
const headersList = headers();
const authUserId = headersList.get('X-User-ID');

if (!authUserId) {
  // Handle missing header (unauthorized)
}

4.  **Upcoming Feedings Data:**
    *   **Component (`components/feeding/upcoming-feedings.tsx`):**
        *   Uses `useUserContext`, `useCats`, `useFeeding`, `useSchedules`.
        *   Uses selector `useSelectUpcomingFeedings`.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **API Authorization:** Critical to ensure the `DELETE /api/cats/[id]` handler has robust authorization checks based on the `X-User-ID` header.
*   **Context Reliability:** The page assumes `CatsContext` has loaded the correct cats. Verify error handling if `CatsContext` fetch fails.
*   **Data Consistency:** Ensure the `catId` used is the correct UUID string format expected by the API.
*   **State Reversion:** The error handling for delete correctly attempts to revert state, but complex scenarios could lead to inconsistencies; requires testing.
*   **Loading States:** Verify the combined loading logic (`userState.isLoading`, loading during delete) provides a clear user experience.

## `app/cats/new/page.tsx` (New Cat Form)

**Data Requirements:**

1.  **Current User & Household:** Needs `currentUser` (especially `householdId`) from `UserContext` to associate the new cat and handle loading/unauthorized/no-household states.
2.  **Form Inputs:** User-provided cat details (name, photo, birthdate, weight, portion, restrictions, notes, feeding interval).

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Page uses `useUserContext()` and `useCats()`.
    *   Waits for `userState.isLoading` to be false.
    *   Checks if `currentUser` exists and has a `householdId`. If not, redirects to login or shows an `<EmptyState>`.

2.  **Form Rendering & Input:**
    *   Renders the form using `react-hook-form` and Zod schema (`formSchema`).
    *   Includes specific components like `<Calendar>` and `<ImageUpload>`.

3.  **Form Submission:**
    *   User submits the form.
    *   `onSubmit` function is triggered.
    *   Client-side validation via Zod runs (handled by `react-hook-form`).
    *   Verifies `currentUser.householdId` exists.
    *   **API Call:** Sends a `POST` request to `/api/cats`.
        *   **Request Body:** Contains validated and formatted form data, including `householdId`.
        *   **API Route (`app/api/cats/route.ts` - *assumed*):** Needs `POST` handler.
            *   **Authorization:** Must read `X-User-ID` header, verify user belongs to the `householdId` in the request body.
            *   **Operation:** Perform `prisma.cats.create({ data: ... })` using the payload, ensuring `householdId` and `userId` (if tracked on cat) are set correctly.
            *   **Response:** Return the newly created `CatType` object or an error.
    *   **Response Handling:**
        *   **If Success:** Parses the returned `newCat` data.
        *   **Context Update:** Dispatches `ADD_CAT` to `CatsContext` with the `newCat` payload.
        *   **Redirect:** Navigates user to `/cats`.
        *   **If Error:** Displays error toast.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **API Authorization:** Critical to ensure the `POST /api/cats` handler has robust authorization checks based on the `X-User-ID` header and the `householdId` in the body.
*   **API Response:** Ensure the API returns the complete `CatType` object as expected by the `ADD_CAT` action in `CatsContext`.
*   **Profile Association:** The payload includes `householdId`. The API needs to ensure the authenticated user (`X-User-ID`) is correctly associated if the `cats` table tracks the creator/owner.
*   **Image Upload:** The flow for `ImageUpload` (how it uploads and returns a URL to the form) needs to be stable. Is it uploading directly to Supabase Storage?
*   **Error Handling:** Ensure specific API errors (e.g., validation errors on the backend, database errors) are communicated clearly to the user.

## `app/cats/[id]/client.tsx` (View Cat Details)

**Data Requirements:**

1.  **Cat ID:** Needs the specific cat `id` from URL parameter.
2.  **Specific Cat Data (`CatType`):** Needs full details of the cat identified by the ID.
3.  **Feeding Logs (`FeedingLog[]`):** Needs feeding logs specifically for this cat.
4.  **Cat's Schedule Info:** Needed to calculate `nextFeedingTime`. (Loading mechanism unclear).
5.  **Current User:** Potentially needed by `useFeeding` hook or for future actions.

**Information Flow Trace:**

1.  **Data Fetching (`useFeeding` hook):**
    *   Receives `id`.
    *   Likely retrieves the specific `cat` data: Either finds it in `CatsContext` state OR makes a direct API call (e.g., `GET /api/cats/[id]`). **(VERIFICATION NEEDED)**
    *   Likely fetches feeding `logs` for this cat: Makes an API call (e.g., `GET /api/feedings?catId=[id]`). Authorization via `X-User-ID` header needed.
    *   Fetches/Accesses the cat's `schedule` data. **(SOURCE UNCLEAR - Needs investigation: Is it part of CatType? Separate context? Separate API call?)**
    *   Calculates `nextFeedingTime` based on schedule and latest log.

2.  **Rendering:**
    *   Displays cat profile details from the fetched `cat` object.
    *   Displays `nextFeedingTime` and distance.
    *   Renders tabs for history (maps `logs`) and details (shows `cat.restrictions`, `cat.notes`).

3.  **Edit/Delete Navigation:** Links to edit page, triggers delete flow.

4.  **Delete Cat Interaction (`handleDelete`):**
    *   Similar flow to `app/cats/page.tsx`: Optimistic `REMOVE_CAT` dispatch, `DELETE /api/cats/[id]` API call (needs authorization), error handling/rollback, redirect to `/cats`.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **`useFeeding` Hook:** Needs investigation. How does it fetch the specific cat? How does it fetch the schedule? Does it handle authorization correctly for its API calls?
*   **Schedule Data Source:** The origin and loading mechanism for schedule data is critical and unknown.
*   **API Authorization:** Ensure all API calls made (directly or via the hook) include and verify the `X-User-ID` header.
*   **Data Consistency:** Ensure the `CatType` used matches the data fetched, especially regarding optional `schedules` property.

## `app/cats/[id]/edit/page.tsx` (Edit Cat Form)

**Data Requirements:**

1.  **Cat ID:** Needs the specific cat `id` from URL parameter.
2.  **Current User & Household:** Needs `currentUser` (especially `householdId`) from `UserContext` for authorization checks and context access.
3.  **Existing Cat Data (`CatType`):** Needs the current data for the cat being edited to pre-populate the form. Fetched via `CatsContext` state.
4.  **Form Inputs:** User-provided edited cat details.

**Information Flow Trace:**

1.  **Initial Data Load & Auth Check:**
    *   Page uses `useUserContext()` and `useCats()`.
    *   `useEffect` hook waits for contexts to load and `params.id` to be available.
    *   Finds the specific `cat` within the `catsState.cats` array using `params.id`.
    *   **Authorization:** Checks if `foundCat.householdId` matches `currentUser.householdId`. Shows error if mismatch.
    *   If authorized and found, pre-populates local form state (`formData`) with existing cat data.
    *   Handles loading/error states if cat not found or user not authorized.

2.  **Form Rendering & Input:**
    *   Renders the form, binding inputs to the local `formData` state.
    *   Includes `<ImageUpload>` component.

3.  **Save Submission (`handleSubmit`):**
    *   User submits the form.
    *   Performs authorization check again.
    *   Constructs payload (`updatedData`) with values from `formData`.
    *   **API Call:** Sends a `PUT` request to `/api/cats/[id]`.
        *   **Request Body:** Contains fields to be updated.
        *   **API Route (`app/api/cats/[id]/route.ts` - *assumed*):** Needs `PUT` handler.
            *   **Authorization:** Must read `X-User-ID` header, verify user belongs to the household associated with this `catId`.
            *   **Operation:** Perform `prisma.cats.update({ where: { id: catId }, data: payload })`.
            *   **Response:** Return the fully updated `CatType` object or an error.
    *   **Response Handling:**
        *   **If Success:** Parses the returned updated cat data.
        *   **Context Update:** Dispatches `UPDATE_CAT` to `CatsContext` with the updated cat payload.
        *   **Redirect:** Navigates user back to `/cats/[id]`.
        *   **If Error:** Displays error toast.

4.  **Delete Action (`handleDelete`):**
    *   User clicks delete button, triggers confirmation dialog.
    *   Similar flow to delete on list/details page: Authorization check, optimistic `REMOVE_CAT` dispatch, `DELETE /api/cats/[id]` API call (needs authorization), error handling/rollback, redirect to `/cats`.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **Initial Data Source:** Relies solely on `CatsContext` for initial data. If the user navigates directly to the edit page, the context might not be populated yet, or the specific cat might be missing if the context fetch failed. Consider adding a direct API fetch (`GET /api/cats/[id]`) as a fallback or primary source for robustness.
*   **API Authorization:** Critical to ensure `PUT` and `DELETE` handlers for `/api/cats/[id]` have robust authorization checks based on `X-User-ID`.
*   **API Response (PUT):** Ensure the `PUT` API returns the *complete*, updated `CatType` object as expected by the `UPDATE_CAT` action.
*   **Concurrency/Stale Data:** If data is edited elsewhere while the user is on this form, they might overwrite changes. Low risk for this app, but consider mechanisms like ETags or versioning if it becomes an issue.
*   **Form State Management:** Uses local state (`formData`) and manual `handleChange`. Could potentially use `react-hook-form` like the `new` page for consistency, although manual state is also fine.

## `app/feedings/page.tsx` (Feeding History List)

**Data Requirements:**

1.  **Current User & Household:** Needs `currentUser` (especially `householdId`) from `UserContext` for authorization and filtering.
2.  **List of Cats (`CatType[]`):** Needs `cats` from `CatsContext` to display cat names and potentially filter logs.
3.  **List of Feeding Logs (`FeedingLog[]`):** Needs `feedingLogs` from `FeedingContext` as the primary data source for the household.

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Page uses `useUserContext()`, `useCats()`, and `useFeeding()`.
    *   Handles combined loading states (`isLoadingUser`, `isLoadingCats`, `isLoadingFeedings`).
    *   Checks `currentUser`. If not present (after loading), redirects to login.
    *   Checks `currentUser.householdId`. If not present, shows an `<EmptyState>` prompting household setup.
    *   Relies on `UserContext`, `CatsContext`, and `FeedingContext` having loaded their respective data based on the authenticated user and household ID.

2.  **Filtering & Sorting:**
    *   User types in search input (`searchTerm`) or changes sort order (`sortOrder`).
    *   `useMemo` hook `filteredAndSortedLogs` re-calculates:
        *   Filters `feedingLogs` based on `searchTerm` matching cat name (from `cats` context), log notes, or user name (from `log.user`).
        *   Sorts the filtered logs based on `sortOrder` (timestamp asc/desc).

3.  **Grouping & Rendering:**
    *   `useMemo` hook `groupedLogs` calls `groupLogsByDate` utility on the `filteredAndSortedLogs`.
    *   Renders the logs, grouped by date, likely using `<Timeline>` and `<TimelineItem>` components.
    *   Displays associated cat and user info for each log.

4.  **Delete Log Interaction (`handleDeleteFeedingLog`):**
    *   User triggers delete for a specific log (ID passed to handler).
    *   **Optimistic Update:** Dispatches `REMOVE_FEEDING` to `FeedingContext` with the log object to remove it locally.
    *   **API Call:** Sends `DELETE` request to `/api/feedings/[logId]`.
        *   **API Route (`app/api/feedings/[id]/route.ts` - *assumed*):** Needs `DELETE` handler.
            *   **Authorization:** Read `X-User-ID`, find log by `logId`, verify user belongs to log's household.
            *   **Operation:** `prisma.feeding_logs.delete({ where: { id: logId } })`.
            *   **Response:** Success or error.
    *   **Response Handling:**
        *   **If Success:** Show success toast.
        *   **If Error:** Show error toast, revert state by dispatching `FETCH_SUCCESS` with original logs.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **API Authorization:** Critical to ensure the `DELETE /api/feedings/[id]` handler has robust authorization checks based on `X-User-ID` and the log's household membership.
*   **Context Reliability:** Page assumes all contexts (`User`, `Cats`, `Feeding`) load successfully. Needs robust handling of potential errors in any of these contexts.
*   **Performance:** Filtering/sorting/grouping large numbers of logs client-side could become slow. Consider server-side pagination, filtering, and sorting if performance degrades.
*   **ID Format:** The delete handler expects a `number` for `logId`, but previous refs suggest IDs might be UUID strings now. **CRITICAL:** Verify the ID format used throughout the feeding log flow (context state, API routes, component props) and ensure consistency (likely should be UUID strings).
*   **State Reversion:** The error handling for delete correctly attempts to revert state using `FETCH_SUCCESS`, but this replaces the entire list. A more targeted `ADD_FEEDING` with the deleted log might be slightly cleaner if feasible, but the current approach is acceptable if it works reliably.
*   **Duplicate History Page:** Compare functionality with `app/history/page.tsx` to see if they are redundant.

## `app/feedings/new/page.tsx` (New Feeding Form)

**Data Requirements:**

1.  **Current User & Household:** Needs `currentUser` (especially `id` and `householdId`) from `UserContext` for authorization and associating logs.
2.  **List of Cats (`CatType[]`):** Needs `cats` from `CatsContext` to display selectable cats and their default portions.
3.  **List of Feeding Logs (`FeedingLog[]`):** Needs `feedingLogs` from `FeedingContext` (filtered/sorted internally) to display the last feeding time for each cat.
4.  **Form Inputs:** User selections (`selectedCats`) and inputs for portion, notes, and status per selected cat.

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Page uses `useUserContext()`, `useCats()`, `useFeeding()`.
    *   Handles loading states and checks for `currentUser` and `currentUser.householdId`. Shows errors or empty states if required data/auth is missing.

2.  **Form Rendering & Initialization:**
    *   Displays a list of cats from `CatsContext`.
    *   Shows the last feeding time for each cat (derived from `FeedingContext`).
    *   Initializes portion inputs based on `cat.portion_size` from `CatsContext`.
    *   Manages inputs (portion, notes, status) per cat using local state objects keyed by cat ID.
    *   Manages the list of selected cats in local state.

3.  **Form Submission (`handleFeed`):**
    *   User clicks the submit button.
    *   Performs client-side validation (at least one cat selected, valid portions).
    *   Constructs an array (`logsToCreate`) of new log objects for selected cats, using current timestamp, `currentUser.id`, and per-cat inputs.
    *   **API Call:** Sends `POST` request to `/api/feedings/batch`.
        *   **Request Body:** Contains `{ logs: logsToCreate }` array.
        *   **API Route (`app/api/feedings/batch/route.ts` - *assumed*):** Needs `POST` handler.
            *   **Authorization:** Read `X-User-ID`. Verify user belongs to the household associated with *each* `catId` in the input array.
            *   **Operation:** Create multiple `feeding_logs` records in Prisma (ideally within a transaction).
            *   **Response:** Return array of created `FeedingLog` objects or error.
    *   **Response Handling:**
        *   **If Success:** Parses the returned `createdLogs` array.
        *   **Context Update:** **MISSING.** Needs to dispatch an action (e.g., `ADD_FEEDING_BATCH`) to `FeedingContext` with the `createdLogs` payload to update the UI state without a full refresh.
        *   Resets local form state.
        *   Shows success toast.
        *   **If Error:** Displays error toast.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **Context Update on Success:** The biggest gap is the missing dispatch to `FeedingContext` after successfully creating logs via the batch API. The UI won't reflect the new logs immediately.
*   **API Authorization:** Critical to ensure the `POST /api/feedings/batch` handler performs authorization for *each* log being created based on `X-User-ID`.
*   **Batch API Implementation:** Ensure the batch API route exists, handles transactions correctly in Prisma, and returns the expected array of created logs.
*   **Initial Data Loading:** Relies on `CatsContext` and `FeedingContext` being populated. Ensure robust handling if these contexts have errors.
*   **Form State Complexity:** Managing state for multiple cats (portions, notes, status) in separate objects keyed by ID can become complex. Consider if consolidating into a single state object or using a more structured approach might be better, although the current method works.

## `app/feedings/[id]/page.tsx` (View Feeding Details)

**Data Requirements:**

1.  **Feeding Log ID:** Needs the specific `id` from the URL parameter.
2.  **Current User & Household:** Needs `currentUser` (especially `householdId`) from `UserContext` for authorization.
3.  **Specific Feeding Log (`FeedingLogDetails`):** Needs the full details of the specific log, including nested `cat` and `user` information.

**Information Flow Trace:**

1.  **Parameter Handling & Auth Check:**
    *   Gets `id` from `params` (using `use(params)`).
    *   Checks if `id` is a valid number format (potential inconsistency with UUIDs).
    *   Uses `useUserContext()` and waits for `currentUser`.
    *   Checks for `currentUser.householdId`. Handles loading/error/unauthorized states.

2.  **Data Fetching (`fetchFeedingLog` in `useEffect`):**
    *   Makes a direct API call: `GET /api/feedings/[logId]`.
    *   **API Route (`app/api/feedings/[id]/route.ts` - *assumed*):** Needs `GET` handler.
        *   **Authorization:** Read `X-User-ID`, find log by `logId`, verify user belongs to log's household.
        *   **Operation:** Fetch log from Prisma, including `cat` and `user` relations.
        *   **Response:** Return `FeedingLog` object or error.
    *   **Client-side Auth Check:** Performs redundant check comparing fetched log's household to `currentUser.householdId`.
    *   Sets fetched data into local `feedingLog` state.

3.  **Rendering:**
    *   Displays details from the `feedingLog` state (cat name/photo, timestamp, portion, notes, user name).

4.  **Delete Interaction (`handleDelete`):**
    *   Performs client-side authorization check.
    *   **API Call:** Sends `DELETE` request to `/api/feedings/[logId]`. (API needs authorization).
    *   **Context Update:** No dispatch to `FeedingContext`.
    *   **Redirect:** Navigates to `/feedings` on success.
    *   Handles API errors.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **ID Format:** **CRITICAL.** The check `isNaN(parseInt(logId))` strongly suggests it expects a number, contradicting the likely UUID format used elsewhere (e.g., `FeedingLog` type definition, Prisma schema). This needs immediate investigation and standardization (likely to UUID strings).
*   **Data Fetching Method:** This page fetches its data directly via `fetch`, unlike list pages which rely on contexts. This leads to potential state inconsistencies (deleting here doesn't update the list page's context immediately).
*   **API Authorization:** Ensure the `GET` and `DELETE` handlers for `/api/feedings/[id]` have robust authorization checks based on `X-User-ID`.
*   **Redundant Auth Check:** The client-side household check after fetching is unnecessary if the API authorization is correct.
*   **Context Update on Delete:** Lack of context update on delete means the main feeding list (`/feedings`) will show the deleted item until a full refresh.

## `app/households/page.tsx` (Manage Households)

**Data Requirements:**

1.  **Current User:** Needs `currentUser` from `UserContext` for authorization checks (isAdmin) and context loading.
2.  **List of Households (`HouseholdType[]`):** Needs the list of households the current user is a member of, including owner details and member list with roles. This data likely comes from `HouseholdContext`.

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Page uses `useUserContext()` and `useHousehold()`.
    *   Handles combined loading states.
    *   Checks `currentUser`. Redirects to login if not authenticated.
    *   Relies on `HouseholdContext` to fetch the list of households associated with the `currentUser.id`.
        *   **`HouseholdContext` (NEEDS VERIFICATION):** Likely fetches from an API endpoint like `GET /api/households` or `GET /api/users/me/households`. The API needs to query based on the authenticated user (`X-User-ID`) and potentially join with `household_members` and `profiles` tables to return the required structure (including owner and members with roles).

2.  **Rendering:**
    *   If no households, displays `<EmptyHouseholdsState>` with options to create/join.
    *   If households exist, maps over the `households` array from `HouseholdContext`.
    *   For each household, renders a card displaying name, members.
    *   Uses `isAdmin` callback (checking `owner.id` or `members[].role`) to conditionally render edit/delete options in a dropdown menu.

3.  **Delete Household Interaction (`handleDeleteHousehold`):**
    *   Triggered from dropdown (likely via confirmation).
    *   **API Call:** Sends `DELETE` request to `/api/households/[id]`.
        *   **API Route (`app/api/households/[id]/route.ts` - *assumed*):** Needs `DELETE` handler.
            *   **Authorization:** Read `X-User-ID`. Verify user is owner or admin of the target `householdId`.
            *   **Operation:** Delete household and potentially related data (members, cats, logs, etc.). Cascade logic is critical.
            *   **Response:** Success or error.
    *   **Response Handling:**
        *   **If Success:** Show success toast. Dispatch `DELETE_HOUSEHOLD` to `HouseholdContext`.
        *   **If Error:** Show error toast. Dispatch `SET_HOUSEHOLDS` with previous list to revert (potential state inconsistency risk if original fetch failed partially).

**Potential Breakpoints / Areas for Refactor Focus:**

*   **`HouseholdContext` Implementation:** **CRITICAL:** Verify how `HouseholdContext` fetches data. What API does it call? Does the API return the necessary nested data (owner, members with roles)? Does the API perform authorization correctly based on `X-User-ID`?
*   **API Authorization (DELETE):** The API must strictly enforce that only admins/owners can delete a household.
*   **Cascade Deletion Logic:** The backend delete operation needs careful implementation to handle removal of all associated data correctly (or alternatively, implement soft deletes/archiving).
*   **`isAdmin` Logic:** The client-side `isAdmin` check seems reasonable but ensure the data it relies on (`owner`, `members`, `role`) is consistently provided by the `HouseholdContext` fetch.
*   **State Reversion on Delete Error:** Reverting state by resetting the entire list might be problematic if the initial load wasn't fully successful. A more robust error handling might be needed.

## `app/households/create/page.tsx` (Create Household Form)

**Data Requirements:**

1.  **Current User:** Needs `currentUser` from `UserContext` to associate the new household and ensure user is logged in.
2.  **Form Input:** User-provided `householdName`.

**Information Flow Trace:**

1.  **Auth Check:**
    *   Page uses `useUserContext()`.
    *   Redirects to login if `currentUser` is not available after loading.

2.  **Form Rendering & Input:**
    *   Renders a simple form with an input for `householdName`.

3.  **Form Submission (`handleCreateHousehold`):**
    *   Validates name is not empty and user is logged in.
    *   **API Call:** Sends `POST` request to `/api/households`.
        *   **Request Body:** `{ name: householdName }`.
        *   **API Route (`app/api/households/route.ts` - *assumed*):** Needs `POST` handler.
            *   **Authorization:** Read `X-User-ID` header.
            *   **Operation:** Create `households` record (setting `owner_id` to `X-User-ID`). **Also create `household_members` record** linking user to the new household with an admin/owner role.
            *   **Response:** Return the created `Household` object or error.
    *   **Response Handling:**
        *   **If Success:** Parses `newHousehold` response.
        *   **Context Update:** Dispatches `ADD_HOUSEHOLD` to `HouseholdContext`. Dispatches `SET_CURRENT_USER` to `UserContext` to update `currentUser.householdId` if it was previously null.
        *   **Redirect:** Navigates to `/households/[newHousehold.id]`.
        *   **If Error:** Shows error toast.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **API Implementation:** **CRITICAL:** The `POST /api/households` API route must perform both the household creation *and* the initial household member creation for the owner. Failing to create the member record will lock the user out of the household they just created.
*   **API Authorization:** Ensure the API route requires an authenticated user (`X-User-ID`).
*   **API Response:** Ensure the API returns a complete `Household` object that matches the type expected by the `ADD_HOUSEHOLD` action.
*   **Context Updates:** Ensure the dispatches to both `HouseholdContext` and potentially `UserContext` work correctly to reflect the new state.
*   **Duplicate Page:** Compare with `app/households/new/page.tsx` to confirm if they are functionally identical.

## `app/households/new/page.tsx` (New Household Form - Compare with `create`)

**Data Requirements:**

1.  **Current User:** Needs `currentUser` from `UserContext` for association and auth check.
2.  **Form Input:** User-provided `name` (validated by Zod).

**Information Flow Trace:**

1.  **Auth Check:**
    *   Page uses `useUserContext()`.
    *   Redirects to login if `currentUser` is not available after loading.

2.  **Form Rendering & Input:**
    *   Renders the form using `react-hook-form` and Zod schema (`formSchema`).

3.  **Form Submission (`onSubmit`):**
    *   Validates user is logged in.
    *   `react-hook-form` handles Zod validation.
    *   **API Call:** Sends `POST` request to `/api/households`.
        *   **Request Body:** `{ name: values.name }`.
        *   **API Route (`app/api/households/route.ts` - *assumed*):** Needs `POST` handler (Same as for `create` page).
            *   **Authorization:** Read `X-User-ID`.
            *   **Operation:** Create `households` record (setting `owner_id`). **Also create `household_members` record** linking user to household.
            *   **Response:** Return created `Household` object or error.
    *   **Response Handling:**
        *   **If Success:** Parses response.
        *   **Context Update:** Calls `refetchUser()` from `UserContext`. This implicitly assumes the refetch logic in `UserContext` will update the `currentUser` (with the new `householdId`) and potentially trigger a refresh in `HouseholdContext`.
        *   **Redirect:** Navigates to `/` (dashboard).
        *   **If Error:** Shows error toast/message.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **Redundancy:** This page is functionally almost identical to `app/households/create/page.tsx`. Decide which one to keep and remove the other. The `new` page uses more standard form handling (`react-hook-form`) and a potentially cleaner context update pattern (`refetchUser`), making it a likely candidate to keep.
*   **API Implementation:** Same critical dependency as the `create` page: the `POST /api/households` API route *must* create both the household and the initial member record.
*   **`refetchUser()` Reliability:** Ensure the `refetchUser` function in `UserContext` reliably updates the necessary state (`currentUser.householdId`) and triggers downstream context refreshes (like `HouseholdContext`) if they depend on `UserContext`.
*   **Redirect Target:** Redirecting to `/` might be less intuitive than redirecting to the new household's detail page (`/households/[id]`) as the `create` page does.
3.  **Join Action (`handleJoinHousehold`):**
    *   Validates code is not empty and user is logged in.
    *   **API Call:** Sends `POST` request to `/api/households/join`.
        *   **Request Body:** `{ inviteCode: inviteCode.trim() }`.
        *   **API Route (`app/api/households/join/route.ts` - *assumed*):** Needs `POST` handler.
            *   **Authorization:** Read `X-User-ID` header.
            *   **Operation:**
                *   Find the `households` record matching the `inviteCode`. If not found or expired, return error.
                *   Check if the user (`X-User-ID`) is already a member of this household. If so, return error/success message.
                *   Create a new `household_members` record linking the user to the found household (default role: 'member').
                *   Potentially update the user's `profiles` record to set the `householdId` if it's their first/primary household.
            *   **Response:** Return `{ household: joinedHouseholdData, user: updatedUserData }` or error. Needs to include enough data for context updates.
    *   **Response Handling:**
        *   **If Success:** Parses `joinedHousehold` and `updatedUser` from response.
        *   **Context Update:** Dispatches `ADD_HOUSEHOLD` to `HouseholdContext`. Dispatches `SET_USER` to `UserContext` (this seems incorrect, should likely be `SET_CURRENT_USER` or similar, and needs the correct payload structure).
        *   **Redirect:** Navigates to `/households`.
        *   **If Error:** Shows error toast.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **API Implementation:** Ensure `POST /api/households/join` correctly validates the code, checks for existing membership, creates the `household_members` record, and potentially updates the user profile's primary household link.
*   **API Authorization:** Ensure the API requires an authenticated user (`X-User-ID`).
*   **API Response:** Ensure the API returns sufficient data for the context updates (`household` and `user` objects).
*   **Context Update (User):** The dispatch `userDispatch({ type: "SET_USER", payload: updatedUser });` looks suspicious. Verify the correct action type (`SET_CURRENT_USER`?) and payload structure expected by `UserContext`.
*   **Invite Code Validity:** Consider adding expiration or usage limits to invite codes on the backend.

## `app/notifications/page.tsx` (List Notifications)

**Data Requirements:**

1.  **List of Notifications (`Notification[]`):** Needs the user's notifications, including ID, type, title, message, creation date, and read status. This data comes from `NotificationContext`.
2.  **Unread Count:** Needs the count of unread notifications, also from `NotificationContext`.

**Information Flow Trace:**

1.  **Context Loading:**
    *   Page uses `useNotifications()` from `NotificationContext`.
    *   Relies on `NotificationContext` to fetch the `notifications` list and `unreadCount`.
        *   **`NotificationContext` (NEEDS VERIFICATION):** Likely fetches from an API endpoint like `GET /api/notifications`.
            *   **API Route (`app/api/notifications/route.ts` - *assumed*):** Needs `GET` handler.
                *   **Authorization:** Read `X-User-ID` header.
                *   **Operation:** Fetch notifications from Prisma (`prisma.notifications`) where `userId` matches `X-User-ID`. Order by `createdAt` descending.
                *   **Response:** Return array of `Notification` objects.
    *   Context manages `isLoading` and `error` states.
2.  **Rendering:**
    *   Displays header with title and back button.
    *   Shows "Mark all as read" button if `unreadCount > 0`.
    *   Shows loading, error, or empty states based on context state.
    *   If notifications exist, sorts them by date (`useMemo`).
    *   Maps over sorted notifications, rendering each using `<NotificationItem>`.
3.  **Actions (delegated to context):**
    *   **Mark Read (`handleMarkRead` in `NotificationItem`):**
        *   Calls `markAsRead(id)` from `NotificationContext`.
        *   **`NotificationContext`:** Likely calls `PATCH /api/notifications/[id]` with `{ isRead: true }`.
            *   **API Route:** Needs `PATCH` handler, authorize user, update `isRead` field in Prisma.
    *   **Mark All Read (`handleMarkAllRead`):**
        *   Calls `markAllAsRead()` from `NotificationContext`.
        *   **`NotificationContext`:** Likely calls `PATCH /api/notifications/mark-all-read` (or similar bulk update endpoint).
            *   **API Route:** Needs handler, authorize user, update `isRead` for all user's notifications in Prisma.
    *   **Remove (`handleRemove` in `NotificationItem`):**
        *   Calls `removeNotification(id)` from `NotificationContext`.
        *   **`NotificationContext`:** Likely calls `DELETE /api/notifications/[id]`.
            *   **API Route:** Needs `DELETE` handler, authorize user, delete notification from Prisma.
    *   Context handles optimistic updates or refetching after actions.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **`NotificationContext` Implementation:** **CRITICAL:** Verify `NotificationContext` implementation, including the API calls for fetching, marking read (single/all), and deleting. Ensure the API routes exist and have correct authorization.
*   **API Authorization:** All notification API endpoints must enforce user ownership (`X-User-ID`).
*   **Context State Management:** Ensure the context correctly handles state updates (optimistic or refetch) after actions like mark read/delete to keep the UI consistent.
*   **Performance:** If the number of notifications can grow large, consider adding pagination to the API and context.

## `app/schedule/page.tsx` (List Schedules - Duplicate?)

**Data Requirements:**

1.  **Current User & Household:** Needs `currentUser` (including `householdId`) from `UserContext` for authorization and context loading.
2.  **List of Schedules (`ScheduleType[]`):** Needs the list of schedules associated with the current household, likely including nested cat information for display. This data comes from `ScheduleContext`.

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Page uses `useUserContext()` and `useScheduleContext()`.
    *   Handles combined loading states. Redirects if not logged in.
    *   Shows an empty state if `currentUser` has no `householdId`.
    *   Relies on `ScheduleContext` to fetch the `schedules` list for the `currentUser.householdId`.
        *   **`ScheduleContext` (NEEDS VERIFICATION):** Likely fetches from `GET /api/schedules?householdId=...`.
            *   **API Route (`app/api/schedules/route.ts` - *assumed*):** Needs `GET` handler.
                *   **Authorization:** Read `X-User-ID`, verify user belongs to `householdId`.
                *   **Operation:** Fetch schedules from Prisma, potentially joining with `cats` table, filtering by `householdId`.
                *   **Response:** Return array of `ScheduleType` objects.
    *   Context manages `isLoading` and `error` states.
2.  **Rendering:**
    *   Displays a header with title and a link to create new (`/schedules/new`).
    *   Includes a search input (`searchTerm`).
    *   Filters schedules based on `searchTerm` (client-side, `useMemo`).
    *   Renders loading/error/empty states.
    *   If schedules exist, maps over `filteredSchedules`.
    *   For each schedule:
        *   Renders a card showing cat avatar/name (needs `schedule.cat`), schedule type/details (`formatScheduleText`), and potentially next feeding time (logic not shown in this part).
        *   Provides Edit/Delete buttons (actions likely gated by permissions).
3.  **Delete Action (`handleDeleteSchedule`):**
    *   Triggered by delete button (likely needs confirmation).
    *   **Optimistic Update:** Dispatches `DELETE_SCHEDULE` to `ScheduleContext`.
    *   **API Call:** Sends `DELETE` request to `/api/schedules/[id]`.
        *   **API Route (`app/api/schedules/[id]/route.ts` - *assumed*):** Needs `DELETE` handler.
            *   **Authorization:** Read `X-User-ID`. Verify user can delete this schedule (belongs to their household, potentially admin only?).
            *   **Operation:** `prisma.schedules.delete({ where: { id } })`.
            *   **Response:** Success or error.
    *   **Response Handling:**
        *   **If Success:** Shows success toast.
        *   **If Error:** Shows error toast. Reverts state by dispatching `SET_SCHEDULES` with the previous list (potential inconsistency risk).

**Potential Breakpoints / Areas for Refactor Focus:**

*   **`ScheduleContext` Implementation:** **CRITICAL:** Verify `ScheduleContext`, its API call (`GET /api/schedules`), and the data structure returned (does it include nested `cat`?).
*   **API Authorization:** Ensure `GET /api/schedules` and `DELETE /api/schedules/[id]` have correct authorization (household membership, potentially admin for delete).
*   **Data Structure:** Ensure `ScheduleType` in `lib/types.ts` matches the data fetched/used. Does it include the `cat` object?
*   **State Reversion on Delete Error:** Reverting state using the full previous list can be unreliable.
*   **Duplicate Page:** Compare functionality with `app/schedules/page.tsx` to see if they are duplicates. This page uses `/schedules/new` as the link for creating new ones.

## `app/schedule/new/page.tsx` (New Schedule Form - Duplicate?)

**Data Requirements:**

1.  **List of Cats (`CatType[]`):** Needs the list of cats in the user's household to populate the dropdown. **It currently uses a function `getCats()` from `@/lib/data` which seems independent of `CatsContext`. This is an inconsistency.**
2.  **Current User:** Needs `currentUser` from `UserContext` to implicitly associate the schedule with the household (though not explicitly sent in the API call).
3.  **Form Inputs:** Cat selection, schedule type ('interval' or 'fixedTime'), interval hours, or list of fixed times.

**Information Flow Trace:**

1.  **Auth Check:** Implicitly relies on parent layout/middleware for authentication. **Doesn't explicitly check `currentUser` within the component, which is a potential issue if accessed directly.**
2.  **Data Fetching:**
    *   `useEffect` calls `getCats()` from `@/lib/data` to load the cat list into local state (`cats`).
        *   **`lib/data/getCats()` (NEEDS VERIFICATION):** How does this function get cats? Does it make an API call? Does it handle authorization based on the user's household? It should ideally use `GET /api/cats` or `/api/households/[householdId]/cats`.
3.  **Form Rendering:**
    *   Uses `react-hook-form` and Zod schema.
    *   Renders a dropdown to select a cat (`cats` state).
    *   Uses tabs to switch between "Interval" and "Horário Fixo" (Fixed Time).
    *   Conditional inputs for interval hours or a dynamic list of time inputs (`TimeField` component). Manages `selectedTimes` in local state and syncs to `form.setValue("times", ...)` for fixed times.
4.  **Form Submission (`onSubmit`):**
    *   Performs client-side validation based on selected type.
    *   **API Call:** Sends `POST` request to `/api/schedules`.
        *   **Request Body:** `{ catId: parseInt(values.catId), type: values.type, interval: ..., times: ... }`. **Note:** Sends `catId` as an integer, potential inconsistency with UUIDs. Does not explicitly send `householdId`.
        *   **API Route (`app/api/schedules/route.ts` - *assumed*):** Needs `POST` handler.
            *   **Authorization:** Read `X-User-ID`. Find the user's `householdId`. Verify the provided `catId` belongs to that household.
            *   **Operation:** Create `schedules` record in Prisma, linking to `catId` and `householdId`. Store interval or formatted times string.
            *   **Response:** Return created `ScheduleType` object or error.
    *   **Response Handling:**
        *   **If Success:** Shows success toast. Redirects to `/schedule`. Calls `router.refresh()` (standard Next.js way to refetch data for current route/layout).
        *   **If Error:** Shows error toast.
        *   **Context Update:** No explicit dispatch to `ScheduleContext`. Relies on `router.refresh()` and the context potentially refetching on the `/schedule` page.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **Data Fetching (`getCats`):** **CRITICAL:** Investigate `lib/data/getCats()`. It should use the standard API (`/api/cats` or similar) and respect user context/authorization, not be a separate mechanism. Using `CatsContext` would be more consistent.
*   **Authorization:** Page lacks explicit user auth check. API route *must* verify user is authenticated and `catId` belongs to their household.
*   **ID Format:** Sending `catId` as `parseInt()` likely conflicts with UUID usage elsewhere. Standardize on UUID strings.
*   **`householdId`:** API needs to derive `householdId` from the authenticated user (`X-User-ID`), as it's not sent in the request body.
*   **Context Update:** Relying solely on `router.refresh()` might not reliably update `ScheduleContext` if the list page doesn't refetch automatically. Consider dispatching `ADD_SCHEDULE` on success.
*   **Duplicate Page:** Compare with `app/schedules/new/page.tsx`.

## `app/schedules/page.tsx` (List Schedules - Duplicate?)

**Data Requirements:**

1.  **Current User & Household:** Needs `currentUser` (including `householdId`) from `UserContext`.
2.  **List of Schedules (`ScheduleType[]`):** Needs schedules from `ScheduleContext`.
3.  **List of Cats (`CatType[]`):** Needs cats from `CatsContext` to display names and calculate timeline events.

**Information Flow Trace:**

1.  **Context Loading & Auth Check:**
    *   Uses `useUserContext()`, `useScheduleContext()`, `useCats()`.
    *   Handles combined loading/error states. Redirects if not logged in. Shows empty state if no `householdId`.
    *   Relies on `ScheduleContext` to fetch schedules and `CatsContext` to fetch cats.
    *   Includes a `useEffect` block that seems intended to trigger a fetch if schedules are empty, but the fetch logic itself is commented out/missing, suggesting reliance on the context provider.
2.  **Rendering:**
    *   Displays header with link to `/schedules/new`.
    *   Shows loading/error/empty states. The empty state prompts user to add cats if none exist, or create schedules.
    *   If schedules exist:
        *   Filters for `enabled` schedules.
        *   Sorts schedules based on `getNextScheduledTime` utility.
        *   Renders sorted schedules using `<ScheduleItem>`.
        *   Calculates upcoming feeding events (`timelineEvents`) using `getNextScheduledTime` and renders `<FeedingTimeline>`.
3.  **Delete Action (`handleDeleteSchedule`):**
    *   Identical logic to `app/schedule/page.tsx`: optimistic `DELETE_SCHEDULE` dispatch, `DELETE /api/schedules/[id]` call, error handling with state reversion.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **DUPLICATE:** This page is functionally redundant with `app/schedule/page.tsx`. Decide which one to keep and remove the other. This one uses `/schedules/new` for the create link, aligning with its own path.
*   **Context Fetching:** The `useEffect` logic to trigger fetches is incomplete/unclear. Ensure the context provider handles initial data loading robustly.
*   **API & Context:** Same dependencies as `app/schedule/page.tsx` regarding `ScheduleContext`, API routes (`GET`, `DELETE`), authorization, and state reversion on error.
*   **Utility Functions:** Relies on `getNextScheduledTime` from `dateUtils`. Ensure this utility works correctly with the `ScheduleType` data.
4.  **Actions:** **No delete functionality** is visible in this component, unlike `app/feedings/page.tsx`.

**Potential Breakpoints / Areas for Refactor Focus:**

*   **DUPLICATE:** This page is functionally redundant with `app/feedings/page.tsx`. `app/feedings/page.tsx` seems more integrated with the context system and includes delete functionality. This `history` page uses direct data fetching functions (`@/lib/data`) and local state management, making it inconsistent with the rest of the app's patterns. **Recommendation: Remove this page and use `app/feedings/page.tsx`.**
*   **Data Fetching (`@/lib/data`):** **CRITICAL:** If keeping this page (not recommended), investigate `getFeedingLogs` and `getCats`. They must use authorized API calls based on the user's context, not bypass the standard data flow.
*   **Context Inconsistency:** Does not use `FeedingContext` or `CatsContext`, leading to potential stale data and lack of real-time updates from other parts of the app.
*   **ID Format:** Uses `parseInt(selectedCat)`, suggesting potential ID format inconsistency (number vs. UUID string).

2. **Client-Side Authentication**
   - Use `createBrowserClient` from `@supabase/ssr` for client components
   - Implement proper auth state management through context
   - Handle auth state changes consistently

3. **Middleware Authentication**
   - Use specialized middleware client for auth checks
   - Implement proper session refresh logic
   - Handle cookie operations correctly

## Implementation Details

### Server Components & API Routes
```
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function ServerComponent() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    // Handle unauthorized state
    return null
  }
  
  // Proceed with authenticated logic
}
```

### Client Components
```
import { createClient } from '@/utils/supabase/client'

export default function ClientComponent() {
  const supabase = createClient()
  
  // Use supabase client for auth operations
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }
}
```

### Middleware Implementation
```
import { createClient } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(req, res)
  
  await supabase.auth.getSession()
  
  return res
}
```

## Best Practices

1. **Error Handling**
   - Always implement proper error handling for auth operations
   - Use type-safe error handling patterns
   - Provide meaningful error messages to users

2. **State Management**
   - Use context for managing auth state
   - Implement proper loading states
   - Handle auth state changes consistently

3. **Security**
   - Never expose sensitive auth data in client
   - Implement proper CSRF protection
   - Use secure cookie settings

4. **Performance**
   - Implement proper caching for auth state
   - Minimize unnecessary auth checks
   - Handle auth operations asynchronously

## Common Patterns

1. **Protected Routes**
```
// middleware.ts
export const config = {
  matcher: ['/protected/:path*']
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(req, res)
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  
  return res
}
```

2. **Auth Context**
```
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({
  user: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

3. **Protected API Routes**
```
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Proceed with authenticated logic
}
```

## Testing Considerations

1. **Unit Tests**
   - Mock Supabase client appropriately
   - Test auth state changes
   - Test error conditions

2. **Integration Tests**
   - Test complete auth flows
   - Verify cookie handling
   - Test protected routes

3. **E2E Tests**
   - Test real auth flows
   - Verify redirects
   - Test session management

# Implementation Patterns & Rules

## React Query Integration Pattern

The Cats feature establishes a pattern for data fetching and state management using React Query that should be replicated across other features:

```typescript
// Hook Structure (e.g., useCats.ts)
export function useResourceHook(householdId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  // Main query hook
  const query = useQuery({
    queryKey: ['resourceName', householdId],
    queryFn: fetchResource,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('login') || error?.message?.includes('access')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // CRUD mutations
  const addMutation = useMutation({
    mutationFn: addResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceName', householdId] });
      toast({ title: 'Success', description: 'Resource added successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    add: addMutation.mutate,
    isAdding: addMutation.isPending,
    // ... other CRUD operations
  };
}
```

## API Route Implementation Pattern

API routes should follow this structure for consistency and security:

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  logger.info("[GET /api/route] Starting request", { requestId, params });

  try {
    // 1. Validate params
    if (!params.id) {
      logger.warn("[GET /api/route] Missing required param", { requestId });
      return NextResponse.json({ error: "Required parameter missing" }, { status: 400 });
    }

    // 2. Get auth user ID from middleware header
    const authUserId = request.headers.get('X-User-ID');
    if (!authUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 3. Verify resource access
    const authorized = await checkAuthorization(authUserId, params.id);
    if (!authorized) {
      logger.warn("[GET /api/route] Unauthorized access attempt", { requestId, userId: authUserId });
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // 4. Perform database operation
    const result = await prisma.resource.findMany({
      where: { household_id: params.id },
      // ... other query options
    });

    // 5. Return success response
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error("[GET /api/route] Unexpected error", { requestId, error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## UI Component Pattern

For resource management UIs, follow this structure:

1. **List Page Component:**
```typescript
export default function ResourceListPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Resource Title</h1>
        <AddResourceButton householdId={params.id} />
      </div>
      <ErrorBoundary fallback={<ErrorAlert />}>
        <Suspense fallback={<LoadingSpinner />}>
          <ResourceList householdId={params.id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

2. **List Component:**
```typescript
export function ResourceList({ householdId }: { householdId: string }) {
  const { data, isLoading } = useResource(householdId);
  const [itemToEdit, setItemToEdit] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  if (isLoading) return null; // Parent Suspense handles loading
  if (!data?.length) return <EmptyState />;

  return (
    <>
```

# Database Schema Documentation

## Overview
This schema manages a cat feeding and weight tracking application. It enforces household-based access control, tracks feeding schedules, and monitors cat weight progress through goals and milestones.

## Abbreviations
- **PK**: Primary Key
- **FK**: Foreign Key (links to another table)
- **NN**: Not Null (required field)
- **UQ**: Unique (no duplicates allowed)
- **TS**: Timestamp with timezone (TIMESTAMPTZ)
- **UUID**: Universally Unique Identifier

## Tables

### `cats`
- **Description**: Stores cat information and their basic attributes.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
  | name        | TEXT          | NN          | Cat's name                    |
  | birth_date  | DATE          |             | Cat's birth date              |
  | weight      | DECIMAL(5,2)  |             | Current weight                |
  | household_id| UUID          | FK, NN      | Associated household          |
  | owner_id    | UUID          | FK, NN      | Cat's owner profile          |

- **Relationships**:
  - References `households(id)` via `household_id`
  - References `profiles(id)` via `owner_id`
  - Referenced by `feeding_logs(cat_id)`
  - Referenced by `schedules(cat_id)`
  - Referenced by `cat_weight_logs(cat_id)`
  - Referenced by `weight_goals(cat_id)`

### `households`
- **Description**: Represents household units that group cats and members.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
  | name        | TEXT          | NN          | Household name                |
  | description | TEXT          |             | Optional description          |
  | owner_id    | UUID          | FK, NN      | Household owner's ID          |

- **Relationships**:
  - Referenced by `cats(household_id)`
  - Referenced by `household_members(household_id)`
  - Referenced by `feeding_logs(household_id)`

### `profiles`
- **Description**: Stores user profile information, linked to Supabase auth.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Matches Supabase auth.user.id |
  | updated_at  | TIMESTAMPTZ   | TS          | Last update timestamp         |
  | username    | TEXT          | UQ          | Unique username               |
  | full_name   | TEXT          |             | User's full name              |
  | avatar_url  | TEXT          |             | Profile picture URL           |
  | email       | TEXT          |             | User's email address          |

- **Relationships**:
  - Referenced by `cats(owner_id)`
  - Referenced by `household_members(user_id)`
  - Referenced by `feeding_logs(fed_by)`
  - Referenced by `cat_weight_logs(measured_by)`
  - Referenced by `weight_goals(created_by)`

### `household_members`
- **Description**: Maps users to households with roles.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | household_id| UUID          | FK, NN      | Associated household          |
  | user_id     | UUID          | FK, NN      | Associated user profile       |
  | role        | TEXT          | NN          | Member's role in household    |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |

- **Relationships**:
  - References `households(id)` via `household_id`
  - References `profiles(id)` via `user_id`
  - Unique constraint on `[household_id, user_id]`

### `feeding_logs`
- **Description**: Records individual feeding events for cats.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
  | cat_id      | UUID          | FK, NN      | Fed cat's ID                  |
  | household_id| UUID          | FK, NN      | Associated household          |
  | meal_type   | TEXT          | NN          | Type of meal                  |
  | amount      | DECIMAL(5,2)  | NN          | Amount of food                |
  | unit        | TEXT          | NN          | Unit of measurement           |
  | notes       | TEXT          |             | Optional notes                |
  | fed_by      | UUID          | FK          | User who fed the cat          |
  | fed_at      | TIMESTAMPTZ   | NN          | When feeding occurred         |

- **Relationships**:
  - References `cats(id)` via `cat_id`
  - References `profiles(id)` via `fed_by`
  - References `households(id)` via `household_id`

### `schedules`
- **Description**: Defines feeding schedules for cats.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | cat_id      | UUID          | FK, NN      | Associated cat                |
  | type        | TEXT          | NN          | Schedule type                 |
  | interval    | INTEGER       |             | Hours between feedings        |
  | times       | TEXT[]        | NN          | Array of feeding times        |
  | enabled     | BOOLEAN       | NN          | Schedule active status        |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete

### `cat_weight_logs`
- **Description**: Tracks cat weight measurements over time.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at  | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
  | weight      | DECIMAL(5,2)  | NN          | Measured weight               |
  | date        | DATE          | NN          | Measurement date              |
  | cat_id      | UUID          | FK, NN      | Associated cat                |
  | notes       | TEXT          |             | Optional notes                |
  | measured_by | UUID          | FK          | User who took measurement     |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete
  - References `profiles(id)` via `measured_by`

### `weight_goals`
- **Description**: Defines weight goals for cats.
- **Columns**:
  | Column        | Type          | Constraints | Description                    |
  |---------------|---------------|-------------|--------------------------------|
  | id            | UUID          | PK, NN      | Unique identifier             |
  | created_at    | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | updated_at    | TIMESTAMPTZ   | NN, TS      | Last update timestamp         |
  | cat_id        | UUID          | FK, NN      | Associated cat                |
  | target_weight | DECIMAL(5,2)  | NN          | Goal weight                   |
  | target_date   | DATE          |             | Target achievement date       |
  | start_weight  | DECIMAL(5,2)  |             | Starting weight               |
  | status        | TEXT          | NN          | Goal status                   |
  | notes         | TEXT          |             | Optional notes                |
  | created_by    | UUID          | FK, NN      | User who created goal         |

- **Relationships**:
  - References `cats(id)` via `cat_id` with CASCADE delete
  - References `profiles(id)` via `created_by`
  - Referenced by `weight_goal_milestones(goal_id)`

### `weight_goal_milestones`
- **Description**: Tracks progress milestones for weight goals.
- **Columns**:
  | Column      | Type          | Constraints | Description                    |
  |-------------|---------------|-------------|--------------------------------|
  | id          | UUID          | PK, NN      | Unique identifier             |
  | created_at  | TIMESTAMPTZ   | NN, TS      | Record creation timestamp     |
  | goal_id     | UUID          | FK, NN      | Associated weight goal        |
  | weight      | DECIMAL(5,2)  | NN          | Milestone weight              |
  | date        | DATE          | NN          | Target date                   |
  | notes       | TEXT          |             | Optional notes                |

- **Relationships**:
  - References `weight_goals(id)` via `goal_id` with CASCADE delete

### Example Data
```json
{
  "households": [{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Smith Family",
    "owner_id": "a67e23d0-e29b-41d4-a716-446655440000"
  }],
  "profiles": [{
    "id": "a67e23d0-e29b-41d4-a716-446655440000",
    "username": "jsmith",
    "full_name": "John Smith"
  }],
  "cats": [{
    "id": "b12c4a80-e29b-41d4-a716-446655440000",
    "name": "Whiskers",
    "household_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "a67e23d0-e29b-41d4-a716-446655440000"
  }],
  "feeding_logs": [{
    "id": "c98f2340-e29b-41d4-a716-446655440000",
    "cat_id": "b12c4a80-e29b-41d4-a716-446655440000",
    "meal_type": "breakfast",
    "amount": 100.00,
    "unit": "g",
    "fed_at": "2024-03-14T08:00:00Z"
  }]
}
```

### Key Constraints
- All UUIDs must be valid version 4 UUIDs
- `profiles.id` must match a valid Supabase auth.users.id
- `household_members` enforces unique user per household
- `weight_goals.status` must be one of predefined status values
- Decimal fields use 5 digits with 2 decimal places
- All timestamps are stored in UTC (timestamptz)
- Cascading deletes are enabled for weight-related tables
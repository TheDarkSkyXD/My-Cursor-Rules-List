# MealTime - Complete Refactor Plan (Post-Supabase Auth Migration)

**Goal:** Stabilize the application after the Supabase authentication migration by ensuring correct data flow, consistent authentication/authorization, and fixing broken pages/APIs.

**Context:** The migration replaced NextAuth with Supabase Auth, integrated Supabase SSR utilities, and refactored contexts. However, this led to widespread issues, particularly with API routes, data loading in contexts, and potentially inconsistent auth handling. Prisma is still used for DB operations in API routes.

**Consult:** `memory.md` (especially `info-flow` and `Prisma Query Handling Lessons` sections) for detailed data requirements, flow traces, and known issues.

---

## Phase 1: Stabilize Core Authentication & User Data

**Objective:** Ensure the user's authentication state and core profile information (including `householdId`) are loaded reliably and consistently available via `UserContext`.

**Steps (Junior Dev Instructions):**

1.  **Verify `UserContext` and `getUserProfile` Server Action:**
    *   **Read:** `lib/context/UserContext.tsx` and `lib/actions/userActions.ts`.
    *   **Check:** Does `getUserProfile` correctly use `createServerClient` and `supabase.auth.getUser()` to verify the user based *only* on cookies? (It should NOT rely on passed headers).
    *   **Check:** Does `getUserProfile` correctly query Prisma `profiles` using the Supabase user ID, including the `household_members` relation?
    *   **Check:** Does the mapping logic in `getUserProfile` correctly combine Supabase Auth data (email) and Prisma data (name, avatar, householdId, role) into the `CurrentUserType`? Pay attention to potential null values and fallbacks.
    *   **Check:** Does `UserContext` correctly call `getUserProfile` when the Supabase auth state changes (`onAuthStateChange`) or on initial load?
    *   **Check:** Does `UserContext` handle loading states (`isLoading`) and errors (`error`) correctly during the fetch process?
    *   **Test:** Manually log in and out. Use browser dev tools (Application > Cookies) to observe Supabase cookies being set/cleared. Check `UserContext` state using React DevTools or console logs: is `currentUser` populated correctly on login and cleared on logout? Is `householdId` present?

2.  **Verify Middleware:**
    *   **Read:** `middleware.ts` and `utils/supabase/middleware.ts`.
    *   **Check:** Does the middleware correctly initialize the Supabase client (`createMiddlewareClient`)?
    *   **Check:** Does it successfully refresh the user session using cookies?
    *   **Check:** Does it correctly extract the user ID (`session.user.id`) when a session exists?
    *   **Check:** Does it reliably add the `X-User-ID` header to the request headers *for subsequent API routes/server components*?
    *   **Test:** Add temporary `console.log` statements in the middleware to confirm session refresh attempts and header injection occur as expected. Check browser network requests for the `X-User-ID` header on requests *after* the initial page load (e.g., API calls triggered by contexts).

**Tech Lead Review & Adjustments (Phase 1):**

*   **Consistency:** The current mix of Server Action (`UserContext`) and API routes (other contexts) is acceptable *if* both correctly utilize their respective auth mechanisms (Server Action uses inherent cookie context, API routes use middleware-injected header). However, for long-term maintainability, consider standardizing. *Decision:* Keep the current mix for now to minimize refactor scope, but ensure API routes *robustly* use the header.
*   **Error Handling:** Enhance error handling in `getUserProfile`. Specific Prisma errors should be caught and logged. Return distinct error messages (e.g., "Authentication failed", "Profile not found", "Database error") to the context for better debugging.
*   **`householdId` Criticality:** Emphasize that a missing `householdId` in `UserContext` is a valid state (user not associated) but downstream contexts *must* handle this gracefully (i.e., not attempt fetches). The current checks in `app/page.tsx` seem okay, but verify other pages.
*   **Logging:** Add more specific logging within `UserContext` and `getUserProfile` (e.g., log the start/end of fetch, success/error, the actual profile data returned) to aid debugging. Use log levels (e.g., `console.debug`, `console.warn`, `console.error`).

---

## Phase 2: Stabilize Data Loading in Domain Contexts (Cats, Feedings, Schedules)

**Objective:** Ensure `CatsContext`, `FeedingContext`, and the (to be verified) `ScheduleContext` reliably load data *after* `UserContext` provides a valid `householdId`, using properly authorized API calls.

**Steps (Junior Dev Instructions):**

1.  **Verify Context Dependencies:**
    *   **Read:** `lib/context/CatsContext.tsx`, `lib/context/FeedingContext.tsx`.
    *   **Check:** Do these contexts correctly use `useEffect` with `currentUser?.householdId` from `UserContext` as a dependency?
    *   **Check:** Do they prevent fetching if `householdId` is missing?
    *   **Check:** Do they handle their own `isLoading` and `error` states correctly?

2.  **Verify API Calls from Contexts:**
    *   **Check (`CatsContext`):** It calls `getCatsByHouseholdId`. Trace this function. Does it call `fetch('/api/households/[id]/cats', ...)`? Does the `fetch` call correctly include the `householdId`? Does it pass the `X-User-ID` header obtained from `UserContext` state?
    *   **Check (`FeedingContext`):** It calls `fetch('/api/feedings?householdId=...', ...)`. Does it correctly include the `householdId` in the URL? Does it correctly include the `X-User-ID` header obtained from `UserContext` state?

3.  **Verify API Route Handlers:**
    *   **Locate & Read:** Find the actual API route handlers (e.g., `app/api/feedings/route.ts`, `app/api/households/[id]/cats/route.ts` - adjust paths as needed).
    *   **Add Authorization Check:** **Crucially**, implement or verify robust authorization checks at the beginning of *every* API handler (GET, POST, PUT, DELETE).
        *   Read the `X-User-ID` header using `headers()`.
        *   If the header is missing, return a 401 Unauthorized error immediately.
        *   Query the database (e.g., Prisma `household_members`) to confirm that the user specified by `X-User-ID` actually belongs to the `householdId` being requested/modified. If not, return a 403 Forbidden error.
    *   **Verify Prisma Queries:**
        *   Double-check all Prisma queries (`findMany`, `findUnique`, `create`, `update`) against the `memory.md` "Prisma Query Handling Lessons". Ensure correct use of `include` vs. `select`, correct relation names, and correct field names.
        *   Ensure queries correctly filter by `householdId` where appropriate.
        *   Ensure `create` and `update` operations associate records with the correct `householdId` and the *authenticated* `userId` from the header.
    *   **Verify Response Mapping:** Ensure the data returned by the API matches the structure expected by the context's mapping logic (e.g., check field names like `fed_at` vs `timestamp`, `cat_id` vs `catId`).
    *   **Test:** Use tools like Postman or `curl` (or browser dev tools) to directly call these API endpoints.
        *   Test without the `X-User-ID` header (expect 401).
        *   Test with a valid `X-User-ID` but for a *different* household (expect 403).
        *   Test with valid credentials (expect 200 and correct data). Check the structure of the returned JSON.

4.  **Verify Context Data Mapping:**
    *   **Read:** The `FETCH_SUCCESS` mapping logic within `CatsContext` and `FeedingContext`.
    *   **Check:** Does the mapping correctly transform the fields received from the API (verified in step 3) into the frontend types (`CatType`, `FeedingLog`)? Pay close attention to UUIDs (should remain strings), dates (parse strings into `Date` objects), and relation mapping (e.g., mapping `feeder` data to `log.user`).
    *   **Test:** Add `console.log` statements just before the `dispatch` in the contexts to inspect the raw API data and the mapped data. Verify the structure and types are correct.

5.  **Investigate `ScheduleContext`:**
    *   **Search:** Look for `ScheduleContext.tsx` or similar files.
    *   **If Found:** Apply steps 1-4 to it. Verify how it loads schedule data (API route? Which one? Authorization?).
    *   **If Not Found:** This is a critical missing piece for upcoming feedings.
        *   **Define:** What data does a "Schedule" need? (e.g., `id`, `catId`, `timeOfDay`, `frequency`, `mealType`, `portionSize`).
        *   **Create:** Create a new `ScheduleContext.tsx` following the pattern of `CatsContext`/`FeedingContext`.
        *   **Create:** Define the necessary API endpoint (e.g., `/api/schedules?householdId=...`) and implement its handler (including authorization and Prisma queries).
        *   **Implement:** Implement the fetch and state management logic in the new context.
    *   **Test:** Ensure `UpcomingFeedings` component now receives valid schedule data.

**Tech Lead Review & Adjustments (Phase 2):**

*   **Authorization Standardization:** Create a reusable utility function (e.g., `verifyUserHouseholdAccess(requestHeaders, targetHouseholdId)`) that API routes can call. This function encapsulates reading the header and performing the DB check, promoting consistency and reducing boilerplate.
*   **API Error Handling:** Ensure API routes return meaningful error responses (JSON format preferably) on failure (e.g., `{ "error": "Database query failed", "details": "..." }`). Contexts should parse these JSON errors rather than just using `response.text()`.
*   **Context Error Propagation:** If `UserContext` has an error or no `householdId`, ensure downstream contexts (`Cats`, `Feeding`, `Schedule`) explicitly set an appropriate error state (e.g., "Cannot load data: User or household not available") rather than just staying loading indefinitely or fetching with invalid parameters.
*   **Data Fetch Granularity:** Consider if fetching *all* feeding logs for a household on initial load is scalable. For now, it's acceptable, but flag for potential future optimization (pagination, date range filtering).
*   **Selector Optimization:** Review the selectors (e.g., `useSelectUpcomingFeedings`). Ensure they are efficient and memoized correctly (`useMemo` or `reselect` library if complexity increases) to avoid unnecessary recalculations on every render. The current implementation seems okay but keep an eye on performance.
*   **`ScheduleContext` Implementation:** If creating `ScheduleContext`, ensure the data model (`ScheduleType`) and API interactions are robustly defined from the start.

---

## Phase 3: Verify UI Components & Interactions

**Objective:** Ensure all pages and components correctly consume data from the stabilized contexts, handle loading/error states, and trigger actions (like feeding a cat) correctly.

**Phase 3 Checklist:**

*   [x] `app/page.tsx` (Dashboard)
*   [x] `components/feeding/upcoming-feedings.tsx`
*   [x] `components/feeding/feeding-log-item.tsx`
*   [x] `app/cats/page.tsx` (List Cats)
*   [x] `app/cats/new/page.tsx` (New Cat Form)
*   [x] `app/cats/[id]/client.tsx` (View Cat Details)
*   [x] `app/cats/[id]/edit/page.tsx` (Edit Cat Form)
*   [x] `app/feedings/page.tsx` (Feeding History List)
*   [x] `app/feedings/new/page.tsx` (New Feeding Form)
*   [x] `app/feedings/[id]/page.tsx` (View Feeding Details)
*   [x] `app/households/page.tsx` (Manage Households)
*   [x] `app/households/new/page.tsx` (New Household Form - *Review for redundancy*)
*   [ ] `app/households/[id]/page.tsx` (View Household Details)
*   [ ] `app/households/[id]/edit/page.tsx` (Edit Household Form)
*   [ ] `app/households/[id]/members/invite/page.tsx` (Invite Member Form)
*   [ ] `app/join/page.tsx` (Join Household)
*   [ ] `app/notifications/page.tsx` (List Notifications)
*   [ ] `app/schedules/page.tsx` (List Schedules - *Review for redundancy*)
*   [ ] `app/schedules/new/page.tsx` (New Schedule Form - *Review for redundancy*)
*   [ ] `app/settings/page.tsx` (User Settings)
*   [ ] `app/statistics/page.tsx` (Statistics Dashboard)
*   [ ] **(Removed/Deprecated)** `app/history/page.tsx`, `app/history/[id]/page.tsx`, `app/settings/[id]/page.tsx`, `app/households/create/page.tsx` - These seem redundant or incorrectly placed based on `memory.md` analysis.

**Steps (Junior Dev Instructions):**

1.  **Review Main Dashboard (`app/page.tsx`):**
    *   **Check:** Does it correctly use `isLoading` and `error` states from all relevant contexts (`User`, `Cats`, `Feeding`) to show appropriate loading indicators or error messages?
    *   **Check:** Does it handle the "no household" and "no cats" states correctly?
    *   **Check:** Does it pass the correct data (e.g., `lastFeedingLog`) to child components (`FeedingLogItem`)?
    *   **Check:** Does the chart render correctly with data from `useSelectRecentFeedingsChartData`?

2.  **Review `UpcomingFeedings` Component:**
    *   **Check:** Does it correctly display upcoming feedings based on data from `useSelectUpcomingFeedings`?
    *   **Check:** Does the "Alimentar" (Feed Now) button work?
        *   **Trace `handleFeedNow`:** It makes a POST request to `/api/feedings`.
        *   **Check:** Does the POST request body *only* send necessary info (like `catId`, `notes`)? It should *not* send `userId` or `householdId` as these should be derived server-side from the `X-User-ID` header.
        *   **Check:** Does the API route handler for POST `/api/feedings` correctly implement authorization (using the header) and create the new feeding log in Prisma, associating it with the authenticated user and their household?
        *   **Check:** Does `handleFeedNow` correctly parse the API response and dispatch `ADD_FEEDING` to `FeedingContext` with the *newly created* log (mapped to `FeedingLog` type)?
    *   **Test:** Click the "Alimentar" button. Verify the request in network tools. Check if the UI updates immediately (optimistic update or via context update) and if the data persists on refresh (confirming DB write). Check for success/error toasts.

3.  **Review Other Pages/Components:**
    *   **Systematically Check:** Go through other key pages/components (e.g., `app/cats/...`, `app/households/...`, `components/feeding/feeding-log-item.tsx`, settings page).
    *   **For Each:**
        *   Verify data loading relies on the correct contexts.
        *   Verify loading/error states are handled.
        *   Verify data display is correct based on context state.
        *   Verify any actions (forms submissions, button clicks triggering API calls) follow the correct pattern:
            *   Client triggers API call (including `X-User-ID` header via context state).
            *   API route handler performs authorization using the header.
            *   API route handler performs DB operation (Prisma).
            *   API route handler returns success/error.
            *   Client updates context state based on the response.

**Tech Lead Review & Adjustments (Phase 3):**

*   **UI State Consistency:** Ensure components relying on multiple contexts handle combined loading/error states logically. A global loading indicator (`LoadingContext`) helps, but individual components might need specific placeholders.
*   **Optimistic Updates:** The current `handleFeedNow` updates the context *after* the API call succeeds. Consider optimistic updates for a smoother UX (update context immediately, revert if API fails), but weigh the added complexity. *Decision:* Keep current post-API update logic for simplicity during stabilization.
*   **Form Handling:** For forms (e.g., adding cats, editing settings), ensure they use React Hook Form or a similar library for state management and validation. Ensure submissions trigger API calls with correct authorization and data, and handle success/error feedback.
*   **Code Duplication:** Look for repeated patterns in API fetching or data handling within components. Can helper hooks or utility functions simplify this? (e.g., a `useApiMutation` hook).
*   **Testing:** Add basic integration tests (using React Testing Library) for key components to verify they render correctly based on mock context states (loading, error, success).

---

## Phase 4: Cleanup and Final Testing

**Objective:** Remove obsolete code, ensure consistency, and perform thorough testing.

**Steps (Junior Dev Instructions):**

1.  **Remove NextAuth:**
    *   Delete any remaining NextAuth configuration files (`pages/api/auth/[...nextauth].ts` if it exists).
    *   Remove NextAuth dependencies (`next-auth`) from `package.json`. Run `npm install` or `yarn install`.
    *   Delete any related types or mocks (`types/next-auth.d.ts`, mock files).
    *   Search the codebase for any remaining `useSession` or `getSession` imports/usage and remove them.

2.  **Remove Obsolete API Routes/Code:**
    *   Delete `/api/settings` route handler if confirmed unused.
    *   Review other potentially unused helpers or components related to the old auth flow.

3.  **Implement Missing Invite API Routes:**
    *   Implement `POST /api/households/[id]/invite` route handler (e.g., in `app/api/households/[id]/invite/route.ts`). Ensure it checks for admin authorization (session-based), generates an invite token/record, and sends an invite email.
    *   Implement `PATCH /api/households/[id]/invite-code` route handler (e.g., in `app/api/households/[id]/invite-code/route.ts`). Ensure it checks for admin authorization (session-based), generates a new unique `inviteCode`, updates the household in the database, and returns the new code.

4.  **Code Style & Linting:**
    *   Run `eslint` and `prettier` checks across the codebase and fix any reported issues.

5.  **Manual End-to-End Testing:**
    *   Perform a full user flow test:
        *   Register (if applicable) / Log in.
        *   Handle "no household" state (join/create).
        *   Handle "no cats" state (add first cat).
        *   View dashboard - check all stats, charts, lists.
        *   Use "Feed Now".
        *   Add/Edit/Delete cats.
        *   Add/Edit/Delete schedules (if implemented).
        *   View feeding history.
        *   Change user settings (if applicable).
        *   Log out.
    *   Test edge cases: invalid form inputs, trying to access pages when logged out, slow network conditions (use browser dev tools throttling).

**Tech Lead Review & Adjustments (Phase 4):**

*   **Fix Join Household Flow:** Modify `POST /api/households/join` to return both `household` and updated `user` data. Correct the `userDispatch` call in `app/join/page.tsx` to use the correct action type and payload structure, or switch to using `refetchUser()`.
*   **Verify Notification Flow:** 
    *   Correct ID type mismatch in `app/notifications/page.tsx` (pass string IDs to context actions).
    *   Verify implementation and session-based authorization of notification API routes: `GET/POST /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications/read-all`, and `DELETE /api/notifications/[id]`.
    *   Verify/adjust the endpoint used by `markNotificationAsRead` service function (currently uses bulk `PATCH /api/notifications`, might need `PATCH /api/notifications/[id]`).
*   **Consolidate Schedule Pages:** Remove redundant schedule pages. Keep `app/schedules/page.tsx` (List) and `app/schedules/new/page.tsx` (New Form - the one using context/Zod). Remove `app/schedule/page.tsx` and `app/schedule/new/page.tsx`.
*   **Verify Schedule Flow:**
    *   Ensure `ScheduleContext` fetches data correctly based on `householdId`.
    *   Verify `DELETE /api/schedules/[id]` API route implementation and session-based authorization (define required role: member or admin?).
    *   Ensure `POST /api/schedules` API route correctly derives `householdId` from session, standardizes `catId` to string (UUID), handles authorization, and creates the schedule record.
*   **Refactor Settings Page:**
    *   Review/Update API endpoints for user profile/preference updates (e.g., use `PATCH /api/users/me` instead of `POST /api/users/[id]/...`).
    *   Refactor context updates in `handleSave`, `handleJoinHousehold`, `handleCreateHousehold`, `handleLeaveHousehold` to use targeted actions or refetch mechanism instead of dispatching `SET_CURRENT_USER` with potentially incomplete API response data.
    *   Verify/Align the API endpoint/method used for leaving a household (`handleLeaveHousehold`) with the one used on the household details page.
    *   Implement robust clearing/resetting of dependent contexts (Cats, Schedules, etc.) when a user leaves a household.
*   **Dependency Check:** Double-check `package.json` for any other unused dependencies.
*   **Environment Variables:** Ensure `.env.example` is up-to-date with required variables (`DATABASE_URL`, Supabase keys). Confirm `.env` is correctly gitignored.
*   **Documentation Update:** Update `README.md`, `docs/architecture.md`, and `memory.md` to reflect the stabilized architecture, data flow, and removal of NextAuth.
*   **Automated Testing:** While manual testing is crucial now, plan for adding more robust automated tests (integration, end-to-end using tools like Playwright or Cypress) post-stabilization to prevent regressions.

---

**Overall Tech Lead Guidance:**

*   **Iterative Approach:** Tackle one phase, or even one step within a phase, at a time. Verify fixes thoroughly before moving on. Use Git branches for each phase/major step.
*   **Communication:** Log progress, challenges, and findings clearly (e.g., in PR descriptions, comments, or a temporary status doc).
*   **Prioritize:** Focus on getting the core data flow (Auth -> User -> Household -> Cats/Feedings) working first. UI polish can come later.
*   **Debugging Tools:** Utilize browser dev tools (Network, Console, Application tabs), React DevTools, and strategic `console.log` statements extensively. 
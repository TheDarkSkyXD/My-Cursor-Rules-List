# Performance TODO: Reducing Redundant API Calls & Improving React Context Efficiency

This checklist will guide you through improving performance and reducing redundant API calls in our React app. Follow each step carefully, and ask for help if anything is unclear!

---

## 1. Audit and Refactor Provider Usage

**✅ Complete (2024-05-06):**
- Duplicate NotificationProvider removed from ClientLayout.
- NotificationProvider now only wraps the app at the top level (RootClientLayout).
- Metric: `[METRIC] NotificationProvider initialized` appears only once per render cycle (no duplicates).
- No context errors; notification features work as expected.
- No redundant notification API calls.

---

## 2. Optimize Effect Dependencies

**✅ Complete (2024-05-06):**
- NotificationProvider effect dependency array fixed to only include minimal, stable values.
- Infinite loop and dependency array errors resolved.
- Metric: No duplicate or missed API calls; effect only triggers when needed.
- All notification features work as expected.

---

## 3. Memoize Context Values

**✅ Complete (2024-05-06):**
- Context values in NotificationProvider are now memoized with useMemo.
- Notification objects are normalized to camelCase fields throughout the app.
- Defensive date handling prevents UI crashes from invalid/missing dates.
- Metric: No unnecessary re-renders, no runtime errors, and all notification UIs work as expected.

---

## 4. Test in Both Development and Production Environments

**Goal:** Ensure your changes work as expected in both dev and production builds.

### Steps:
1. **Test in Development:**
   - Run the app with `npm run dev` or `yarn dev`.
   - Check the browser console and network tab for duplicate API calls or provider logs.
2. **Build for Production:**
   - Run `npm run build` and then `npm start` (or the equivalent for your project).
   - Repeat the checks above in the production build.
3. **Compare Behavior:**
   - Note that React Strict Mode in development may double-invoke some effects, but this should not happen in production.
   - Confirm that in production, each provider and effect only runs once as expected.
4. **Document Findings:**
   - If you find issues, document them and discuss with the team before making further changes.

---

**Remember:**
- Ask for help if you're unsure about any step.
- Keep your changes focused and commit often with clear messages.
- Update this checklist as you complete each section! 
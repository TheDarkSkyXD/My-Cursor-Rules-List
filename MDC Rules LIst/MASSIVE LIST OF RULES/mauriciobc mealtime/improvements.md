# MealTime Codebase Lean-Up Plan

## 🏆 Highest Impact Areas (Tackle First)

- [ ] **Context Consolidation & Simplification**
  - [ ] Abstract common async/fetch/abort/cleanup logic into a generic hook (e.g., `useDomainData`).
  - [ ] Refactor `FeedingContext.tsx` to use the new abstraction.
  - [ ] Refactor `NotificationContext.tsx` and `UserContext.tsx` similarly.
  - [ ] Consider merging tightly coupled contexts (e.g., Cats + Feedings) if it reduces code and complexity.
  - [ ] Remove redundant state, memoization, and boilerplate from contexts.

- [ ] **API/Data Fetching Abstraction**
  - [ ] Develop a generic fetch hook or utility for all domain data fetching (or prototype SWR/React Query for one domain).
  - [ ] Replace repeated fetch/abort/retry logic in all contexts with the new abstraction.
  - [ ] Ensure all data flows and error/loading states are preserved.

- [ ] **UI Component Rationalization**
  - [ ] Audit all custom UI components for overlap with shadcn/ui or each other.
  - [ ] Unify or replace custom time/date pickers (`datetime-picker.tsx`, `simple-time-picker.tsx`) with a single component or a library solution.
  - [ ] Replace other custom UI (dialogs, cards, tooltips, etc.) with shadcn/ui primitives where possible.
  - [ ] Remove unnecessary props/state from components to keep them lean.

## 🟡 Moderate Impact Areas (Tackle After or In Parallel)

- [ ] **Utility Function Cleanup**
  - [ ] Consolidate all date/time logic into a single utility file.
  - [ ] Remove or merge trivial or duplicate utilities in `lib/utils/`.

- [ ] **Reducer & State Management Simplification**
  - [ ] Simplify verbose reducers; use Immer or `useState` for simple cases.
  - [ ] Remove unnecessary memoization (useMemo/useCallback) unless proven beneficial.

- [ ] **Loading & Error Handling Centralization**
  - [ ] Centralize loading/error state further into a global provider or generic hook.
  - [ ] Reduce excessive logging/toasts, keeping only essential feedback.

## 🟢 Lower Impact/Housekeeping (Tackle as Time Allows)

- [ ] **TypeScript Types Centralization**
  - [ ] Move all shared types to a single `types/` directory.
  - [ ] Remove redundant or duplicate types.

- [ ] **Testing & Documentation Cleanup**
  - [ ] Remove dead code (unused tests, mocks, legacy code).
  - [ ] Document any new abstractions or patterns introduced during refactoring.

---

**Approach:**
- Prioritize the highest impact areas for maximum code reduction and maintainability.
- Refactor incrementally, one context/component at a time, ensuring all tests pass after each change.
- Update this checklist as improvements are implemented.

*This plan is designed to deliver the same functionality with less, leaner, and more maintainable code, in line with project rules and architecture.* 
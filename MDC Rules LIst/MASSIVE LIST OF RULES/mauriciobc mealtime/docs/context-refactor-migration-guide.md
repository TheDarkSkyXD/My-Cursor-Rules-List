# Context Refactor Migration Guide

## Overview

This guide details the steps required to migrate components and logic from the old context system to the new refactored context architecture.
The goal of this refactor was to improve modularity, performance, and maintainability.

Refer to the [Context Architecture documentation](docs/architecture/contexts.md) for details on the new structure.

## Prerequisites

- Familiarity with the new Context Architecture.
- Understanding of React Context API, hooks (`useContext`, `useState`, `useEffect`, `useMemo`, `useCallback`).

## Key Changes

- **AppContext Split**: `AppContext` has been replaced by domain-specific contexts (`HouseholdContext`, `CatsContext`, `FeedingContext`).
- **Core Contexts Introduced**: `UserContext`, `LoadingContext`, and `ErrorContext` provide centralized handling for common concerns.
- **State Management**: Emphasis on selectors and memoization for performance.
- **Storage Layer**: Introduction of a dedicated storage service for caching and persistence.

## Migration Steps

### Phase 1: Replace `AppContext` Usage

1.  **Identify Components**: Locate all components currently consuming `AppContext`.
2.  **Determine Required Contexts**: For each component, identify which new domain context(s) (`HouseholdContext`, `CatsContext`, `FeedingContext`) provide the necessary state and actions.
3.  **Update Context Consumption**: Replace `useContext(AppContext)` with the appropriate new context hooks (e.g., `useContext(CatsContext)`).
4.  **Adapt State/Action Usage**: Update component logic to use the state structure and action names provided by the new contexts.
    *   *Example*: Replace `appContext.addCat` with `catsContext.addCat` (adjust parameters if needed).
5.  **Test**: Ensure the component functions correctly with the new context(s).

### Phase 2: Integrate Core Contexts

1.  **User Authentication/Profile**: Replace direct session/profile logic with consumption of `UserContext`.
2.  **Loading Indicators**: Migrate existing loading state logic to use `LoadingContext`. Register specific loading keys where appropriate.
3.  **Error Handling**: Wrap relevant component sections with the `ErrorBoundary` component or utilize `ErrorContext` for centralized error reporting/handling.

### Phase 3: Refactor Data Fetching & Storage

1.  **Centralize Fetching**: Move data fetching logic into context providers or dedicated hooks/services where appropriate, rather than directly in components.
2.  **Utilize Caching**: Leverage the caching mechanisms implemented in the domain contexts or the new storage service.
3.  **Update Persistence**: If components relied on manual local/session storage, migrate this to use the `Storage Service`.

### Phase 4: Testing and Cleanup

1.  **Run Integration Tests**: Execute tests focusing on components that have been migrated to ensure they interact correctly with the new contexts.
2.  **Performance Testing**: Profile key user flows involving migrated components to verify performance improvements or identify regressions.
3.  **Remove Old Code**: Once migration is complete and verified, remove the old `AppContext` definition and any related unused code.

## Potential Issues & Troubleshooting

- **Incorrect Context Scope**: Ensure components are wrapped by the necessary `Provider` components in the component tree.
- **Stale State**: Double-check memoization dependencies (`useMemo`, `useCallback`) if components aren't re-rendering when expected.
- **Performance Regressions**: Use React DevTools Profiler to identify components re-rendering unnecessarily.

## Examples (To be added)

- *Example: Migrating a Cat List Component*
- *Example: Using LoadingContext for a Form Submission* 
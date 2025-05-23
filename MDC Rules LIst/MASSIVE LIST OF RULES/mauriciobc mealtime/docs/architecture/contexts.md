# Context Architecture

## Overview
The context architecture has been refactored to improve modularity, performance, and maintainability. This document outlines the new structure, communication patterns, and best practices.

## Core Contexts

### UserContext
- **Purpose**: Manages user session, profile data, and authentication state.
- **Key Functions/State**:
  - `session`: Current user session (from NextAuth).
  - `userProfile`: Additional user profile details.
  - `isLoading`: Indicates if user data is being loaded.
  - `login`, `logout`: Authentication functions.
  - `updateProfile`: Function to modify user profile.
- **Persistence**: Session managed by NextAuth, profile potentially cached locally.

### LoadingContext
- **Purpose**: Provides a centralized way to manage global and specific loading states across the application.
- **Key Features**:
  - Priority queue system for managing multiple concurrent loading states.
  - Timeout handling for long-running operations.
  - Operation cancellation support.
- **Usage**: Components can subscribe to specific loading keys or global state.

### ErrorContext
- **Purpose**: Centralized error handling, reporting, and potential recovery.
- **Key Features**:
  - Captures errors from defined boundaries (e.g., `ErrorBoundary` component).
  - Integrates with logging utility (`lib/utils/logger.ts`).
  - Can trigger error notifications or recovery UI.
- **Persistence**: Errors might be temporarily persisted for debugging or reporting.

## Domain Contexts

### HouseholdContext
- **Purpose**: Manages household-related state, members, and permissions.
- **Key Functions/State**:
  - `household`: Current household details.
  - `members`: List of household members.
  - `permissions`: User's permissions within the household.
  - `addMember`, `removeMember`, `updateMember`: Member management functions.
  - `setHousehold`: Function to update the household state.
- **Integration**: Communicates with `UserContext` for permissions.

### CatsContext
- **Purpose**: Manages state related to cats within the household.
- **Key Functions/State**:
  - `cats`: List of cat profiles.
  - `isLoading`: Loading state for cat data.
  - `addCat`, `updateCat`, `removeCat`: CRUD operations for cats.
- **Caching**: Implements a caching layer to reduce redundant data fetching.
- **Integration**: May trigger events related to `FeedingContext`.

### FeedingContext
- **Purpose**: Manages feeding schedules, events, and related notifications.
- **Key Functions/State**:
  - `feedings`: List or schedule of feeding events.
  - `scheduleFeeding`, `logFeeding`, `updateFeeding`: Functions for managing feedings.
- **Features**: Includes scheduling logic and integrates with the notification system.
- **Integration**: Relies on `CatsContext` for cat information, communicates with `Notification System`.

## Context Communication & State Management

- **Event System**: A lightweight event bus allows decoupled communication between contexts or components.
- **Context Bridges**: Specific functions or hooks designed to safely pass state or actions between related contexts where direct dependency is undesirable.
- **State Synchronization**: Mechanisms ensure that related state across different contexts remains consistent (e.g., removing a cat updates both `CatsContext` and relevant `FeedingContext` entries).

## Performance & Optimization

- **Memoization**: Context providers and values are memoized (`React.useMemo`, `React.useCallback`) to prevent unnecessary re-renders of consuming components.
- **Selectors**: Custom hooks (`useContextSelector`) or libraries are used where appropriate to allow components to subscribe only to specific slices of context state they need, reducing re-renders.
- **Optimized Re-renders**: Careful state structure and update logic minimize the scope of changes, preventing cascading re-renders.
- **Performance Monitoring**: Integration with React DevTools Profiler and potentially custom analytics to track context-related performance bottlenecks.

## Storage Layer

- **Storage Service**: A dedicated service (`lib/services/storage.ts` - *proposed location*) abstracts local storage, session storage, or other client-side persistence mechanisms.
- **Caching Strategies**: Implements strategies like cache-first, stale-while-revalidate for context data fetched from the API.
- **Persistence Policies**: Defines which context states should be persisted and for how long.

## Best Practices
1.  **Keep Contexts Focused**: Each context should manage a specific domain or concern. Avoid monolithic contexts.
2.  **Minimize Context Value Changes**: Only include state and functions in the context value that are likely to be needed together. Stable function references are crucial.
3.  **Prefer Composition**: Compose multiple contexts rather than creating one large context.
4.  **Use Selectors/Scoped Consumption**: Consume only the parts of the context state needed by a component.
5.  **Memoize Selectively**: Memoize context values and selectors where performance benefits are observed.
6.  **Leverage Core Contexts**: Utilize `LoadingContext` and `ErrorContext` for standardized UI feedback.
7.  **Test Thoroughly**: Implement unit, integration, and potentially performance tests for contexts and consuming components.

## Testing
- **Unit Tests**: Test individual context logic, reducers, and utility functions in isolation (`tests/unit/contexts`).
- **Integration Tests**: Test interactions between contexts and components, ensuring data flows correctly (`tests/integration/contexts`).
- **Performance Tests**: Measure render times and update speeds under various loads (`tests/performance/contexts`).

## Future Improvements
- Explore state management libraries (like Zustand, Jotai) if complexity grows significantly beyond React Context capabilities.
- Refine event system or context bridge patterns based on usage.
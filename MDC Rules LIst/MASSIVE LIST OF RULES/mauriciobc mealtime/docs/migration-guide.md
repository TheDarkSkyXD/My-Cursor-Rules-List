# Migration Guide for Context Refactor

## Overview
This guide provides steps to migrate to the new context structure introduced in the refactor. The refactor improves performance, modularity, and maintainability.

## Key Changes
1. **Context Splitting**: The `AppContext` has been split into domain-specific contexts:
   - `HouseholdContext`
   - `CatsContext`
   - `FeedingContext`
2. **Performance Optimizations**:
   - Memoization of context values.
   - Introduction of state selectors to minimize re-renders.
3. **Testing Enhancements**:
   - Added integration and performance tests for contexts.

## Migration Steps

### 1. Update Imports
Replace old `AppContext` imports with the new domain-specific contexts. For example:
```diff
- import { useAppContext } from '@/lib/context/AppContext';
+ import { useHousehold } from '@/lib/context/HouseholdContext';
```

### 2. Update Component Usage
Ensure components use the appropriate context. For example:
```tsx
const { household, setHousehold } = useHousehold();
```

### 3. Test Your Changes
Run the test suite to ensure everything works as expected:
```bash
npm test
```

### 4. Remove Deprecated Code
Remove any references to the old `AppContext` to avoid confusion.

## Additional Notes
- Refer to the integration and performance tests in `__tests__/integration` and `__tests__/performance` for examples.
- Documentation for each context is available in the `docs/` folder.

For further assistance, contact the development team or refer to the architecture documentation.
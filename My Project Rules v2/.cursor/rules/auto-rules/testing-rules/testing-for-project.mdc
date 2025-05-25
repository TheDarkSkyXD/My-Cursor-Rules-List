# 🧪 Testing & Reliability

## Test Implementation Requirements

- **Always create vitest unit tests for new features** (components, functions, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/test` folder** mirroring the src structure.
- **Follow naming convention**: `[filename].[test-type].test.ts`

## Test Coverage Checklist

For each feature/component, include at minimum:
- **Happy path test**: Verify expected behavior under normal conditions
- **Edge case test**: Test boundary conditions and uncommon inputs
- **Error handling test**: Verify proper handling of errors/exceptions

## Component-Specific Testing

- **UI Components**:
  - Test rendering with different props
  - Test state changes and user interactions
  - Verify component meets accessibility standards

- **API/Services**:
  - Test data fetching, transformation, and error handling
  - Use consistent mocking for external dependencies

- **Business Logic**:
  - Test all logical branches and edge cases
  - Validate input/output for all functions

## Testing Best Practices

- Make tests isolated and deterministic
- Use descriptive test names that explain the scenario
- Group related tests with describe blocks
- Add comments for complex test setups
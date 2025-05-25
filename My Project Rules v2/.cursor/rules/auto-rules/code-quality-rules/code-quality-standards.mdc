# Code Quality Standards

## Style & Documentation

- Follow consistent naming and formatting conventions found in existing code
- Add clear comments for non-obvious logic
- Use self-documenting practices with meaningful variable and function names
- Keep documentation updated with implementation changes

## Testing Requirements

For all new features or significant changes:

1. Create vitest unit tests in a `/test` folder mirroring the main app structure
2. Include at least:
   - 1 test for expected use
   - 1 edge case
   - 1 failure case
3. Update existing tests when changing related functionality

## Error Handling & Security

- Handle all possible errors with appropriate mechanisms
- Implement input validation and sanitization, especially for user inputs
- Never leave security vulnerabilities unaddressed
- Log meaningful messages for exceptions

## Performance Considerations

- Write efficient code but prioritize correctness and clarity
- Only optimize after functionality is proven
- Consider computational complexity (prefer O(n) over O(n²))
- Identify and address potential bottlenecks in critical paths

## Tool-Specific Standards

- **Always use pnpm** to install or uninstall npm packages
- **Always use zsh** to execute any kind of shell commands including pnpm commands
- Respect quality gates in CI pipeline
- Maintain passing lints, types, and builds
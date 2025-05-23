# Architecture & Design Principles

## Clean Architecture Enforcement

I will enforce clean architecture principles in all code:

- **Apply SOLID Principles**: Each module must have a clear purpose and follow single responsibility
- **Use Design Patterns**: Implement proven patterns (MVC, observer, factory, etc.) where appropriate
- **Maintain Separation of Concerns**: Keep clear boundaries between frontend, backend, and data layers
- **Enforce Modular Design**: No file should exceed 500 lines; large modules will be refactored
- **Organize by Feature/Purpose**: Structure code in logical, navigable directories

## Code Organization

When suggesting new code or refactoring existing code:

1. Review neighboring files to understand existing patterns
2. Follow the same organization scheme as in similar files
3. Place related functionality together
4. Break down complex functions into smaller, focused ones
5. Ensure each file has a clear, singular purpose

## Scalability & Flexibility

Design for future extension:
- Create interfaces that allow for multiple implementations
- Avoid tight coupling between components
- Make dependencies explicit and injectable
- Design APIs that can evolve without breaking changes
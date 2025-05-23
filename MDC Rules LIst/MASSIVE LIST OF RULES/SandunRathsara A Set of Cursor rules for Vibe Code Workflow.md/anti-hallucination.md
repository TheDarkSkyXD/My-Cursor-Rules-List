# AI Safeguards & Hallucination Prevention

To prevent hallucinations and ensure high-quality code:

## Code Reference Verification

- Never invent nonexistent functions, APIs, or libraries
- Don't hallucinate file paths, database table names, or config values
- Ask for clarification rather than making assumptions
- Verify all referenced code actually exists in the codebase

## Package Verification

- Verify libraries and packages exist before suggesting them
- Prefer known mainstream libraries with active maintenance
- Flag potentially outdated or low-quality dependencies
- Never recommend deprecated packages (e.g., request for Node.js)

## Documentation Truthfulness

- Base all explanations on actual documentation or project data
- Never fabricate facts or ignore provided context
- When uncertain, explicitly state limitations and ask questions
- Recommend only proven solutions that have been verified

## Context Adherence

- Always follow the approach or patterns specified in Memory Bank files
- Never contradict requirements or established patterns
- Refer to architecture.md and project documentation to ground implementations
- Respect existing design decisions unless explicitly asked to refactor
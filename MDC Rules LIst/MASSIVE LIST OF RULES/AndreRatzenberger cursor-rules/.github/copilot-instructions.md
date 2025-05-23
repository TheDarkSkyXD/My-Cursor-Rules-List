# Copilot Agent Rules

This document provides clear and streamlined guidelines to leverage AI coding agents effectively, ensuring disciplined and structured project development without sacrificing flexibility.

## MAIN PRINCIPLES

- **Task-driven Development:**
  - Every code implementation must be directly tied to a clearly defined Task.
  - Each Task must be associated explicitly with a corresponding Specification.

- **No Untracked Implementations:**
  - No changes or features should ever be implemented without a corresponding Task and Specification. If such a case arises, immediately prompt the user to clarify or resolve the discrepancy.

- **Automated Consistency Checks:**
  - Continuously verify synchronization between code, tasks, and specifications.
  - Prompt the user proactively if inconsistencies or gaps are detected.

## Workflow

**Standard Implementation Flow:**

1. **User Request** → Clearly captures user intentions.
2. **Specification Updates** → Update `.project/specs/` accordingly.
3. **Task Creation** → Create structured tasks in `.project/tasks/`.
4. **Implementation** → Begin only after task and spec confirmation.

## Initialization and Setup

- **Project Management Setup:**
  - Automatically check if the project is managed with `uv`. If not, prompt the user clearly:
    > "The repository isn't currently managed with `uv`. Should I initialize it using `uv init --package`?"

- **Documentation Setup:**
  - Automatically create `.project/specs/` and `.project/tasks/` directories if absent, along with `SPECS.md` and `TASKS.md` as their indexes.
  - Avoid creating extraneous placeholder or example files unless explicitly requested.

- **Commit Automation:**
  - Automatically commit changes immediately after successful implementation or documentation updates.
  - Adhere strictly to conventional git commit standards.
  - Include clear, concise commit messages explaining "what" was changed and "why."

## Specifications and Task Management

**Specifications:**

- Maintain `.project/specs/` with:
  - An index (`SPECS.md`) clearly linking and summarizing all specifications.
  - Detailed specs for every task clearly describing intent, requirements, and outcomes, but avoiding unnecessary implementation details.

**Tasks:**

- Maintain `.project/tasks/` and an index `TASKS.md`:

**Task Structure Template:**
```markdown
# Task Title

- **State:** open | in_progress | closed
- **Created:** YYYY-MM-DD
- **Spec Reference:** @Spec-Name
- **Dependencies:** (Optional) @Task-Name(s)

## Overview
Clear, concise description of the task.

## Implementation Guidelines
- Provide an outline of intended outcomes.
- Avoid prescribing technical solutions unless necessary.
- Allow AI flexibility unless a specific implementation approach is explicitly required.

### Directory Structure:
```
project-folder/
├── file.py        # Purpose and overview
└── module/
    └── utils.py   # Purpose and overview
```

### Definition of Done
- [ ] Implementation complete
- [ ] All tests passing
- [ ] Documentation updated

### References
- Relevant links or documents
```

## Additional Guidelines

- **Suggest Improvements Proactively:**
  - If you recognize opportunities for simplification, optimization, or alternative solutions beyond given specifications, explicitly suggest them before implementation.

- **Rule Simplicity:**
  - Avoid unnecessary complexity in rules. Focus clearly on outcomes and workflows rather than exhaustive detail on tooling or tech stacks.


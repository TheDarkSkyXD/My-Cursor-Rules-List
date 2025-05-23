# Cursor Rules and Working Memory System

This repository provides a comprehensive example of using AI-assisted development with Cursor, implementing a working memory system for maintaining context across sessions, and utilizing customized rules for efficient and consistent development practices.

## Repository Structure

### .cursor/
The `.cursor/` directory contains all Cursor-specific configuration:

#### .cursor/rules/
Rule files that provide instructions to the Cursor AI assistant:

- **aws/** - Rules for AWS operations
  - `aws-cli-safety.mdc` - Safety rules for AWS CLI operations

- **core/** - Core rules for project organization and tools
  - `cursor-rules-location.mdc` - Defines standard locations for cursor rules
  - `cursor-tools.mdc` - Documentation for cursor-tools CLI utilities
  - `git-commit.mdc` - Git commit standards
  - `memory-management.mdc` - Working memory system standards
  - `plan-updates.mdc` - Guidelines for updating plan files
  - `pr-template-management.mdc` - PR template standards

- **python/** - Python-specific development rules
  - Rules for docstrings, error handling, logging, testing, and type hints

#### .cursor/templates/
Template files for creating new documents consistently.

#### .cursor/prompts/
Custom prompts for the Cursor AI assistant.

### docs/
Documentation and working memory for the project:

#### docs/project/
High-level project documentation:

- `project-plan.md` - Overall project plan with phases
- `repository-status.md` - Current repository status

#### docs/working-memory/
Working memory system for maintaining context across sessions:

- **open/** - Active tasks currently in progress
  - Each task folder (e.g., `phase-15-admin-api-cd/`) contains:
    - `plan.md` - Detailed task planning
    - `updates.md` - Progress tracking

- **done/** - Completed tasks
  - Historical task folders organized by phase (e.g., `phase-14-test-to-dev-migration/`)
  - Each contains task documentation and outcomes

## Working Memory System

The working memory system is designed to maintain context across AI sessions and help track project progress:

1. **Memory Types**
   - **Working Memory** (`/docs/working-memory/`) - Active context and ongoing tasks
   - **Project Memory** (`/docs/`) - Long-term project knowledge
   - **Documentation Memory** (`/docs/templates/`) - Standards and patterns

2. **Task Documentation Files**
   - `plan.md` - Problem analysis, solution design, and implementation steps
   - `updates.md` - Current status, progress history, and decisions log

3. **Status Update Process**
   - Maintains a single active status with timestamps
   - Uses progress markers for completed work, decisions, issues, and next steps

4. **File Management**
   - Active tasks remain in `/docs/working-memory/open/`
   - Completed tasks move to `/docs/working-memory/done/`

## Using This Repository

1. **Setup Cursor Rules**
   - Copy the `.cursor/rules/` directory structure to your project
   - Customize rules as needed for your workflow

2. **Implement Working Memory**
   - Create a similar structure in your `docs/` directory
   - Use the templates to initialize new tasks

3. **Follow Memory Management Practices**
   - Update status before starting work
   - Document decisions immediately
   - Keep progress log current with proper timestamps

## Benefits

- **Continuous Context** - AI maintains awareness of project history
- **Structured Documentation** - Consistent format for all tasks
- **Improved Collaboration** - Clear record of decisions and progress
- **Enhanced AI Performance** - Rules guide AI toward desired outputs

## Getting Started

1. Clone this repository
2. Explore the `.cursor/rules/` directory to understand available rules
3. Review `docs/working-memory/` for examples of working memory in practice
4. Use the structure as a template for your own projects

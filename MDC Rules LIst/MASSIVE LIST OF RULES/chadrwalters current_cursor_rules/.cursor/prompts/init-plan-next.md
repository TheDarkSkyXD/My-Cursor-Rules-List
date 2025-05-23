# Plan Initialization - Working Memory Approach
# Purpose: Initialize context and execute the next steps using the Working Memory approach

## Steps
1. Review Project Rules
   - Read all rules in `.cursor/rules/`
   - Understand rule application contexts
   - Note any rule conflicts or dependencies
   - Describe your set of rules

2. Review Project Status
   - Open `docs/project/project-plan.md`
   - Check Project Status section for:
     * Current Phase and Task
     * Current Status (🟢|🟡|🔴)
     * Next Action
   - Review Phase Overview to understand where we are in the project
   - Identify current tasks in "Current Work" section

3. Locate Current Task
   - Find the current task directory in `/docs/working-memory/open/`
   - Read the task's `plan.md` for:
     * Task details and implementation plan
     * Acceptance criteria
     * Dependencies and requirements
   - Read the task's `updates.md` for:
     * Current progress
     * Issues encountered
     * Next steps

4. Task Execution
   - Update task status in `updates.md` to In Progress (🟡)
   - Execute planned implementation steps
   - Document progress in `updates.md` as you go:
     * Record decisions made
     * Document implementation details
     * Note any issues encountered
     * Track progress against acceptance criteria

5. Task Verification
   - Verify implementation against acceptance criteria
   - Run relevant tests if applicable
   - If human verification needed:
     * Clearly state what needs verification
     * Wait for confirmation
   - If automated verification:
     * Document verification results

6. Task Completion
   On successful completion:
   - Update task status in `updates.md` to Complete (✅)
   - Add final notes and lessons learned
   - Move task from `/open` to `/done`:
     ```bash
     mv docs/working-memory/open/[task-dir] docs/working-memory/done/
     ```
   - Update `docs/project/project-plan.md`:
     * Move task from "Current Work" to "Completed Work"
     * Update Phase status if needed
     * Update Milestone completion criteria
     * Update "Next Action" for the next task

   On blocker:
   - Update status to Blocked (🔴)
   - Add Blocker description in `updates.md`
   - Request assistance

7. Feature Documentation (if applicable)
   - If task completed a feature, create/update feature documentation
   - Use feature template from `/docs/templates/feature-documentation-template.md`
   - Place in `/docs/project/[feature-name]-feature.md`

## Output Format
The assistant should provide:
1. Current Status
   - Project phase and current task identification
   - Task progress from updates.md
   - Current blockers (if any)
   - Next implementation steps

2. Implementation Details
   - Changes made or proposed
   - Decisions taken
   - Important considerations

3. Verification Results
   - Validation against acceptance criteria
   - Test results if applicable
   - Required human input

4. Next Steps
   - Proposed next actions
   - Required future work
   - Updates to project-plan.md if task completed

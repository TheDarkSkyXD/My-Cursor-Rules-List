# Task Execution - Continue Current Task (Use With Existing Context)
# Purpose: Continue execution of the current task within the working memory structure

## Steps
1. Review Current Task Status
   - Identify current task in `/docs/working-memory/open/`
   - Check task's `updates.md` for:
     * Current progress
     * Status (🟡 In Progress, 🔴 Blocked)
     * Remaining work
     * Issues encountered
   - Refer to task's `plan.md` for:
     * Implementation plan
     * Acceptance criteria 
     * Required steps

2. Task Execution
   - Continue implementation based on the task plan
   - Document progress in `updates.md` as you work:
     * Record implementation details
     * Note decisions made
     * Document issues encountered
     * Track progress against acceptance criteria

3. Task Verification
   - Verify work against acceptance criteria in `plan.md`
   - Run relevant tests if applicable
   - If human verification needed:
     * Clearly state what needs verification
     * Wait for confirmation
   - If automated verification:
     * Document verification results

4. Task Completion
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
     * Identify next task to work on

   On blocker:
   - Update status to Blocked (🔴)
   - Add blocker description in `updates.md`
   - Request assistance

5. Feature Documentation (if applicable)
   - If task completed a feature, create/update feature documentation
   - Use template from `/docs/templates/feature-documentation-template.md`
   - Place in `/docs/project/[feature-name]-feature.md`

## Output Format
The assistant should provide:
1. Current Status
   - Task identification and progress
   - Current blockers (if any)
   - Remaining work

2. Implementation Details
   - Changes made or proposed
   - Decisions taken
   - Important considerations

3. Verification Results
   - Validation against acceptance criteria
   - Test results if applicable
   - Required human input

4. Next Steps
   - Immediate next actions
   - Updates to project documentation
   - Potential task transitions or feature completion

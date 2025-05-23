# Update Working Memory
# Purpose: Update project documentation following the document hierarchy guidelines

## Required Steps

1. **Get Current Timestamp**
   ```bash
   date "+%Y-%m-%d %H:%M:%S %Z"
   ```

2. **Update Project Plan (project-plan.md)**
   - Update milestone status
   - Update current task status
   - Keep one level deep only
   - Format:
     ```markdown
     - [ ] Task N.1 - Task Name
           _One-line description of what this task accomplishes_
     ```

3. **Update Phase Plan (plan.md)**
   - Update detailed task statuses
   - Add new implementation details
   - Format:
     ```markdown
     ### Task N.1: Task Name
     - [ ] Major Component
       - [ ] Specific Task
         - [ ] Implementation Detail
     ```

4. **Create Status Update (updates.md)**
   ```markdown
   ## Latest Status (YYYY-MM-DD HH:MM:SS TZ)
   
   ### Completed
   1. Component Name (Task N.1.a):
      - What was completed
      - Key decisions made
      - Verification status
   
   ### In Progress
   1. Current Work:
      - What's being done
      - Blockers/issues
      - Next steps
   
   ### Working Components
   1. Component:
      - Current state
      - Verification status
      - Dependencies
   ```

## Document Relationships
- Project Plan: High-level overview only
- Phase Plan: Technical implementation details
- Updates: Progress tracking and current state

## Success Criteria
1. All three documents are in sync
2. Formats strictly followed
3. Task references consistent
4. Status markers accurate
5. Timestamps current

## Remember
- Project Plan stays high-level
- Phase Plan has the details
- Updates track progress
- Use consistent task numbers
- Keep formats exact
- Update all three documents 
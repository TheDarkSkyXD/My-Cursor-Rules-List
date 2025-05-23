# Create Pull Request
# Purpose: Create a well-structured pull request following our standard templates and processes

## IMPORTANT - FOLLOW THESE STEPS IN ORDER
DO NOT skip steps or try to combine steps. Each step must be completed in sequence.

## Required Pre-checks
1. Check current branch name matches pattern: username/LIN-XXX-description
2. Verify Linear issue exists and is valid
3. Confirm all changes are committed
4. Verify GitHub CLI is installed and authenticated
5. Review working-memory and plan files for task context

## Template Setup (REQUIRED)
```bash
# 1. Create temp directory (ALWAYS do this first)
mkdir -p .github/tmp

# 2. Copy template (ALWAYS use this exact path)
cp .github/pull_request_template.md .github/tmp/pr_description.md

# 3. FILL OUT the template with task details (REQUIRED)
# - Read working-memory/plan files for context
# - Fill in all sections of the template
# - Include implementation details
# - Document testing evidence
# - List all affected components

# 4. Create PR with completed template (ALWAYS use --body-file)
gh pr create --title "[LIN-XXX] Your PR Title" --body-file .github/tmp/pr_description.md

# 5. Cleanup (ALWAYS do this last)
rm .github/tmp/pr_description.md
```

## CRITICAL RULES
1. NEVER manually construct the PR body
2. NEVER skip the temporary directory step
3. ALWAYS use --body-file with the template
4. ALWAYS clean up temporary files after PR creation
5. ALWAYS fill out the template completely before creating PR

## Process Steps (Execute in Order)
1. Validate Current State
   - [ ] Branch name follows pattern
   - [ ] Linear issue exists
   - [ ] Changes committed
   - [ ] GitHub CLI ready
   - [ ] Task context reviewed

2. Template Processing
   - [ ] Create .github/tmp directory
   - [ ] Copy template to tmp directory
   - [ ] Read working-memory/plan files
   - [ ] Fill out ALL template sections
   - [ ] Review template completeness

3. PR Creation
   - [ ] Use gh pr create with --body-file
   - [ ] Title format: [LIN-XXX] description
   - [ ] Use completed template file

4. Post-Creation Tasks
   - [ ] Clean up temporary files
   - [ ] Verify PR created successfully
   - [ ] Check template rendered correctly
   - [ ] Verify all sections are filled out

## Template Content Requirements
Each section MUST be completed with relevant information:
1. Description
   - Clear summary of changes
   - Purpose and context
   - Related issue references

2. Type of Change
   - Mark ALL applicable checkboxes
   - Add details for each type

3. Testing
   - Document test coverage
   - List validation steps
   - Include test results

4. Environment Files
   - Document any env changes
   - Verify formatting
   - Check for sensitive data

5. Documentation
   - List all doc updates
   - Include API changes
   - Note configuration updates

6. Deployment Impact
   - List required changes
   - Note dependencies
   - Document rollback plan

7. Security Considerations
   - Review access changes
   - Document env updates
   - Note infrastructure impact

8. Additional Notes
   - Add context as needed
   - Include migration steps
   - List known limitations

## Error Prevention
- If template not found in .github/pull_request_template.md, STOP and notify user
- If Linear issue number invalid, STOP and ask for correct number
- If branch name incorrect, STOP and request branch name fix
- If PR creation fails, clean up temporary files before retrying

## Example Usage (CORRECT)
```bash
# Step 1: Create temp directory
mkdir -p .github/tmp

# Step 2: Copy template
cp .github/pull_request_template.md .github/tmp/pr_description.md

# Step 3: Create PR
gh pr create --title "[LIN-123] Add user authentication" --body-file .github/tmp/pr_description.md

# Step 4: Cleanup
rm .github/tmp/pr_description.md
```

## Example Usage (INCORRECT - DO NOT DO THIS)
```bash
# DON'T: Create PR without template
gh pr create --title "Add feature" --body "Description here"

# DON'T: Edit template directly
gh pr create --title "Add feature" --body-file .github/pull_request_template.md

# DON'T: Skip cleanup
# Always remove temporary files
```

## Verification Checklist
After PR creation, verify:
1. [ ] PR title includes Linear issue number
2. [ ] Template sections are properly formatted
3. [ ] No temporary files remain in .github/tmp
4. [ ] PR appears correctly on GitHub

## Template Location
The PR template should be sourced from:
1. Primary: `.github/pull_request_template.md` in current repository
2. Fallback: `../repo-template/.github/pull_request_template.md`

## Input Parameters
Required parameters that should be included in the prompt:
- Linear Issue Number (if not provided, will be requested)
- Branch Name (automatically detected from current branch)
- PR Title (derived from commit messages if not specified)

## Required Information
The assistant should:
1. Check if Linear issue number was provided in prompt
   - If not, ask for it (format: LIN-XXX)
2. Extract from latest commits:
   - Implementation details
   - Testing evidence
   - Type of changes
3. Verify branch naming convention
4. Ensure all CI checks are passing
5. Ensure you are merging to the correct branch. Ask to confirm. 

## Output Format
The assistant should provide:
1. PR Creation Summary
   - Title and description
   - Linear issue reference
   - Branch information
   - Review requirements

2. Verification Results
   - Template validation
   - Required sections completed
   - CI status
   - Linear integration status

3. Next Steps
   - Required reviewer actions
   - Additional testing needs
   - Documentation updates
   - Linear status updates

## Example Usage
```
@create-pr.md LIN-123
```
or just
```
@create-pr.md
```
(will prompt for Linear issue number) 
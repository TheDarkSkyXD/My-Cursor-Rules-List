# Squash Commits
# Purpose: Squash multiple commits in the current branch into a single, clean commit

## Input Parameters
Required parameters that should be included in the prompt:
- Target commit hash to squash into (if not provided, will show recent commits and ask)
- New commit message (if not provided, will use concatenated messages or ask)

## Process Steps
1. Show Current State
   ```bash
   # Show commits up to where feature branch diverged from main
   git log --oneline $(git merge-base HEAD main)..HEAD  # Show all commits in feature branch
   ```

2. Validate Branch
   - Ensure we're on a feature branch
   - Check for any uncommitted changes
   - Verify we're not on main/master

3. Perform Squash
   ```bash
   # Reset to the parent of the earliest commit while keeping changes staged
   git reset <earliest_commit_hash>^

   # Create new commit with all changes
   git add .
   git commit -m "<commit_message_title>" -m "<commit_message_details>"
   ```

4. Push Changes
   ```bash
   # Force push with lease for safety
   git push --force-with-lease
   ```

## Required Information
The assistant should:
1. Show recent commits and their hashes
2. Ask for target commit if not provided
3. Suggest a combined commit message if not provided
4. Confirm before force pushing

## Output Format
The assistant should provide:
1. Current State
   - Branch name
   - Recent commits
   - Any uncommitted changes

2. Proposed Changes
   - Target commit to squash into
   - New commit message
   - Number of commits being squashed

3. Verification
   - Confirm branch safety
   - Preview final result
   - Warning about force push

## Example Usage
```
@squash-commits.md abc123 "feat: Implement CI pipeline with all fixes"
```
or just
```
@squash-commits.md
```
(will show commits and prompt for details)

## Safety Checks
- Prevent squashing on main/master
- Warn about force push implications
- Verify remote branch exists
- Check for uncommitted changes
- Use --force-with-lease for safety 
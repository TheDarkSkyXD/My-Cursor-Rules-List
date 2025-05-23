# Implementation Plan for Job Conditional Visibility in GitHub Actions

## Background
From our analysis in `problem_and_solutions.md`, we've identified that our GitHub Actions workflow is causing UI clutter in PRs by showing deployment jobs even when they're skipped. Our recommended solution is to implement **Job Conditional Visibility** (Option 5), which defines the deployment job conditionally so it only appears when it will actually run.

## Goals
1. Remove deployment job display from PR checks UI
2. Maintain single workflow file to preserve submodule handling
3. Ensure deployment still runs correctly on pushes to dev branch
4. No changes to existing test/validation functionality

## Implementation Options

The cursor-tools plan provided two alternatives:

### Option A: Split Workflow (Not Recommended)
Creating a separate workflow file for deployments would be ideal for UI cleanliness but challenging with our complex submodule setup.

### Option B: Job Conditional Visibility (Recommended)
Modify the existing workflow to conditionally define the deployment job only when needed.

## Implementation Steps

### 1. Modify Deployment Job Condition
Update the deployment job condition in `.github/workflows/ci.yml`:

```yaml
deploy-aws:
  name: Continuous Integration / Deploy AWS Lambda Layers
  # Only create this job on push to dev - will not appear at all for PRs
  if: github.event_name == 'push' && github.ref == 'refs/heads/dev'
  needs: [lint-main-repo, lint-submodules, test]
  runs-on: ubuntu-latest
  environment: sandbox
  permissions:
    contents: read
    id-token: write
  # Rest of job remains unchanged
```

The key changes:
* Simplified conditional using `github.event_name == 'push' && github.ref == 'refs/heads/dev'`
* Removed `success() &&` since this job should only run when directly pushing to dev
* Removed `github.event_name != 'pull_request'` (redundant with the positive condition)

### 2. Add Deployment Status Job (Optional Enhancement)
Add an informational job that provides context about deployment status on PRs:

```yaml
deployment-status:
  name: Deployment Status
  runs-on: ubuntu-latest
  needs: [lint-main-repo, lint-submodules, test]
  # This will show in PR checks, but clearly marked as informational
  if: github.event_name == 'pull_request' && github.base_ref == 'dev'
  steps:
    - name: Display deployment status
      run: |
        echo "## ✅ Deployment Ready" >> $GITHUB_STEP_SUMMARY
        echo "This PR targets the dev branch and will trigger a deployment when merged." >> $GITHUB_STEP_SUMMARY
```

### 3. Test the Changes

1. **PR Testing**:
   * Create a PR to any target branch
   * Verify the deploy-aws job does not appear in PR checks
   * If added, verify deployment-status job appears with correct messaging

2. **Direct Push Testing**:
   * Push directly to dev branch
   * Verify the deploy-aws job runs as expected
   * Verify the correct environment variables are used

### 4. Monitoring and Rollback Plan

**Monitoring**:
* Watch for failed deployments after implementation
* Check for unexpected job visibility in PR UI

**Rollback**:
* Restore original conditions if deployments fail unexpectedly:
```yaml
if: |
  success() &&
  github.ref == 'refs/heads/dev' &&
  github.event_name != 'pull_request'
```

## Anticipated Results

1. **PR Checks UI**: Only relevant testing/validation jobs will appear
2. **Deployment**: Will continue to run automatically on pushes to dev branch
3. **Overall Experience**: Cleaner PR validation process with less visual noise

## Post-Implementation Verification

After implementation, verify:
1. PR checks interface is clean and only shows relevant jobs
2. Automatic deployments still trigger correctly on pushes to dev
3. Resource usage is unaffected (same number of workflow runs, just different job visibility) 
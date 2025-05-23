# Phase 1.A: Template Repository Setup - Implementation Plan
Last Updated: 2025-03-24 10:00:34 CDT

## Problem Analysis
- Need to establish a standardized template repository for GitHub migration
- Must support both Python and Node.js projects
- Requires consistent CI/CD, documentation, and development standards

## Solution Design
### Template Structure
```yaml
Template Contents:
  .github/
    workflows/
      python.ci.yml     # Python project CI workflow
      node.ci.yml       # Node.js project CI workflow
    CODEOWNERS         # Code ownership configuration
    pull_request_template.md
    ISSUE_TEMPLATE/
      bug_report.md
      feature_request.md
  .gitignore          # Combined Python and Node.js ignores
  README.md           # Standard README template
  CONTRIBUTING.md     # Contribution guidelines
  LICENSE            # License file
  docs/
    setup.md         # Setup instructions
    development.md   # Development guidelines
  scripts/
    setup.sh         # Environment setup script
    validate.sh      # Validation script
```

## Implementation Steps
1. [x] Repository Creation and Configuration
   ```bash
   gh repo create degree-analytics/repo-template --public --template=""
   ```

2. [x] Directory Structure Setup
   ```bash
   mkdir -p .github/{workflows,ISSUE_TEMPLATE} docs scripts
   ```

3. [x] Template Configuration
   ```bash
   # Configure as template
   gh api \
     --method PATCH \
     -H "Accept: application/vnd.github.v3+json" \
     /repos/degree-analytics/repo-template \
     -f is_template=true

   # Configure merge settings
   gh repo edit degree-analytics/repo-template \
     --enable-merge-commit=false \
     --enable-squash-merge=true \
     --enable-rebase-merge=false \
     --delete-branch-on-merge=true
   ```

4. [x] Branch Protection Setup
   ```bash
   # Get repository ID
   repo_id=$(gh api graphql -f query='
     query($owner:String!, $name:String!) {
       repository(owner:$owner, name:$name) {
         id
       }
     }
   ' -f owner=degree-analytics -f name=repo-template -q .data.repository.id)

   # Create branch protection rule
   gh api graphql -f query='
   mutation($repositoryId:ID!, $pattern:String!) {
     createBranchProtectionRule(input: {
       repositoryId: $repositoryId
       pattern: $pattern
       requiresApprovingReviews: true
       requiredApprovingReviewCount: 1
       requiresStatusChecks: true
       dismissesStaleReviews: true
       isAdminEnforced: true
       allowsForcePushes: false
       allowsDeletions: false
     }) {
       branchProtectionRule {
         id
       }
     }
   }
   ' -f repositoryId="$repo_id" -f pattern="main"
   ```

5. [x] Team Access Configuration
   ```bash
   gh api \
     --method PUT \
     -H "Accept: application/vnd.github.v3+json" \
     /orgs/degree-analytics/teams/engineering/repos/degree-analytics/repo-template \
     -f permission='push'
   ```

## Affected Components
- GitHub repository configuration
- CI/CD workflows
- Documentation structure
- Development scripts

## Testing Plan
1. Repository Structure Validation
   - [x] All required directories present
   - [x] All template files in place
   - [x] File permissions correct

2. GitHub Configuration Testing
   - [x] Repository configured as template
   - [x] Merge settings configured (squash merge, auto-delete)
   - [x] Branch protection rules active
   - [x] Team access verified

3. Workflow Testing
   - [x] Python CI workflow validation
   - [x] Node.js CI workflow validation
   - [x] Pre-commit hooks verification

## Documentation Impact
✅ All documentation tasks completed:
- [x] Creation of setup.md
- [x] Creation of development.md
- [x] Updates to project-plan.md
- [x] Establishment of working-memory structure

## Dependencies
✅ All dependencies satisfied:
- [x] GitHub CLI (gh) installed and configured
- [x] GitHub organization admin access
- [x] Python and Node.js development tools

## References
- Project Plan: docs/project/project-plan.md
- Memory Management: .cursor/rules/core/memory-management.mdc
- Project Scripts: .cursor/rules/project/project-scripts-usage.mdc
``` 
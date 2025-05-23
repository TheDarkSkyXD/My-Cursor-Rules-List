# Phase 14: Test to Dev Branch Migration [ENG-213]

_Last Updated: 2025-04-10T12:45:00+00:00_

## Current Status
📋 **Overall**: Branch migration completed, dev deployment verified working  
🔄 **Next Steps**: Execute comprehensive merge strategy test matrix, fix CI/CD duplicate runs  
⏱️ **Est. Completion**: 16 hours (complete test matrix for all scenarios)  
📊 **Success Rate**: Dev pipeline fully working, production deployment failing as expected

## Problem Analysis

The project has three main challenges:

1. **Branch Migration**: Move from test branch to dev branch as primary development branch ✅
2. **CI/CD Improvement**: Fix GitHub Actions workflow issues (duplicate runs, deployment UI clutter) 🔄
3. **Merge Strategy Investigation**: Complete test matrix for all merge scenarios 🔄

### Latest Findings: Merge Strategy Impact
Previous merge strategy findings have been invalidated. New comprehensive testing approach:

1. **Feature Branch to Dev Testing**
   - Create test PR with minimal changes
   - Document PR creation and update behavior
   - Test all three merge strategies:
     - Squash merge
     - Regular merge
     - Rebase merge (available for feature->dev only)
   - Document both PR closure and resulting push events

2. **Dev to Main Testing**
   - Create test PR from dev to main
   - Document PR creation and update behavior
   - Test available merge strategies:
     - Squash merge
     - Regular merge
     - Note: Rebase merge not available (GitHub safety feature)
   - Document both PR closure and resulting push events

3. **Data Collection Requirements**
   - Event types and timing
   - Jobs executed or skipped
   - Skip logic effectiveness
   - Deployment behavior
   - Complete event sequence

### Branch Protection Impact
We've discovered that GitHub's branch protection features affect available merge strategies:
1. Feature branches → dev:
   - All merge types available
   - Full flexibility for testing
   - Can rewrite history if needed

2. Dev → main:
   - Limited to squash and regular merge
   - Rebase not allowed (protects main history)
   - Prevents force-push to protected branch

This aligns with best practices:
- Maintain clean history on main
- Prevent history rewriting on protected branches
- Allow flexibility in development branches

### Investigation Plan
1. Create feature branch for testing
2. Make minimal change for testing
3. Create PR to dev
4. Document PR behavior
5. Test each merge strategy
6. Repeat process for dev to main
7. Compile comprehensive results
8. Update workflow logic based on findings
9. Create team guidelines

## Current Focus: GitHub Actions CI/CD Improvements

Our current focus is fixing the GitHub Actions workflow to prevent duplicate runs and provide a cleaner deployment process. We've identified a promising solution:

### Note on Test Services [ENG-213]
During investigation, we discovered that trailing whitespace and newline characters in .env files were causing PostgreSQL startup issues. This has been fixed by ensuring proper file formatting. The issue was particularly problematic when copying from template.env to .env, where hidden characters could be introduced. A PR will be created to add pre-commit hooks to catch these formatting issues.

### Job Runtime Control Approach
We've created a [detailed implementation plan](../../final_recommendation_plan.md) that uses a dedicated `check_duplicate` job with output variables to control when other jobs run. This approach:

1. Prevents duplicate job runs when PRs are merged (detects merge commits)
2. Maintains proper branch-specific deployment configuration
3. Works within our submodule constraints 
4. Can be implemented within one day (est. 9 hours)

### Implementation Tasks
- [ ] Add `check_duplicate` job with outputs to control workflow execution
- [ ] Update test and deploy jobs to depend on `check_duplicate` output
- [ ] Ensure environment-specific configurations are preserved 
- [ ] Test solution through various workflow scenarios
- [ ] Roll out to dev then main branches

## Completed Work

### ✅ Branch Migration (DONE)
- [x] Created dev branch from test branch
- [x] Configured branch protection (minimal protection, prevent deletion)
- [x] Updated GitHub Actions workflows to recognize dev branch
- [x] Updated test runner scripts with dynamic environment configuration
- [x] Renamed setup-test-env to setup-ci-env for clarity
- [x] Updated all documentation references

### ✅ Initial CI/CD Updates (DONE)
- [x] Updated GitHub Actions workflows trigger branches
- [x] Updated deployment job trigger conditions
- [x] Updated environment variable mappings and deployment targets
- [x] Updated test runner scripts and helpers
- [x] Modified deployment scripts

### ✅ Documentation Updates (DONE)
- [x] Updated AWS account setup documentation
- [x] Updated Lambda deployment documentation
- [x] Updated repository README files
- [x] Updated CI/CD documentation and PR process documentation

## Implementation Validation Status

- [x] Validated branch creation and protection settings
- [x] Validated GitHub Actions workflow triggers on PRs
- [x] Added debug-context job and captured GitHub context
- [x] Improved concurrency settings
- [x] Verifying deployment to Dev environment
  - [x] Monitoring deployment to dev branch ✅
  - [x] Validating Lambda layer deployment to sandbox ✅
  - [x] Checking resource tagging in sandbox environment ✅
- [x] Validating production pipeline
  - [x] Testing dev to main promotion process
  - [x] Verifying production deployment triggers (expected failure ✓)
  - [ ] Validating environment separation (blocked by AWS credentials - ENG-216)

**Note**: Production deployment failures are expected and documented at this stage. See [github-actions-ci-cd-analysis.md](../../../ci/github-actions-ci-cd-analysis.md) for details.

## Remaining Tasks

### 1. Implement Job Runtime Control for CI/CD
- [ ] Follow the implementation plan in [final_recommendation_plan.md](../../final_recommendation_plan.md)
- [ ] Create feature branch for implementation: `chadwalters/eng-212`
- [ ] Implement the changes to GitHub Actions workflow
- [ ] Test and validate the solution
- [ ] Prepare documentation for team

### 2. Team Communication
- [ ] Prepare documentation for team announcement
- [ ] Schedule team walkthrough session
- [ ] Create migration timeline with deadlines
- [ ] Develop interim workflow for in-progress work

### 3. AWS Deployment Configuration (ENG-216)
- [ ] Configure AWS credentials for both environments
- [ ] Set up GitHub Secrets with proper deployment variables
- [ ] Test controlled deployments to sandbox environment
- [ ] Validate environment separation
- [ ] Update deployment documentation with finalized process

## Appendix: Reference Information

### Branch-Environment Mapping
| Branch | Environment Value | AWS Account | AWS Region | Layer Prefix |
|--------|-------------------|-------------|------------|--------------|
| dev    | dev               | 881490112168 (sandbox) | us-east-2 | dev- |
| main   | prod              | 352676346183 (prod) | us-east-1 | prod- |

### Affected Components
- GitHub Actions workflows (.github/workflows/*)
- GitHub Actions composite actions (.github/actions/*)
- Branch protection settings
- Deployment scripts
- Test runner scripts
- Documentation in docs/

### Future Test Environment Considerations
While implementing the Test environment is out of scope for this phase, we should:
- Document the planned approach for the ephemeral Test environment
- Identify hooks in current CI/CD pipelines for future Test integration
- Note potential considerations for Test environment resource management 
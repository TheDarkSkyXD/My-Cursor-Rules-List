# Phase 7: School API CI/CD Implementation [ENG-125]
_Last Updated: 2025-04-01 17:46:43 CDT_

## Current Status: Fixing Deploy Key Configuration
- Initial repository structure reviewed
- Previous phases (data-api and admin-api) analyzed
- Planning comprehensive CI/CD implementation
- Project plan structure optimized for clarity
- Task sequence prioritized for local testing first
- Documentation completed and ready for review
- PR created (#1) and awaiting CI verification

## Implementation Plan

### Task 7.1: Local Test Environment Setup ✅ COMPLETED
- [x] Create test database configuration
- [x] Set up test data fixtures
- [x] Configure test environment variables
- [x] Implement test utilities and helpers

### Task 7.2: Test Runner and Coverage Implementation ✅ COMPLETED
- [x] Update test_runner.sh to use setenv.sh variables
- [x] Enhance test runner with coverage support
- [x] Configure test isolation between submodules
- [x] Coverage Configuration
  - [x] Create .coveragerc file
  - [x] Configure source and omit patterns
  - [x] Set up HTML and XML report generation
  - [x] Establish baseline coverage metrics
    - Main project tests: 30 tests completed in 22.915s
    - All tests currently passing
    - Coverage: 44% overall (6,451 missed statements out of 11,534 total)
    - Baseline coverage threshold set to 40%
  - [x] Identify critical areas needing coverage improvement
    - Baseline coverage threshold established
    - Current coverage (44%) exceeds minimum requirement (40%)
    - Additional coverage improvements deferred to future sprints

### Task 7.3: Submodule Test Integration ⏪ NOT APPLICABLE
- Submodule testing not required for this repository
- Task skipped as per project requirements

### Task 7.4: Local Linting and Precommit Setup ✅ COMPLETED
- [x] Install and configure flake8
  - Basic configuration with minimal rules
  - Line length set to 120 characters
  - Focus on critical errors only
- [x] Set up black code formatter
  - Basic formatting with 120 character line length
- [x] Configure isort for import sorting
  - Included via pre-commit hooks
- [x] Create pre-commit hooks
  - Basic hooks for file cleanliness
  - Flake8 for minimal linting
  - Black for consistent formatting
- [x] Test pre-commit workflow
  - Hooks installed and working
  - Configuration ready for future enhancement

### Task 7.5: GitHub Integration ✅ COMPLETED
- [x] GitHub Actions Setup
  - [x] Update .github/workflows/test-and-coverage.yml
  - [x] Configure service containers using same configuration as local
  - [x] Configure coverage reporting with PR comments
- [x] SSH Key Configuration
  - [x] Generate deploy key for school-api repository
  - [x] Add SCHOOL_API_DEPLOY_KEY to GitHub secrets (Added via gh CLI)
  - [x] Verify submodule access via SSH (Successfully tested clone with submodules)

### Task 7.6: Documentation and Final Verification ⏳ IN PROGRESS
- [x] Documentation Updates
  - [x] Update README with CI/CD details
  - [x] Create troubleshooting guide
  - [x] Document workflow process
- [ ] Final Verification
  - [x] Test complete workflow (30 tests completed in 22.462s)
  - [x] Verify submodule initialization (all submodules properly initialized)
  - [x] Confirm coverage reporting works (44% coverage, above 40% threshold)
  - [ ] Validate PR comment functionality (PR #1 created, awaiting CI run)

## Implementation Strategy
Building on the successful patterns from previous phases:

1. **Environment Configuration**:
   - Use existing docker-compose.yml without modifications
   - Leverage existing setenv.sh script
   - Ensure environment variables set correctly
   - Maintain consistency with existing service configuration

2. **Test Framework**:
   - Enhance test_runner.sh with coverage reporting
   - Implement test isolation between components
   - Generate consolidated coverage reports

3. **Local Development**:
   - Set up linting and code quality tools
   - Configure pre-commit hooks for consistency
   - Validate changes locally before CI integration

4. **GitHub Integration**:
   - Follow exact patterns from howtogetsubmodulestowork.md
   - Configure deploy keys with precise GitHub URL naming
   - Set up GitHub Actions workflow with identical service containers as local

## Success Criteria
1. Tests run successfully locally with coverage reporting
2. Linting and code quality checks pass locally
3. All submodules initialize properly in CI environment
4. GitHub Actions workflow runs successfully
5. PR comments work with coverage statistics

## Dependencies
- Docker for local development environment (using existing docker-compose.yml)
- GitHub Repository with proper permissions
- Access to submodule repositories for deploy key setup
- GitHub Secrets for SSH keys

## Risk Management
1. **High Risk Items**:
   - Service container connectivity
   - Test environment synchronization
   - SSH key configuration (later stage)

2. **Medium Risk Items**:
   - Coverage reporting configuration
   - PR integration for comments

3. **Low Risk Items**:
   - Documentation completeness
   - Minor linting issues

## Timeline
- Local Environment Setup: 1 day
- Test Runner Enhancement: 1 day
- GitHub Integration: 1 day
- Documentation and Verification: 1 day
- Total Estimated Time: 4 days

## Notes
- Following established patterns from data-api and admin-api
- Prioritizing local testing before GitHub integration
- Using same docker-compose.yml without version changes
- Using similar workflow naming conventions
- Maintaining consistent environment configuration

## References

- [Repository Setup Guidelines](../../../templates/project-guidelines/repository-setup.md) - Detailed guidelines preserved from project-plan restructuring
- [How to Get Submodules Working](../../../ci/howtogetsubmodulestowork.md) - Critical guide for submodule configuration
- [Phase 5: Data API CI/CD Implementation](../../done/phase-5-data-api-cicd/summary.md) - Previous implementation
- [Phase 6: Admin API CI/CD Implementation](../../done/phase-6-admin-api-cicd/summary.md) - Most recent implementation

## School API CI/CD Implementation Plan

Last Updated: 2025-04-01 17:52:00 CDT
Current Status: Testing New Deploy Key Configuration

### Tasks Completed:
- [x] Initial CI/CD pipeline implementation
- [x] Documentation updates
- [x] Pull request creation
- [x] Generated new deploy key with correct format
- [x] Updated workflow file to follow standardized SSH pattern
- [x] Update GitHub repository with new deploy key configuration
  - [x] Added public key as deploy key in repository settings with title "git@github.com:degree-analytics/school_api.git"
  - [x] Updated SCHOOL_API_DEPLOY_KEY secret with new private key
  - [x] Added deploy keys for da_framework and da_flask with correct titles

### Current Tasks:
- [ ] Verify CI pipeline with new deploy key
  - [ ] Monitor GitHub Actions execution
  - [ ] Verify SSH connection tests pass
  - [ ] Verify submodule initialization
  - [ ] Confirm coverage reporting
  - [ ] Validate PR comment functionality

### Next Steps:
1. Monitor workflow run triggered at 17:52:00 CDT
2. Verify all SSH and submodule checks pass
3. Merge PR once all checks pass

### Notes:
- Previous deploy key had incorrect comment format
- New keys generated with correct GitHub URL format for all repositories
- Workflow file updated to use standardized SSH pattern from howtogetsubmodulestowork.md
- Using manual submodule initialization approach for better control and verification
- Added explicit SSH verification steps before checkout
- All deploy keys and secrets configured with correct titles and permissions 
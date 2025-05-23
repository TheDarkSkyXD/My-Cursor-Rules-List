# Phase 9: Integrations API CI/CD Implementation [ENG-131]
_Last Updated: 2025-04-02 14:08:01 CDT_

## Problem Analysis
The Integrations API repository requires a CI/CD pipeline setup similar to what was implemented for the School API, Admin API, Data API, and Spark API repositories. This ensures consistency in code quality, testing, and deployment across all repositories.

## Solution Design
We will implement a CI/CD pipeline that includes:
1. Submodule initialization and verification
2. Environment setup with required services (PostgreSQL, Redis, LocalStack)
3. Test execution with coverage reporting
4. Linting with pre-commit hooks (light-touch approach)
5. GitHub Actions workflow for PR integration

## Implementation Steps

### 1. Submodule Initialization and Verification
- [x] Generate deploy keys following the exact process in docs/ci/howtogetsubmodulestowork.md
- [x] Add deploy keys to repositories with SSH URL pattern in comments
- [x] Add private keys as repository secrets
- [x] Initialize submodules in the repository
- [x] Verify submodule directory structure matches .gitmodules configuration

### 2. Local Test Runner Setup
- [x] Update test_runner.sh to include coverage reporting
- [x] Update setenv.sh to ensure environment variables are properly set
- [x] Test the runner locally to verify functionality
- [x] Create coverage configuration file (.coveragerc)

### 3. Test Coverage Configuration
- [x] Add pytest configuration to support coverage
- [x] Update requirements-test.txt with needed testing dependencies
- [x] Configure coverage thresholds (minimum 40%)
- [x] Test coverage reporting locally

### 4. Linting and Pre-commit Hooks
- [x] Copy light-touch linting standards from admin_api repository
- [x] Add minimal .pre-commit-config.yaml focusing on critical linting only
- [x] Configure flake8 with permissive rules similar to admin_api
- [x] Set up basic black and isort for code formatting
- [x] Test pre-commit hooks locally
- [ ] Address code quality issues found by pre-commit:
  - [ ] Fix critical code issues (undefined vars, f-strings)
  - [ ] Update docstring formatting
  - [ ] Address line length violations
  - [ ] Resolve YAML validation issues

### 5. GitHub Actions Workflow
- [x] Configure GitHub workflow for test execution
- [x] Set up service containers (PostgreSQL, Redis, LocalStack)
- [x] Implement deploy key configuration following docs/ci/howtogetsubmodulestowork.md
- [x] Implement coverage reporting in PR comments
- [ ] Test the full workflow with a test PR
  - Created PR with timezone test case to verify workflow functionality
  - Currently debugging pre-commit check failures
  - Need to verify all checks pass after code quality fixes

## Affected Components
- test_runner.sh
- setenv.sh
- .github/workflows/test-and-coverage.yml
- .pre-commit-config.yaml
- .flake8
- .coveragerc
- pytest.ini
- requirements-test.txt
- requirements-dev.txt

## Testing Plan
1. Verify submodule initialization works correctly
2. Test the test_runner.sh script locally
3. Verify coverage reporting works correctly
4. Test pre-commit hooks with various code changes
5. Test the GitHub Actions workflow with a test PR

## Documentation Impact
- Update project-plan.md with Phase 9 information
- Create phase-9-integrations-api-cicd documentation
- Update repository-status.md with Integrations API status

## Dependencies
- SSH access to private repositories (da_flask, da_framework)
- GitHub secrets configuration for repository access
- Deploy keys set up exactly as specified in docs/ci/howtogetsubmodulestowork.md
- Understanding of patterns from previous implementations (Phase 5-8)

## Success Criteria
- [x] Project plan updated with Phase 9
- [ ] Submodules initialize correctly
- [ ] Local test runner works with coverage reporting
- [ ] Pre-commit hooks installed and working
- [ ] GitHub Actions workflow passes on PR
- [ ] Coverage report generated and available in PR comments
- [ ] Minimum coverage threshold met (40%) 
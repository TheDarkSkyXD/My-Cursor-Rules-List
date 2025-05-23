# Phase 8: Spark API CI/CD Implementation Plan [ENG-130]

## Problem Analysis
The Spark API repository needs a CI/CD pipeline similar to the previously implemented pipelines for Data API, Admin API, and School API. This includes:
- Properly initializing submodules 
- Setting up test runners with coverage reporting
- Configuring linting and pre-commit hooks
- Implementing GitHub Actions workflows

## Solution Design
We will follow the patterns established in previous implementations, particularly Phase 7 (School API), while adapting to the specific requirements of the Spark API. The implementation will focus on:
1. Submodule initialization and configuration
2. Test runner script enhancements
3. Environment configuration
4. Coverage reporting setup
5. GitHub Actions workflow configuration
6. Linting and pre-commit hook setup

## Implementation Steps

### Test Infrastructure Setup
- [x] Initialize and verify submodules
- [x] Configure test environment setup (setenv.sh)
- [x] Implement test runner script
- [x] Configure coverage reporting in pytest.ini
- [x] Verify local test execution
- [x] Document test infrastructure setup

### GitHub Actions Submodule Setup
- [x] Generate Deploy Keys
  - [x] Generate key for da_framework with correct comment
  - [x] Generate key for da_flask with correct comment
  - [x] Generate key for spark_api repository
- [x] Configure Repository Deploy Keys
  - [x] Add da_framework public key to da_framework repo
  - [x] Add da_flask public key to da_flask repo
  - [x] Add spark_api public key to spark_api repo
- [x] Set Repository Secrets
  - [x] Add DA_FRAMEWORK_DEPLOY_KEY secret
  - [x] Add DA_FLASK_DEPLOY_KEY secret
  - [x] Add SPARK_API_DEPLOY_KEY secret
- [x] Configure .gitmodules
  - [x] Verify correct paths and URLs
  - [x] Ensure SSH URLs are used
  - [x] Specify correct branches

### CI/CD Pipeline Setup
- [x] Configure GitHub Actions workflow
  - [x] Set up SSH agent with deploy keys
  - [x] Configure Git for SSH
  - [x] Set up Python environment
  - [x] Configure environment variables
  - [x] Add test execution step
  - [x] Configure coverage reporting
  - [x] Add PR checks
- [ ] ~~Implement deployment workflow~~
  - [ ] ~~Configure AWS credentials~~
  - [ ] ~~Set up deployment stages~~
  - [ ] ~~Add deployment verification~~

### Documentation
- [x] Update working memory with test setup details
- [x] Document CI/CD pipeline configuration
- [ ] ~~Create deployment runbook~~

## Affected Components
- test_runner.sh
- setenv.sh
- .github/workflows/test-and-coverage.yml
- .gitmodules
- requirements-dev.txt
- .pre-commit-config.yaml
- setup.cfg

## Testing Plan
1. **Local Testing**
   - [x] Initialize submodules
   - [x] Run test_runner.sh locally
   - [x] Fix da_framework test issues
   - [x] Verify coverage reporting
   - [x] Test pre-commit hooks
     - [x] Align with school_api's lighter linting approach
     - [x] Configure flake8 to match school_api standards
     - [x] Verify all hooks pass

2. **GitHub Testing**
   - [x] Verify submodule cloning workflow
     - [x] Test SSH key configuration
     - [x] Verify submodule paths
     - [x] Check submodule commit hashes
   - [ ] Create a test PR to verify workflow
     - [x] Push changes to branch
     - [ ] Waiting for workflow completion
   - [ ] Validate coverage reporting
   - [ ] Check PR comments

## Documentation Impact
- [x] Update project-plan.md with Phase 8
- [x] Create documentation for CI/CD setup
- [ ] Document coverage thresholds and requirements
- [x] Document submodule setup and verification process

## Dependencies
- Python 3.10
- pytest and coverage tools
- GitHub Actions
- GitHub CLI (gh) for deploy key setup
- Write access to all repositories

## Verification Criteria
- [x] All tests pass locally with coverage reporting
- [x] Submodules clone successfully in CI
- [ ] CI pipeline successfully runs tests
- [ ] Coverage reports generated in CI
- [x] Documentation complete and accurate 

## Common Issues to Watch For
1. "Repository Not Found" Errors - Check deploy key write access
2. SSH Key Issues - Verify key comments match repository URLs
3. Submodule Checkout Fails - Confirm Git SSH configuration
4. Multiple Deploy Keys - Remove old keys before adding new ones

_Last Updated: 2025-04-02 12:46:04 CDT_ 
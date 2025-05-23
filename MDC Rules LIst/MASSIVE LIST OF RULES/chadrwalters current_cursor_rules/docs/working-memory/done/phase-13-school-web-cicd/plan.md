# Phase 13: School Web CI Implementation [ENG-134]

_Last Updated: 2025-04-08 11:32:33 CDT_

## Problem Analysis

The school_web repository requires a continuous integration (CI) pipeline to ensure code quality, maintain test coverage, and provide automated verification of builds. Currently, the repository has no CI configuration, no automated testing, and no standardized linting process. The repository includes a submodule (react-components) that requires special handling in the CI workflow.

## Solution Design

Implement a comprehensive CI pipeline following the established patterns from Phase 11 (Admin Web CI/CD), focusing solely on the CI portions. This includes:

1. GitHub Actions workflow for automated testing and validation
2. Linting configuration with a light-touch approach
3. Initial test suite with basic coverage
4. Build verification process
5. Proper submodule handling with deploy keys

## Implementation Steps

### 1. Repository Structure Setup ✅
- [x] Create `.github/workflows` directory for CI configuration
- [x] Create `scripts` directory for build verification
- [x] Create `src/tests` directory for test files

### 2. Copy Files from admin_web ✅
Copied the following files from admin_web as a starting point:
- [x] `.github/workflows/ci.yml` → `.github/workflows/ci.yml`
- [x] `.eslintrc.js` → `.eslintrc.js`
- [x] `.pre-commit-config.yaml` → `.pre-commit-config.yaml`
- [x] `.env.test` → `.env.test`
- [x] `scripts/verify-start.js` → `scripts/verify-start.js`

### 3. SSH Key Configuration for Submodules ✅
Following the verified pattern in howtogetsubmodulestowork.md:

1. [x] Generate deploy keys:
   ```bash
   # For school_web repository
   ssh-keygen -t ed25519 -f school-web -N "" -C "git@github.com:degree-analytics/school_web.git"
   
   # For react-components repository
   ssh-keygen -t ed25519 -f react-components -N "" -C "git@github.com:degree-analytics/react-components.git"
   ```

2. [x] Add deploy keys to repositories:
   - [x] Add public key to school_web repository
   - [x] Add public key to react-components repository
   - [x] Ensure all keys have write access

3. [x] Add private keys as secrets:
   - [x] Add SCHOOL_WEB_DEPLOY_KEY to school_web repository
   - [x] Add REACT_COMPONENTS_DEPLOY_KEY to school_web repository

### 4. CI Workflow Configuration ✅
- [x] Modify SSH agent configuration for submodules
- [x] Update Git configuration for SSH URLs
- [x] Configure proper checkout with submodules enabled
- [x] Update environment variables for school_web
- [x] Configure dependency installation and caching
- [x] Set up testing with coverage
- [x] Configure linting
- [x] Set up build verification

### 5. Testing Infrastructure ✅
- [x] Create initial tests for utilities (sort.js)
- [x] Add simple component tests for existing components
- [x] Configure Jest coverage thresholds (minimal initial values)
- [x] Add test:coverage script to package.json

### 6. Linting and Code Quality ✅
- [x] Adjust the copied ESLint configuration with light-touch rules
- [x] Review the pre-commit hooks configuration
- [x] Configure cfn-lint for CloudFormation templates

### 7. Build Verification ✅
- [x] Adapt the verify-start.js script to validate build process
- [x] Customize .env.test for CI environment
- [x] Add verification script to package.json
- [x] Fix submodule path in verify-start.js
- [x] Clean up template files (index.html, manifest.json)

### 8. Implementation Validation ⏳
1. Local Test Validation ✓
   - [x] Install all dependencies (npm install)
   - [x] Run tests locally (npm run test:coverage)
   - [x] Verify all tests pass
   - [x] Verify coverage meets thresholds
   - [x] Fix any test failures or coverage issues

2. Local Build Validation ✓
   - [x] Create .env.local with required variables
   - [x] Start development server (npm start)
   - [x] Verify application loads correctly
   - [x] Run build verification (npm run verify-start)
   - [x] Fix any build or startup issues

3. CI Pipeline Validation ⏳
   - [x] Create test branch for CI validation
   - [x] Push changes and create PR
   - [x] Address greptilebot review comments
   - [ ] Verify GitHub Actions workflow triggers
   - [ ] Monitor CI pipeline execution
   - [ ] Verify all CI steps complete successfully:
     * Dependency installation
     * Test execution
     * Coverage reporting
     * Build verification
     * Linting checks
   - [ ] Fix any CI pipeline issues
   - [ ] Document successful validation

### 9. Documentation ⏳
- [ ] Update project documentation to reflect CI implementation
- [ ] Add Phase 13 completion to project-plan.md when done
- [ ] Document testing approach and coverage requirements
- [ ] Document submodule handling approach

## Affected Components

- `.github/workflows/` - New CI workflow
- `package.json` - Script additions and Jest configuration
- `.eslintrc.js` - ESLint configuration
- `.pre-commit-config.yaml` - Pre-commit hook setup
- `src/tests/` - New test files
- `scripts/` - Build verification scripts
- `.env.test` - CI environment configuration
- `public/` - Template files cleanup

## Testing Plan

1. Verify CI workflow locally:
   - Run tests with coverage reporting ✅
   - Run linting checks ✅
   - Verify build process ✅

2. Test GitHub Actions workflow:
   - Push to feature branch to trigger workflow ⏳
   - Validate all steps complete successfully, including submodule checkout
   - Check artifacts and reports

3. Verify submodule access:
   - Confirm submodules can be accessed via SSH in CI environment
   - Verify proper commit hashes are checked out

## Documentation Impact

- Update project-plan.md with Phase 13 details
- Update repository-status.md to reflect CI implementation
- Create summary.md upon completion
- Document submodule handling process

## Dependencies

- Admin Web repository (../admin_web) - Source for CI workflow patterns
- Submodule access to react-components repository (GitHub)
- GitHub Actions - CI platform
- Jest - Testing framework
- ESLint - Linting tool
- Pre-commit - Git hooks framework 
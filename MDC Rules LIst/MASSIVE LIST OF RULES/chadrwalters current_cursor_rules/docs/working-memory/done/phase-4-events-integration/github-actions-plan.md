# GitHub Actions Workflow Implementation Plan

**Date**: 2025-03-28 17:15:14 UTC  
**Task Reference**: Phase 4.C - GitHub CI/CD Setup  
**JIRA Ticket**: ENG-115  

## Overview

This document outlines the plan for implementing GitHub Actions workflows for the events repository. We will follow patterns established in the da_flask and da_framework repositories while addressing the specific requirements of the events repository, including submodule access and LocalStack integration.

## Prerequisites

- Successfully completed Phase 4.A (Environment Setup)
- Successfully completed Phase 4.B (Test Runner Implementation)
- Access to GitHub repository settings
- Access to create deploy keys for submodule access
- Understanding of events repository test requirements

## Implementation Steps

### 1. Deploy Key Setup for Submodules

1. Create SSH deploy key for the da_framework submodule:
   ```bash
   ssh-keygen -t ed25519 -N "" -C "github-actions-events" -f events_deploy_key
   ```

2. Add the public key as a deploy key in the da_framework repository:
   - Go to Settings > Deploy keys in the da_framework repository
   - Add the public key with read-only access
   - Do not allow write access for CI/CD deploy keys

3. Add the private key as a repository secret in the events repository:
   - Go to Settings > Secrets and variables > Actions
   - Create a new repository secret named `DA_FRAMEWORK_DEPLOY_KEY`
   - Paste the private key content

### 2. GitHub Actions Workflow Configuration

#### 2.1 Basic Workflow Setup and SSH Configuration

```yaml
name: Events CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    # Configure service containers
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: test_admin
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test
          TZ: UTC
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      # Redis service container
      redis:
        image: redis:6
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      # LocalStack for AWS services simulation
      localstack:
        image: localstack/localstack:latest
        env:
          SERVICES: s3,sqs,sns,secretsmanager,dynamodb,kinesis
          DEBUG: 1
          DATA_DIR: /tmp/localstack/data
          DOCKER_HOST: unix:///var/run/docker.sock
          AWS_DEFAULT_REGION: us-east-1
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
        ports:
          - 4566:4566
        options: >-
          --health-cmd "curl -f http://localhost:4566/_localstack/health || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

#### 2.2 SSH Configuration and Checkout

```yaml
    steps:
      # Configure SSH for submodule access
      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: |
            ${{ secrets.DA_FRAMEWORK_DEPLOY_KEY }}
      
      - name: Configure Git to use SSH
        run: |
          git config --global url."git@github.com:".insteadOf "https://github.com/"
          git config --global url."git@github.com:".insteadOf "git://github.com/"
          ssh-keyscan github.com >> ~/.ssh/known_hosts
      
      # Check SSH access to repositories
      - name: Verify SSH repository access
        run: |
          echo "Testing SSH connection to github.com"
          ssh -T git@github.com || echo "Exit code: $?"
          
          echo "Testing repository access to da_framework"
          git ls-remote git@github.com:degree-analytics/da_framework.git || echo "Exit code: $?"
      
      # Checkout with submodules
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0
```

#### 2.3 Python Environment Setup

```yaml
      - name: Set up Python 3.10
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f test-requirements.txt ]; then pip install -r test-requirements.txt; fi
          pip install coverage
          pip install awscli-local
```

#### 2.4 Environment and LocalStack Configuration

```yaml
      - name: Configure environment
        run: |
          cp template.env .env
          echo "TZ=UTC" >> .env
          echo "DATABASE_URL=postgresql://test_admin:password@localhost:5432/test" >> .env
          echo "REDIS_URL=redis://localhost:6379/0" >> .env
          echo "AWS_DEFAULT_REGION=us-east-1" >> .env
          echo "AWS_ACCESS_KEY_ID=test" >> .env
          echo "AWS_SECRET_ACCESS_KEY=test" >> .env
          echo "AWS_ENDPOINT_URL=http://localhost:4566" >> .env
      
      # Initialize LocalStack with required AWS resources
      - name: Initialize LocalStack
        run: |
          # Wait for LocalStack to be fully available
          timeout 30 bash -c 'until curl -s http://localhost:4566/_localstack/health; do sleep 1; done'
          
          # Make script executable and run it
          chmod +x ./localstack-setup/init_localstack.sh
          ./localstack-setup/init_localstack.sh
          
          # Verify LocalStack setup
          awslocal s3 ls
          awslocal sqs list-queues
          awslocal sns list-topics
          awslocal dynamodb list-tables
```

#### 2.5 Test Execution

```yaml
      - name: Run tests
        run: |
          ./test_runner.sh
        env:
          TZ: UTC
          PYTHONPATH: ${{ github.workspace }}
          DATABASE_URL: postgresql://test_admin:password@localhost:5432/test
          REDIS_URL: redis://localhost:6379/0
          AWS_DEFAULT_REGION: us-east-1
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_ENDPOINT_URL: http://localhost:4566
```

#### 2.6 Coverage Reporting

```yaml
      - name: Generate coverage report
        run: |
          coverage report
          coverage xml
          
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage.xml
          fail_ci_if_error: false
          
      # Save coverage badge if on main branch
      - name: Update coverage badge
        if: github.ref == 'refs/heads/main'
        run: |
          COVERAGE_PCT=$(coverage report | grep TOTAL | awk '{print $NF}' | sed 's/%//')
          echo "Current coverage: $COVERAGE_PCT%"
          
          # Update gist with coverage data
          if [ -n "${{ secrets.GIST_SECRET }}" ] && [ -n "${{ secrets.COVERAGE_GIST_ID }}" ]; then
            # Install gist utility
            npm install -g gist-cli
            
            # Create badge data JSON
            echo '{"schemaVersion": 1,"label": "coverage","message": "'$COVERAGE_PCT'%","color": "green"}' > coverage_badge.json
            
            # Upload to gist
            gist -u ${{ secrets.COVERAGE_GIST_ID }} coverage_badge.json -a ${{ secrets.GIST_SECRET }}
          fi
```

### 3. Branch Protection Rules

Access GitHub repository settings and configure branch protection rules that match the python_frameworks repository:

1. Navigate to Settings > Branches > Branch protection rules
2. Add rule for `main` branch with the following settings:
   - **Require status checks to pass before merging:** Enabled
   - **Require branches to be up to date before merging:** Enabled
   - **Status checks required:** `Events CI / test`
   - **Include administrators:** Disabled (to match python_frameworks settings)
   - **Allow force pushes:** Enabled
   - **Allow deletions:** Disabled
   - **Restrict who can push to matching branches:** Disabled (matches python_frameworks)

3. Configure repository settings (via Settings > General):
   - **Allow squash merging:** Disabled
   - **Allow merge commits:** Disabled
   - **Allow rebase merging:** Enabled
   - **Always suggest updating pull request branches:** Enabled
   - **Automatically delete head branches:** Enabled

### 4. GitHub Secrets Configuration

1. Navigate to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `DA_FRAMEWORK_DEPLOY_KEY`: Private SSH key for da_framework
   - `CODECOV_TOKEN`: Token from codecov.io for coverage reporting
   - `GIST_SECRET`: GitHub token for updating coverage badge gist (optional)
   - `COVERAGE_GIST_ID`: Gist ID for coverage badge (optional)

## Implementation Considerations

### Submodule Configuration

The events repository relies on the da_framework submodule. Our workflow must:
1. Use SSH for secure access to the submodule
2. Configure Git to use SSH instead of HTTPS
3. Use GitHub deploy keys for repository access

### LocalStack Integration

The events repository depends on AWS services which we'll mock using LocalStack:
1. S3 buckets
2. SQS queues
3. SNS topics
4. Kinesis streams
5. DynamoDB tables
6. Secrets Manager

The `init_localstack.sh` script will configure all these services in the LocalStack container before tests run.

### Coverage Configuration

Our .coveragerc file is already configured with:
- Source directory
- Branch coverage tracking
- Appropriate omissions
- 24% minimum coverage threshold
- HTML report configuration

This configuration will be used for coverage reporting in the CI workflow.

## Testing and Validation

1. Create a test branch with failing tests
2. Verify CI workflow fails as expected
3. Fix tests and verify CI workflow passes
4. Test branch protection by attempting to merge failing tests
5. Verify coverage reporting works correctly
6. Test submodule access to confirm SSH keys are working
7. Verify LocalStack services are properly initialized and accessible

## Success Criteria

| Metric | Target |
|--------|--------|
| Workflow Execution Time | < 5 minutes |
| Test Success Rate | 100% |
| Coverage Reporting | Accurately reflects test coverage (37%) |
| Branch Protection | Prevents merging failing code |
| Submodule Access | Successfully accesses da_framework |
| LocalStack Services | All AWS services properly initialized |

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH-Agent Action](https://github.com/webfactory/ssh-agent)
- [LocalStack GitHub Actions Example](https://github.com/localstack/localstack-pro-samples/tree/master/github-actions-integration)
- [python_frameworks GitHub Workflow Reference](.github-backup/workflows/ci.yml)
- [python_frameworks Repository Settings](.github-backup/settings.yml) 
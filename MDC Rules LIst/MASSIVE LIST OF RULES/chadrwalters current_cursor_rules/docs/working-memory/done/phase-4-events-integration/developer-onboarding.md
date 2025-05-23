# Events Repository Developer Onboarding Guide

Last Updated: 2025-03-28 17:50:24 UTC

## Overview

This document provides step-by-step instructions for setting up and working with the Events repository after the GitHub migration. The Events repository has specific requirements for testing and development due to its dependencies on PostgreSQL, Redis, and LocalStack for AWS service emulation.

## Prerequisites

- Git 2.25+
- Python 3.10 (required, will not work with other versions)
- Docker and Docker Compose
- Access to the GitHub repositories:
  - degree-analytics/events
  - degree-analytics/da_framework (as submodule)

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository with submodules
git clone --recursive git@github.com:degree-analytics/events.git
cd events

# If you've already cloned without --recursive
git submodule update --init --recursive
```

### 2. SSH Keys Setup

For working with submodules, SSH keys are required:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add your SSH key to the ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add your public key to GitHub
# Copy the public key content
cat ~/.ssh/id_ed25519.pub
# Add this key to your GitHub account settings
```

### 3. Environment Configuration

```bash
# Create environment file from template
cp template.env .env

# Edit .env file with your local settings
# IMPORTANT: Ensure TZ=UTC (case-sensitive)
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `AWS_ENDPOINT_URL`: LocalStack endpoint (http://localhost:4566)
- `TZ`: Must be set to "UTC" (case-sensitive)

### 4. Docker Services Setup

```bash
# Start required services
docker-compose up -d postgres redis localstack

# Verify services are running
docker-compose ps
```

### 5. LocalStack Initialization

```bash
# Make initialization script executable
chmod +x ./localstack-setup/init_localstack.sh

# Run initialization script
./localstack-setup/init_localstack.sh

# Verify resources were created
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

## Development Workflow

### Running Tests

```bash
# Run all tests with coverage
./test_runner.sh

# Run specific tests
python -m pytest tests/path/to/test_file.py -v
```

### Code Style and Linting

```bash
# Run linting checks
flake8 src
black --check src
isort --check-only src
```

### Local Development

1. Ensure Docker services are running:
```bash
docker-compose ps
```

2. Make your changes to the codebase

3. Run tests to verify changes:
```bash
./test_runner.sh
```

4. Commit changes with descriptive message:
```bash
git add .
git commit -m "ENG-XXX: Description of changes"
```

## Common Issues and Troubleshooting

### PostgreSQL Timezone Issues

If you encounter timezone-related errors in PostgreSQL:
- Ensure `TZ=UTC` is set in your .env file (case sensitive)
- Restart the PostgreSQL container: `docker-compose restart postgres`
- Verify timezone in PostgreSQL: `docker-compose exec postgres psql -U test_admin -c "SHOW timezone;"`

### LocalStack Connectivity

If tests can't connect to LocalStack:
- Ensure LocalStack is running: `docker-compose ps localstack`
- Verify LocalStack health: `curl http://localhost:4566/_localstack/health`
- Check that resources are created: `aws --endpoint-url=http://localhost:4566 s3 ls`

### Submodule Issues

If you encounter submodule-related errors:
- Ensure SSH keys are correctly set up and added to GitHub
- Try updating submodules: `git submodule update --remote`
- Check Git configuration: `git config --list | grep url`

### CI/CD Pipeline

The GitHub Actions workflow runs:
- PostgreSQL and Redis in service containers
- LocalStack for AWS service emulation
- Python 3.10 environment with dependencies
- Test suite with coverage reporting

When opening Pull Requests, ensure all CI checks pass before requesting review.

## Additional Resources

- [Repository Status Tracking](../../project/repository-status.md)
- [Project Plan](../../project/project-plan.md)
- [Phase 4 Implementation Plan](./plan.md)
- [LocalStack Documentation](https://docs.localstack.cloud/) 
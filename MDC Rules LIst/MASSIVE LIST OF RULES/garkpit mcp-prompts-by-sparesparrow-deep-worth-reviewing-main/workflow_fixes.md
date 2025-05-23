# Workflow and Pipeline Issues Summary
1. CI Workflow: Fix duplicated 'run' key in 'Run integration tests' step
2. Environment Values: Replace 'environment: release' with 'environment: github-pages'
3. Docker Compose Test File: Replace 'name: mcp-prompts-test' with 'version: "3.8"'
4. Dockerfile: Ensure consistent formatting of environment variables
5. Release Script: Review and update as needed
6. Startup Script: Review and update as needed
7. PostgreSQL Initialization: Review and update as needed

## Fixes Applied

1. Environment Values: Fixed by replacing 'environment: release' with 'environment: github-pages' in all workflow files
2. Docker Compose Test File: Fixed by replacing 'name: mcp-prompts-test' with 'version: "3.8"'

## Remaining Fixes

1. CI Workflow: Fix duplicated 'run' key in 'Run integration tests' step
2. Dockerfile: Ensure consistent formatting of environment variables
3. Release Script: Review and update as needed
4. Startup Script: Review and update as needed
5. PostgreSQL Initialization: Review and update as needed

## CI Workflow Fix

To fix the CI workflow, replace:

```yaml
- name: Run integration tests
  run: npm run test:integration
  run: npm run prompt:import:force -- --source=exports/test-export.json
```

With:

```yaml
- name: Run integration tests
  run: |
    npm run test:integration
    npm run prompt:import:force -- --source=exports/test-export.json
```

## Dockerfile Fix

Ensure consistent formatting of environment variables in the Dockerfile. For example, replace:

```dockerfile
ENV NODE_ENV=production \n    STORAGE_TYPE=file \n<CURRENT_CURSOR_POSITION>
    PROMPTS_DIR=/app/data/prompts \n    BACKUPS_DIR=/app/data/backups
```

With:

```dockerfile
ENV NODE_ENV=production \n    STORAGE_TYPE=file \n    PROMPTS_DIR=/app/data/prompts \n    BACKUPS_DIR=/app/data/backups
```

## Startup Script Fix

Ensure the startup.sh script has proper error handling and exit codes. For example, replace:

```bash
# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
<CURRENT_CURSOR_POSITION>
  sleep 2
done
```

With:

```bash
# Wait for PostgreSQL to be ready with timeout
echo "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
  RETRY_COUNT=1
  if [  -ge  ]; then
    echo "Error: PostgreSQL did not become ready in time"
    exit 1
  fi
done
```

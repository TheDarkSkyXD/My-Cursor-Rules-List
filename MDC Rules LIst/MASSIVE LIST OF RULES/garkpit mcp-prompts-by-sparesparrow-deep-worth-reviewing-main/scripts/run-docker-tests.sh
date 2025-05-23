#!/bin/bash
set -e

# Display help
function show_help {
  echo "Usage: ./run-docker-tests.sh [OPTIONS]"
  echo "Run tests in Docker containers using different configurations"
  echo ""
  echo "Options:"
  echo "  --all           Run all test types (default)"
  echo "  --unit          Run only unit tests"
  echo "  --integration   Run only integration tests"
  echo "  --health-check  Run only health check tests"
  echo "  --clean         Clean up containers, networks, and volumes after testing"
  echo "  --coverage      Generate and save test coverage reports"
  echo "  --watch         Watch for file changes and rerun tests (development mode)"
  echo "  --help          Display this help message"
  echo ""
  echo "Example: ./run-docker-tests.sh --integration --clean"
  exit 0
}

# Default values
RUN_ALL=true
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_HEALTH_CHECK=false
CLEAN_UP=false
COVERAGE=false
WATCH_MODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --all)
      RUN_ALL=true
      ;;
    --unit)
      RUN_ALL=false
      RUN_UNIT=true
      ;;
    --integration)
      RUN_ALL=false
      RUN_INTEGRATION=true
      ;;
    --health-check)
      RUN_ALL=false
      RUN_HEALTH_CHECK=true
      ;;
    --clean)
      CLEAN_UP=true
      ;;
    --coverage)
      COVERAGE=true
      ;;
    --watch)
      WATCH_MODE=true
      ;;
    --help)
      show_help
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      ;;
  esac
  shift
done

# Create results directory if it doesn't exist
mkdir -p test-results

# Run unit tests
function run_unit_tests {
  echo "Running unit tests in Docker..."
  
  if [ "$WATCH_MODE" = true ]; then
    docker compose -f docker-compose.yml -f docker/docker-compose.test.yml run --rm mcp-unit-tests npm run test:unit -- --watch
  else
    COMMAND="npm run test:unit"
    if [ "$COVERAGE" = true ]; then
      COMMAND="$COMMAND -- --coverage --coverageDirectory=/app/test-results/coverage-unit"
    fi
    docker compose -f docker-compose.yml -f docker/docker-compose.test.yml run --rm mcp-unit-tests $COMMAND
  fi
}

# Run integration tests
function run_integration_tests {
  echo "Running integration tests in Docker..."
  
  if [ "$WATCH_MODE" = true ]; then
    docker compose -f docker-compose.yml -f docker/docker-compose.test.yml run --rm mcp-integration-tests npm run test:integration -- --watch
  else
    COMMAND="npm run test:integration"
    if [ "$COVERAGE" = true ]; then
      COMMAND="$COMMAND -- --coverage --coverageDirectory=/app/test-results/coverage-integration"
    fi
    docker compose -f docker-compose.yml -f docker/docker-compose.test.yml run --rm mcp-integration-tests $COMMAND
  fi
}

# Run health check tests
function run_health_check_tests {
  echo "Running health check tests in Docker..."
  
  docker compose -f docker-compose.yml -f docker/docker-compose.test.yml --profile health-check up --build -d
  docker compose -f docker-compose.yml -f docker/docker-compose.test.yml --profile health-check logs -f mcp-health-check-tests
  
  # Wait for test runner to complete
  echo "Waiting for tests to complete..."
  docker wait mcp-health-check-tests
  
  # Check exit code
  EXIT_CODE=$(docker inspect mcp-health-check-tests --format='{{.State.ExitCode}}')
  if [ "$EXIT_CODE" != "0" ]; then
    echo "Health check tests failed with exit code $EXIT_CODE"
    if [ "$CLEAN_UP" = true ]; then
      clean_up_health_check
    fi
    exit $EXIT_CODE
  fi
  
  echo "Health check tests completed successfully"
  
  if [ "$CLEAN_UP" = true ]; then
    clean_up_health_check
  fi
}

# Clean up Docker resources for regular tests
function clean_up_regular {
  echo "Cleaning up Docker resources..."
  docker compose -f docker-compose.yml -f docker/docker-compose.test.yml down -v
}

# Clean up Docker resources for health check tests
function clean_up_health_check {
  echo "Cleaning up health check Docker resources..."
  docker compose -f docker-compose.yml -f docker/docker-compose.test.yml --profile health-check down -v
}

# Run all tests
function run_all_tests {
  run_unit_tests
  run_integration_tests
  run_health_check_tests
}

# Execute requested test types
if [ "$RUN_ALL" = true ]; then
  run_all_tests
else
  if [ "$RUN_UNIT" = true ]; then
    run_unit_tests
  fi
  if [ "$RUN_INTEGRATION" = true ]; then
    run_integration_tests
  fi
  if [ "$RUN_HEALTH_CHECK" = true ]; then
    run_health_check_tests
  fi
fi

# Clean up if requested
if [ "$CLEAN_UP" = true ] && [ "$RUN_HEALTH_CHECK" = false ]; then
  clean_up_regular
fi

echo "All tests completed!" 
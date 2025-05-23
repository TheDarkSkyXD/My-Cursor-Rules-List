# GitHub Actions Failure Analysis Guide

## Required Tools and Authentication
You must verify GitHub CLI setup and use these exact commands:

1. Verify GitHub CLI authentication:
```bash
gh auth status
```

2. If not authenticated or incorrect scope:
```bash
gh auth login --scopes "repo,read:org,workflow"
```

3. Ensure correct repository context:
```bash
gh repo view
```

4. List the most recent failed run:
```bash
gh run list --limit 1 --status failure
```

5. Get the full logs of the failed run:
```bash
gh run view <RUN_ID> --log
```

If any command fails:
- Check the error message carefully
- Verify repository permissions
- Ensure you're in the correct repository
- Try using the `-R owner/repo` flag if needed

## Analysis Process

1. **Get the Failure Context**
   - Verify GitHub CLI authentication and repository access
   - Use the commands above to get the exact failure logs
   - Identify which job and step failed
   - Capture the complete error message and surrounding context
   - Note any relevant environment information (OS, versions, etc.)

2. **Investigate the Codebase**
   - Use semantic search to find relevant files
   - Read any files that might be related to the failure
   - Check recent changes in the affected areas
   - Look for similar patterns in other files

3. **Common Failure Categories**
   - Build Failures: Check package.json, requirements.txt, or other build configs
   - Test Failures: Look at test files and the code they're testing
   - Linting Failures: Check .flake8, .eslintrc, or other linting configs
   - Docker Issues: Check Dockerfile and docker-compose.yml
   - Dependency Issues: Check lock files and version specifications

4. **Required Response Format**
```
## Failure Analysis
- Failed Job: <job_name>
- Failed Step: <step_name>
- Error Message: <exact_error>
- Relevant Files:
  * <file1>: <why_relevant>
  * <file2>: <why_relevant>

## Root Cause
<detailed_explanation>

## Suggested Fix
<fix_description_without_implementation>

## Verification Plan
<how_to_verify_fix_works>
```

## Important Rules
1. NEVER make changes without explicit approval
2. Always get the FULL context before suggesting fixes
3. If unsure about something, ask for clarification
4. Focus on the most recent failure first
5. Consider if the fix might affect other parts of the system
6. Look for patterns that might indicate broader issues

## Common Pitfalls to Check
- GitHub CLI authentication issues
- Repository access and permissions
- Submodule version mismatches
- Environment variable configuration
- Service container health checks
- Test data dependencies
- Python/Node.js version mismatches
- Package version conflicts
- File permission issues
- Resource constraints (memory, disk space)
- Network connectivity issues
- Cache invalidation problems

## Reference Links
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Manual](https://cli.github.com/manual/) 
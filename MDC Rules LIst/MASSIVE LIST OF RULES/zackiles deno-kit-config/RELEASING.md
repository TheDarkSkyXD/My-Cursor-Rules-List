# Release Process

This document outlines the process for releasing new versions of the `@deno-kit/config` package to JSR.

## GitHub Workflows

The project uses two GitHub Actions workflows to automate testing and publishing:

### CI Workflow

The `ci.yml` workflow runs on every push to the `main` branch and on all pull requests targeting `main`. It performs the following checks:

- Verify code formatting
- Lint code
- Type check
- Run tests
- Dry-run JSR publish

This workflow ensures that the codebase is in a good state and can be published to JSR without issues. The workflow uses Deno 2.x via the official `denoland/setup-deno@v2` action.

### Publish Workflow

The `publish-jsr.yml` workflow runs when a new tag is pushed to the repository. It:

1. Verifies that the tag version matches the version in `deno.jsonc`
2. Publishes the package to JSR using the `--no-check` flag (since checks are already run in the CI workflow)

This workflow only executes if the latest commit on the tag has passed the CI workflow. The workflow uses Deno 2.x via the official `denoland/setup-deno@v2` action.

## Release Steps

To release a new version of the package, follow these steps:

1. Update the version in `deno.jsonc`:

   ```bash
   # Example: Update from 0.0.1 to 0.0.2
   # Edit deno.jsonc and change the version field
   ```

2. Update the `CHANGELOG.md` with details about the changes in this release

3. Commit the changes:

   ```bash
   git add deno.jsonc CHANGELOG.md
   git commit -m "chore: release v0.0.2"
   ```

4. Tag the commit with the version number prefixed with 'v':

   ```bash
   git tag v0.0.2
   ```

5. Push the commit and tag to GitHub:

   ```bash
   git push origin main
   git push origin v0.0.2
   ```

6. The GitHub Actions workflows will run automatically:
   - First, the CI workflow will run and verify that everything passes
   - If CI passes, the publish workflow will publish the package to JSR

7. Verify the package is available on JSR at <https://jsr.io/@deno-kit/config>

## JSR Authentication

When publishing to JSR from GitHub Actions, authentication is handled automatically through GitHub's OpenID Connect (OIDC) integration. This means:

1. No need to create or manage JSR tokens
2. No need to add any secrets to your GitHub repository
3. The `id-token: write` permission in the workflow is sufficient for automatic authentication

This built-in authentication ensures secure publishing directly from CI/CD pipelines and verifies that packages are built from the expected source code.

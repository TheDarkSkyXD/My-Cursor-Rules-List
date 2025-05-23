// Command to run this test deno test -A --no-check test/config-plus.test.ts
import { assert, assertEquals, assertExists } from '@std/assert'
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd'
import { join } from '@std/path'
// Import types for the loadConfig function signature
import type { KeyValueConfig } from '../src/lib.ts'

// Module path for dynamic import (DON'T CHANGE THIS)
const configModulePath = '../src/lib.ts'

describe('lib.ts', () => {
  let tempDir: string // Needed for creating temp files
  const originalEnv: Record<string, string> = {}
  let originalArgs: string[] = []
  let originalCwd: string
  let loadConfig: (overrides?: Record<string, KeyValueConfig>) => Promise<Record<string, string>>

  // Backup environment variables and dynamically import the module before each test
  beforeEach(async () => {
    // Store original state
    originalCwd = Deno.cwd()
    originalArgs = [...Deno.args]

    // Backup environment variables we'll modify
    const envKeys = [
      'TEST_API_KEY',
      'TEST_DEBUG',
      'TEST_ENV_VAR',
      'DENO_ENV',
      'TEST_OVERRIDE_TARGET',
      'TEST_KEY_FROM_ENV',
      'TEST_DEBUG_FROM_ENV',
      'FROM_DEFAULT_ENV',
      'FROM_CUSTOM_ENV',
      'FROM_ENV_VAR',
      'FUNC_VALUE',
      'PROMISE_VALUE',
      'ASYNC_FUNC_VALUE',
      'INITIAL_LOAD_VAR',
      'SECOND_LOAD_OVERRIDE',
      'EMPTY_VAR',
      'VAR_TO_DELETE', // Add keys for new tests
    ]
    // Clear the object before populating
    for (const key in originalEnv) {
      delete originalEnv[key]
    }
    for (const key of envKeys) {
      const value = Deno.env.get(key)
      if (value !== undefined) {
        originalEnv[key] = value
      }
      // Clear existing test/default vars to ensure clean state
      Deno.env.delete(key)
    }

    // Create a temporary directory and change into it
    tempDir = await Deno.makeTempDir({ prefix: 'deno-kit-test-config-' })
    Deno.chdir(tempDir)

    // Dynamically import the module to get a fresh instance
    const module = await import(`${configModulePath}?ts=${Date.now()}`)
    loadConfig = module.default
  })

  // Restore environment after tests
  afterEach(async () => { // Added async back for Deno.remove
    // Restore original CWD
    Deno.chdir(originalCwd)

    // Restore original Deno.args
    Object.defineProperty(Deno, 'args', { value: originalArgs, configurable: true })

    // Restore original environment variables
    for (const [key, value] of Object.entries(originalEnv)) {
      Deno.env.set(key, value)
    }

    // Delete any remaining test environment variables
    const testKeys = [
      'TEST_API_KEY',
      'TEST_DEBUG',
      'TEST_ENV_VAR',
      'TEST_RUNTIME_VAR',
      'TEST_OVERRIDE_TARGET',
      'TEST_KEY_FROM_ENV',
      'TEST_DEBUG_FROM_ENV',
      'FROM_DEFAULT_ENV',
      'FROM_CUSTOM_ENV',
      'FROM_ENV_VAR',
      'NEW_VALUE_FROM_OVERRIDE', // Added in overrides test
      'FUNC_VALUE',
      'PROMISE_VALUE',
      'ASYNC_FUNC_VALUE',
      'INITIAL_LOAD_VAR',
      'SECOND_LOAD_OVERRIDE',
      'EMPTY_VAR',
      'VAR_TO_DELETE', // Add keys for new tests
    ]
    for (const key of testKeys) {
      Deno.env.delete(key) // Delete without checking originalEnv
    }

    // Clean up temp directory
    try {
      await Deno.remove(tempDir, { recursive: true })
    } catch (error) {
      console.warn(`[TEST TEARDOWN] Failed to clean up temp directory: ${error}`)
    }
  })

  // Test accessing environment variables
  it('should provide access to environment variables set before load', async () => {
    // Set a test environment variable *before* loading config
    Deno.env.set('TEST_ENV_VAR', 'env-value-direct')

    const config = await loadConfig()
    assertEquals(config.TEST_ENV_VAR, 'env-value-direct')
  })

  // Test setting environment variables through config
  it('should set environment variables when config properties are set after load', async () => {
    const config = await loadConfig()

    // Set value via config proxy *after* loading
    config.TEST_RUNTIME_VAR = 'set-via-proxy'

    // Verify via Deno.env
    assertEquals(Deno.env.get('TEST_RUNTIME_VAR'), 'set-via-proxy')

    // Verify value is accessible back through config
    assertEquals(config.TEST_RUNTIME_VAR, 'set-via-proxy')
  })

  // Test default values
  it('should include default values when no other sources modify them', async () => {
    const config = await loadConfig()

    // Check default value for DENO_ENV
    assertEquals(config.DENO_ENV, 'development')

    // PACKAGE_PATH and workspace should exist and be strings
    assertExists(config.PACKAGE_PATH)
    assert(typeof config.PACKAGE_PATH === 'string', 'PACKAGE_PATH should be a string')
    assertExists(config.workspace)
    assert(typeof config.workspace === 'string', 'workspace should be a string')
    assertEquals(await Deno.realPath(config.workspace), await Deno.realPath(tempDir))
  })

  // Test .env loading and precedence over defaults/env
  it('.env file should override defaults and Deno.env', async () => {
    // Set conflicting env var
    Deno.env.set('DENO_ENV', 'env-var-value')

    const envFilePath = join(Deno.cwd(), '.env')
    const envContent = `
TEST_KEY_FROM_ENV=env-file-value
# This should override both the default and the Deno.env value
DENO_ENV=env-file-dev
`
    await Deno.writeTextFile(envFilePath, envContent)

    try {
      const config = await loadConfig()
      assertEquals(config.TEST_KEY_FROM_ENV, 'env-file-value')
      // Verify .env overrides default and Deno.env
      assertEquals(config.DENO_ENV, 'env-file-dev')
    } finally {
      await Deno.remove(envFilePath)
    }
  })

  // Test custom config file (--config) loading and precedence
  it('--config file should override .env, defaults, and Deno.env', async () => {
    // Set conflicting env var
    Deno.env.set('DENO_ENV', 'env-var-value')
    Deno.env.set('FROM_ENV_VAR', 'true')

    // Create conflicting .env file
    const envFilePath = join(Deno.cwd(), '.env')
    const envContent = `
DENO_ENV=env-file-dev
FROM_DEFAULT_ENV=true
`
    await Deno.writeTextFile(envFilePath, envContent)

    // Create custom config file
    const customConfigPath = join(tempDir, 'custom.conf')
    const customContent = `
DENO_ENV=custom-config-dev # Override .env and default
FROM_CUSTOM_ENV=true
`
    await Deno.writeTextFile(customConfigPath, customContent)

    // Modify Deno.args to use --config
    const originalArgs = [...Deno.args]
    Object.defineProperty(Deno, 'args', {
      value: ['--config', customConfigPath],
      configurable: true,
    })

    try {
      const config = await loadConfig()

      // Verify custom config overrides .env/default
      assertEquals(config.DENO_ENV, 'custom-config-dev')
      // Verify custom config value exists
      assertEquals(config.FROM_CUSTOM_ENV, 'true')
      // Verify .env value still exists (lower priority)
      assertEquals(config.FROM_DEFAULT_ENV, 'true')
      // Verify env var value still exists (lowest priority)
      assertEquals(config.FROM_ENV_VAR, 'true')
    } finally {
      Object.defineProperty(Deno, 'args', { value: originalArgs, configurable: true })
      await Deno.remove(envFilePath)
      await Deno.remove(customConfigPath)
    }
  })

  // Test overrides parameter precedence
  it('overrides parameter should override all other sources', async () => {
    // Set conflicting env var
    Deno.env.set('DENO_ENV', 'env-var-value')
    Deno.env.set('FROM_ENV_VAR', 'true')

    // Create conflicting .env file
    const envFilePath = join(Deno.cwd(), '.env')
    const envContent = `
DENO_ENV=env-file-dev
FROM_DEFAULT_ENV=true
`
    await Deno.writeTextFile(envFilePath, envContent)

    // Create custom config file
    const customConfigPath = join(tempDir, 'custom.conf')
    const customContent = `
DENO_ENV=custom-config-dev
FROM_CUSTOM_ENV=true
`
    await Deno.writeTextFile(customConfigPath, customContent)

    // Modify Deno.args to use --config
    const originalArgs = [...Deno.args]
    Object.defineProperty(Deno, 'args', {
      value: ['--config', customConfigPath],
      configurable: true,
    })

    // Define overrides
    const overrides = {
      DENO_ENV: 'override-dev', // Should be final value
      NEW_VALUE_FROM_OVERRIDE: 'new-override',
    }

    try {
      const config = await loadConfig(overrides)

      // Verify override has highest precedence
      assertEquals(config.DENO_ENV, 'override-dev')
      // Verify override-specific value exists
      assertEquals(config.NEW_VALUE_FROM_OVERRIDE, 'new-override')
      // Verify values from lower sources still exist
      assertEquals(config.FROM_CUSTOM_ENV, 'true')
      assertEquals(config.FROM_DEFAULT_ENV, 'true')
      assertEquals(config.FROM_ENV_VAR, 'true')
    } finally {
      Object.defineProperty(Deno, 'args', { value: originalArgs, configurable: true })
      await Deno.remove(envFilePath)
      await Deno.remove(customConfigPath)
    }
  })

  // Test dynamic value resolution in overrides
  it('should resolve function and promise values in overrides', async () => {
    const functionValue = () => 'resolved-function'
    const promiseValue = Promise.resolve('resolved-promise')
    const asyncFunctionValue = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10)) // Simulate async work
      return 'resolved-async-function'
    }

    const overrides = {
      FUNC_VALUE: functionValue,
      PROMISE_VALUE: promiseValue,
      ASYNC_FUNC_VALUE: asyncFunctionValue,
    }

    const config = await loadConfig(overrides)

    assertEquals(config.FUNC_VALUE, 'resolved-function')
    assertEquals(config.PROMISE_VALUE, 'resolved-promise')
    assertEquals(config.ASYNC_FUNC_VALUE, 'resolved-async-function')
  })

  // Test non-existent --config file (should warn, not error)
  it('should handle non-existent --config file gracefully (warn)', async () => {
    const nonExistentPath = join(tempDir, 'non-existent.config')

    // Modify Deno.args to use non-existent --config
    const originalArgs = [...Deno.args]
    Object.defineProperty(Deno, 'args', {
      value: ['--config', nonExistentPath],
      configurable: true,
    })

    try {
      // Load config - should not throw an error
      const config = await loadConfig()

      // Basic check that config is still created and has defaults
      assertExists(config)
      assertEquals(config.DENO_ENV, 'development')
      console.log('[Non-existent Config Test] Successfully loaded config despite missing file.')
    } finally {
      Object.defineProperty(Deno, 'args', { value: originalArgs, configurable: true })
    }
    // Note: We can't easily assert the warning was logged without capturing stderr.
  })

  // Test --workspace argument
  it('should use --workspace argument to set workspace path', async () => {
    const customWorkspacePath = join(tempDir, 'custom_workspace_dir')
    // No need to create the directory, just check the path

    // Modify Deno.args to use --workspace
    const originalArgs = [...Deno.args]
    Object.defineProperty(Deno, 'args', {
      value: ['--workspace', customWorkspacePath],
      configurable: true,
    })

    try {
      const config = await loadConfig()

      // Verify the workspace property matches the argument
      assertEquals(config.workspace, customWorkspacePath)
    } finally {
      Object.defineProperty(Deno, 'args', { value: originalArgs, configurable: true })
    }
  })

  // Test subsequent loadConfig calls and overrides
  it('should handle subsequent loadConfig calls with overrides', async () => {
    // Initial load with some value
    const config1 = await loadConfig({ INITIAL_LOAD_VAR: 'first' })
    assertEquals(config1.INITIAL_LOAD_VAR, 'first')

    // Second load with an override
    const config2 = await loadConfig({ SECOND_LOAD_OVERRIDE: 'second' })

    // Check if the second override exists
    assertEquals(config2.SECOND_LOAD_OVERRIDE, 'second')

    // Check if the initial value still exists (it should, on the same object)
    assertEquals(config2.INITIAL_LOAD_VAR, 'first')

    // Verify config1 and config2 reference the same proxy object
    config1.NEW_PROP = 'added_later'
    assertEquals(config2.NEW_PROP, 'added_later')

    // Ensure Deno.env reflects the changes from both calls
    assertEquals(Deno.env.get('INITIAL_LOAD_VAR'), 'first')
    assertEquals(Deno.env.get('SECOND_LOAD_OVERRIDE'), 'second')
    assertEquals(Deno.env.get('NEW_PROP'), 'added_later')
  })

  // Test handling of empty values in .env file
  it('should treat empty values in .env file as undefined', async () => {
    const envFilePath = join(Deno.cwd(), '.env')
    // Module should now ignore empty values
    const envContent = `
VALID_VAR=somevalue
EMPTY_VAR=
VAR_WITH_SPACE=
# VAR_WITH_COMMENT = # Comment
`
    await Deno.writeTextFile(envFilePath, envContent)

    try {
      const config = await loadConfig()
      assertEquals(config.VALID_VAR, 'somevalue')
      // Check if EMPTY_VAR is treated as undefined
      assertEquals(config.EMPTY_VAR, undefined)
      assertEquals(Deno.env.get('EMPTY_VAR'), undefined)
      // Check if VAR_WITH_SPACE (containing only space) is also treated as undefined
      assertEquals(config.VAR_WITH_SPACE, undefined)
      assertEquals(Deno.env.get('VAR_WITH_SPACE'), undefined)
      // Check commented var is undefined
      // assertEquals(config.VAR_WITH_COMMENT, undefined)
    } finally {
      await Deno.remove(envFilePath)
    }
  })

  // Test proxy deleteProperty trap
  it('should delete properties from config and Deno.env via proxy', async () => {
    // Load config with a value to delete
    const config = await loadConfig({ VAR_TO_DELETE: 'delete-me' })
    assertEquals(config.VAR_TO_DELETE, 'delete-me')
    assertEquals(Deno.env.get('VAR_TO_DELETE'), 'delete-me')

    // Delete the property using the delete operator on the proxy
    // biome-ignore lint/performance/noDelete: needed for testing
    const deleteResult = delete config.VAR_TO_DELETE

    // Verify delete was successful
    assert(deleteResult, 'Delete operation should return true')
    assertEquals(config.VAR_TO_DELETE, undefined)
    assertEquals(Deno.env.get('VAR_TO_DELETE'), undefined)
  })
})

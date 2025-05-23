# **Scripts Directory**

## **Purpose**

The `scripts/` directory is used to store general purpose, self-contained, executable scripts written in Typescript or Javascript.

## **Rules For Scripts In This Directory**

- **MUST** be a Deno Typescript or Javascript script.
- **MUST** contain a valid hash-bang at the top of the script.
- **MUST** be able to be lint checked, formatted, published, and or compiled by `deno lint`, `deno check`, `deno fmt`, `deno publish`, and `deno compile`.
- **MUST NOT** have exports that are imported by any files in config.
- **MAY** be executed by other files in config but ONLY through a shell command OR by using `Deno.command`.
- **MAY** import other files from config if needed, but those files MUST NOT import the script.
- **MAY** be tested with a test file in `test/` but only accessed through shell commands.

> [!NOTE]\
> Javascript and Typescript files that need to support being run as scripts in a shell AND be imported as libraries should be placed in `src/` instead. This directory is only for true scripts.

> [!NOTE]\
> Use the `bin/` directory instead for: files that don't meet these rules, natively-compiled code created using Deno.compile, compiled release builds of config, or vendored files that you don't want modified.

## **How Files In this Directory are Used**

- General purpose scripts for tasks such as: CI/CD, testing, or one-off purposes that don't make sense to be a part of the main source code but which benefit from the Deno tooling.
- Called from config source files using Deno.command(), but never imported.
- Deno linting and formatting will be applied according to `deno.jsonc`
- Deno compiling (if used) and publishing (if used) will use the files in this directory according to `deno.jsonc`.

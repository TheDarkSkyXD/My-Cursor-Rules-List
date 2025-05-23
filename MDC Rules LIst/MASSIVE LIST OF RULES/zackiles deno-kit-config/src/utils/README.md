# **Utils Directory**

## **Purpose**

The `src/utils` directory is used to store utility files that are shared across the project and codebase.

## **Rules For Scripts In This Directory**

- **SHOULD** try to keep 1 export per utility file.
- **MUST** provide descriptive names for all utility files.
- **MUST** only contain ESM modules that can be imported.
- **MUST** contain exported methods.
- **MUST NOT** contain CLIs or modules meant to be used with stdio.
- **MUST NOT** directly access env variables or command line flags with Deno.Args or Deno.env. Instead,calling files outside of the `src/utils/` directory should create Javascript objects of those env variables or command line flags and pass them as arguments to any modules in this `src/utils/` directory.
- **MUST** contain JSDoc comments for the module at the top of any file in this `src/utils/` directory.
- **SHOULD** contain code that is abstracted and general-purpose so that it avoids logic or functionality that is highly specific or tightly-coupled to the project and codebase itself. This can be achieved through more general naming conventions, focusing on high-order and multi-purpose functionality, and focusing code on flexible design and access patterns that allows extending or reusing the utility library outside of this codebase if needed in the future.

> [!NOTE]\
> For general purpose, self-contained, executable scripts meant to be accessed through the shell and stdio, and which are written in Typescript or Javascript consider using the`scripts/` directory instead.

## **How Files In this Directory are Used**

- Single-purpose utility files that can be shared across the project and codebase.
- Perfect for files and code that may one day be moved to its own JSR or NPM library using only the utility file. This means the utility file is mostly self-contained and general purpose enough to use in other codebases or to publish as its own library.
- Avoids many external dependencies when possible.
- Avoids the use of Typescript types unless they're declared locally in the file and not outside of the file or `utils/` directory.
- Avoids importing or referencing other utility files in the `utils/` directory when possible.

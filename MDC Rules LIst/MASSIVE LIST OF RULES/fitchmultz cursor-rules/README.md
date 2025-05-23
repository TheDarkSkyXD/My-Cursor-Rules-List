# Cursor Rules Git Submodule Setup Guide

**Version: 1.0.1**
**Date: March 25, 2025**
**Author: Mitch Fultz**

This guide explains how to use Git submodules to sync Cursor rules across multiple projects, ensuring consistent AI assistance with Next.js 15, React 19, and Tailwind CSS v4.

## What Are Git Submodules?

Git submodules allow you to include a Git repository as a subdirectory within another Git repository. This is perfect for sharing Cursor rules across projects while maintaining a single source of truth.

## Creating a Cursor Rules Repository

First, create a dedicated repository for your Cursor rules:

```bash
# 1. Create a new directory for your rules
mkdir cursor-rules
cd cursor-rules

# 2. Initialize a Git repository
git init

# 3. Create the .cursor/rules directory structure
mkdir -p .cursor/rules

# 4. Copy your MDC rule files to this directory
cp path/to/tailwind_v4.mdc .cursor/rules/
cp path/to/nextjs_15.mdc .cursor/rules/
cp path/to/react_19.mdc .cursor/rules/

# 5. Add and commit the files
git add .
git commit -m "Initial commit of Cursor rules"

# 6. Create a GitHub repository and push
git remote add origin https://github.com/fitchmultz/cursor-rules.git
git push -u origin main
```

## Adding the Submodule to Your Projects

For each project where you want to use these rules:

```bash
# 1. Navigate to your project root
cd your-project

# 2. Add the rules repository as a submodule in the .cursor directory
git submodule add https://github.com/fitchmultz/cursor-rules.git .cursor

# 3. Initialize and update the submodule
git submodule update --init

# 4. Commit the changes to your project
git add .gitmodules .cursor
git commit -m "Add Cursor rules as submodule"
```

## Updating Rules Across Projects

When you update your rules in the central repository:

```bash
# In your rules repository
cd cursor-rules
# Make your changes
vi .cursor/rules/tailwind_v4.mdc
# Commit and push
git add .
git commit -m "Update Tailwind rules"
git push
```

To update the rules in your projects:

```bash
# In each project
cd your-project
# Update the submodule to the latest commit
git submodule update --remote .cursor
# Commit the update
git add .cursor
git commit -m "Update Cursor rules"
```

## Cloning Projects with Submodules

When someone clones your project, they need to initialize the submodules:

```bash
# Clone the repository with submodules
git clone https://github.com/fitchmultz/your-project.git
cd your-project

# Initialize and update submodules
git submodule update --init
```

Alternatively, clone with submodules in one command:

```bash
git clone --recurse-submodules https://github.com/fitchmultz/your-project.git
```

## Troubleshooting

If you encounter issues with your submodules:

1. **Empty .cursor directory**: Run `git submodule update --init`
2. **Detached HEAD in submodule**: This is normal; submodules point to specific commits
3. **Changes not visible**: Make sure you committed and pushed changes in both repositories
4. **Permissions issues**: Ensure you have proper GitHub access and SSH keys configured
5. **Circular dependencies**: Avoid creating circular dependencies between repositories

## Alternatives: Cursor Directory

If Git submodules seem too complex, consider using [Cursor Directory](https://cursor.directory/generate), an online tool for generating Cursor rules:

1. Visit [https://cursor.directory/generate](https://cursor.directory/generate)
2. Upload your project files (package.json, etc.)
3. Download the generated MDC files
4. Place them in your `.cursor/rules/` directory

This can be a simpler alternative if you don't need version control for your rules.

## Additional Considerations

### Potential Blind Spots to Address

1. **Project-Specific Rule Overrides**:

   - You may need project-specific rule modifications
   - Create local override files in the project's own `.cursor/local-rules/` directory
   - Name them with clear priorities, e.g., `900-project-overrides.mdc`

2. **Rule Conflict Resolution**:

   - When rule files conflict, Cursor typically uses the last loaded rule
   - Use a numbering prefix system for loading order (e.g., `100-tailwind.mdc`, `200-nextjs.mdc`)
   - Document conflicts and resolutions in a central README

3. **Automating Multi-Project Updates**:
   - For managing many projects, create a shell script:

```bash
#!/bin/bash
# update-cursor-rules.sh

# List of project directories
PROJECTS=(
  "/path/to/project1"
  "/path/to/project2"
  "/path/to/project3"
)

# Update rules in each project
for project in "${PROJECTS[@]}"; do
  echo "Updating rules in $project"
  cd "$project"
  git submodule update --remote .cursor
  git add .cursor
  git commit -m "Update Cursor rules"
  git push
done

echo "All projects updated!"
```

4. **Rule Testing Process**:

   - Test new rules in an isolated test project before pushing to the main rules repository
   - Create a changelog that documents rule changes and potential impacts
   - Consider using semantic versioning (MAJOR.MINOR.PATCH) for rule updates

5. **Cursor Version Compatibility**:
   - Different Cursor versions may handle rules differently
   - Include a minimum required Cursor version in rule files
   - Test rules with the Cursor versions used by your team

## Best Practices

1. **Keep your rules modular**: Separate rules by technology/framework
2. **Version your rules**: Include version numbers in each MDC file
3. **Document changes**: Keep a changelog in your rules repository
4. **Regular updates**: Schedule periodic reviews of your rules

## Example Repository Structure

```
cursor-rules/
├── .cursor/
│   └── rules/
│       ├── tailwind_v4.mdc  # v1.0.0
│       ├── nextjs_15.mdc    # v1.0.0
│       ├── react_19.mdc     # v1.0.0
│       └── README.md        # Documentation
└── README.md                # Repository overview
```

By following this guide, you'll have a centralized, version-controlled system for Cursor rules that can be easily shared and updated across all your projects.

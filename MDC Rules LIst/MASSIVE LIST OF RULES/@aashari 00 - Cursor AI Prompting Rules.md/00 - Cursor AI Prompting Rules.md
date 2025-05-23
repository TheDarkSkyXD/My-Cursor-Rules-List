# Cursor AI Prompting Framework Usage Guide

This guide explains how to use the structured prompting files (`core.md`, `refresh.md`, `request.md`) to optimize your interactions with Cursor AI, leading to more reliable, safe, and effective coding assistance.

## Core Components

1.  **`core.md` (Foundational Rules)**
    *   **Purpose:** Establishes the fundamental operating principles, safety protocols, tool usage guidelines, and validation requirements for Cursor AI. It ensures consistent and cautious behavior across all interactions.
    *   **Usage:** This file's content should be **persistently active** during your Cursor sessions.

2.  **`refresh.md` (Diagnose & Resolve Persistent Issues)**
    *   **Purpose:** A specialized prompt template used when a previous attempt to fix a bug or issue failed, or when a problem is recurring. It guides the AI through a rigorous diagnostic and resolution process.
    *   **Usage:** Used **situationally** by pasting its modified content into the Cursor AI chat.

3.  **`request.md` (Implement Features/Modifications)**
    *   **Purpose:** A specialized prompt template used when asking the AI to implement a new feature, refactor code, or make specific modifications. It guides the AI through planning, validation, implementation, and verification steps.
    *   **Usage:** Used **situationally** by pasting its modified content into the Cursor AI chat.

## How to Use

### 1. Setting Up `core.md` (Persistent Rules)

The rules in `core.md` need to be loaded by Cursor AI so they apply to all your interactions. You have two main options:

**Option A: `.cursorrules` File (Recommended for Project-Specific Rules)**

1.  Create a file named `.cursorrules` in the **root directory** of your workspace/project.
2.  Copy the **entire content** of the `core.md` file.
3.  Paste the copied content into the `.cursorrules` file.
4.  Save the `.cursorrules` file.
    *   *Note:* Cursor will automatically detect and use these rules for interactions within this specific workspace. Project rules typically override global User Rules.

**Option B: User Rules Setting (Global Rules)**

1.  Open the Command Palette in Cursor AI: `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows/Linux).
2.  Type `Cursor Settings: Configure User Rules` and select it.
3.  This will open your global rules configuration interface.
4.  Copy the **entire content** of the `core.md` file.
5.  Paste the copied content into the User Rules configuration area.
6.  Save the settings.
    - _Note:_ These rules will now apply globally to all your projects opened in Cursor, unless overridden by a project-specific `.cursorrules` file.

### 2. Using `refresh.md` (When Something is Still Broken)

Use this template when you need the AI to re-diagnose and fix an issue that wasn't resolved previously.

1.  **Copy:** Select and copy the **entire content** of the `refresh.md` file.
2.  **Modify:** Locate the first line: `User Query: {my query}`.
3.  **Replace Placeholder:** Replace the placeholder `{my query}` with a *specific and concise description* of the problem you are still facing.
    *   *Example:* `User Query: the login API call still returns a 403 error after applying the header changes`
4.  **Paste:** Paste the **entire modified content** (with your specific query) directly into the Cursor AI chat input field and send it.

### 3. Using `request.md` (For New Features or Changes)

Use this template when you want the AI to implement a new feature, refactor existing code, or perform a specific modification task.

1.  **Copy:** Select and copy the **entire content** of the `request.md` file.
2.  **Modify:** Locate the first line: `User Request: {my request}`.
3.  **Replace Placeholder:** Replace the placeholder `{my request}` with a *clear and specific description* of the task you want the AI to perform.
    *   *Example:* `User Request: Add a confirmation modal before deleting an item from the list`
    *   *Example:* `User Request: Refactor the data fetching logic in `UserProfile.js` to use the new `useQuery` hook`
4.  **Paste:** Paste the **entire modified content** (with your specific request) directly into the Cursor AI chat input field and send it.

## Best Practices

*   **Accurate Placeholders:** Ensure you replace `{my query}` and `{my request}` accurately and specifically in the `refresh.md` and `request.md` templates before pasting them.
*   **Foundation:** Remember that the rules defined in `core.md` (via `.cursorrules` or User Settings) underpin *all* interactions, including those initiated using the `refresh.md` and `request.md` templates.
*   **Understand the Rules:** Familiarize yourself with the principles in `core.md` to better understand how the AI is expected to behave and why it might ask for confirmation or perform certain validation steps.

By using these structured prompts, you can guide Cursor AI more effectively, leading to more predictable, safe, and productive development sessions.
# Contributing to Cursor Rules Collection

Thank you for your interest in contributing to the Cursor Rules Collection! This document provides guidelines for contributing new rules or improvements to existing ones.

## How to Contribute

### Suggesting Improvements

If you have suggestions for improving existing rules:

1. Open an issue describing your suggestion
2. Explain the rationale behind the change
3. If applicable, provide examples of how the improved rule would work

### Contributing New Rules

If you'd like to contribute a new rule:

1. Fork the repository
2. Create a new branch for your rule
3. Create your rule file following the structure in `rul3s.mdc`
4. Submit a pull request with a clear description of your new rule

### Rule File Structure

All rule files should follow this structure:

```
---
description: Brief description of what the rule covers
globs: [optional file patterns where this rule applies]
alwaysApply: true/false (whether to apply this rule to all conversations)
---

# Rule Title

## Context (Optional)
Brief explanation of when and why this rule is useful.

## Guidelines
Specific guidelines to follow when this rule applies:

1. Guideline one
2. Guideline two
3. ...and so on
```

### Guidelines for Good Rules

- Make guidelines specific and actionable
- Focus on practical advice rather than theory
- Include examples where helpful
- Keep guidelines concise (1-2 sentences each)
- Ensure guidelines are mutually supportive
- Consider both immediate and long-term implications

## Getting Help

If you need assistance with creating a rule or have questions about the contribution process:

- Your AI will know how to do it, just ask for help. "Can you walk through creating a new file for *cursor\rules folder and will you make a new rule like “team-notes.md” for team members and use a detailed outline that explains after every change we have to update the team-notes.md ... and before every edit team must check the notes again, this will help with cold starts, quick starts and documenting project structure, dependencies etc. be concise make sure the team analyzes structure, dependencies, conflicts and works cohesively during development 



## Code of Conduct

- Be respectful and constructive in all interactions
- Focus on the content of contributions, not the contributor
- Help create a positive and inclusive community

Thank you for helping improve the Cursor Rules Collection! 
# VibeShip Rules for Better Vibe Coding

**Predefined Cursor rules** to help you get the most out of **AI-assisted development**. These rules were heavily inspired by [@aashari's](https://github.com/aashari) [Cursor AI Prompting Rules](https://gist.github.com/aashari/07cc9c1b6c0debbeb4f4d94a3a81339e). They were created as part of my vibe coding boilerplate project, [vibeship-boilerplate](https://github.com/jjcall/vibeship-boilerplate), but they work just as well for general AI-assisted development.

## Available Cursor Rule Files

- `.cursor/rules/always-on.mdc`  
  Persistent base rules applied to all AI actions. Defines project structure, style, and behavior.

- `.cursor/rules/request.mdc`  
  Use when asking AI to build new features, refactor code, or make specific improvements.

- `.cursor/rules/diagnose.mdc`  
  Use when asking AI to re-examine or resolve issues that weren’t fully fixed previously.

## How to Use

1. **Open** a Cursor project.
2. **Add rules** to `.cursor/rules/`
3. **Pick the Right Rule for Your Intent When Prompting:**
   - **General AI Help**: No action needed — `always-on.mdc` applies automatically.
   - **Building a new feature or Refactoring**: Add `@request` to your prompt to guide AI behavior.
   - **Dealing with a stubborn bug or Diagnosis**: Add `@diagnose` to your prompt to have AI re-analyze and resolve issues.
4. **Continue interacting with Cursor as usual.**  
   The applied rule context helps Cursor generate **more relevant and consistent results** based on your project’s standards.

## Why This Matters

By using these pre-written rules, you ensure that:
- AI follows your **project structure and coding conventions**.
- AI applies **consistent problem-solving methods**.
- You get **higher quality, more reliable** AI-powered suggestions.

These rules make AI feel more like a **pair programming partner who actually understands your project**.
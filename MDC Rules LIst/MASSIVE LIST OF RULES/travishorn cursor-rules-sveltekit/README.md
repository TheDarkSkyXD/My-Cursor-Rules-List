# Cursor Rules for SvelteKit Development

Cursor, the AI-first code editor, significantly speeds up my development workflow, especially when working with modern web frameworks. However, like many AI models, its training data lags slightly behind the latest releases of frameworks like Svelte, SvelteKit, and Tailwind CSS. This can sometimes lead to the AI suggesting code based on older patterns, potentially causing compatibility issues or preventing me from leveraging the newest features.

Thankfully, Cursor provides a powerful "Rules" feature that can be used to address this scenario. By defining specific rules within your project, you can guide Cursor's AI agents, instructing them to adhere to the standards, syntax, and best practices of the exact versions you're using.

In this post, I'll walk you through how I set up custom Cursor rules in my SvelteKit projects to ensure better compatibility and code generation for Svelte 5, SvelteKit 2, and Tailwind CSS 4 (current versions as of this writing). This simple setup helps keep the AI suggestions relevant.

First, create a `.cursor/rules directory` in your project root. Then, add these three specific Markdown Configuration (.mdc) files.

| Filename                           | Rule Type   | File pattern matches |
|------------------------------------|-------------|----------------------|
| `.cursor/rules/svelte-5.mdc`       | Auto Attach | `*.svelte` `*.ts`    |
| `.cursor/rules/sveltekit-2.mdc`    | Auto Attach | `*.svelte` `*.ts`    |
| `.cursor/rules/tailwind-css-4.mdc` | Auto Attach | `*.svelte` `*.css`   |

Each of these files can be found in this repository.

With the rule files placed within your `.cursor/rules` directory in your project root, you've instructed Cursor's AI agents to prioritize the syntax, APIs, and conventions of the latest versions you're working with.

This significantly improves the quality and relevance of AI-generated code suggestions and edits. It reduces the friction of having to manually correct outdated patterns and helps ensure your project leverages the modern best practices defined by Svelte 5, SvelteKit 2, and Tailwind CSS 4.

Don't be afraid to adapt these examples to match your coding style or project requirements. You can modify the file patterns or the instructional content within the .mdc files to suit other libraries, different versions, or specific coding standards used by your team. Leveraging Cursor's rules is a fantastic way to fine-tune the AI to your precise development context, making an already powerful tool even more effective.

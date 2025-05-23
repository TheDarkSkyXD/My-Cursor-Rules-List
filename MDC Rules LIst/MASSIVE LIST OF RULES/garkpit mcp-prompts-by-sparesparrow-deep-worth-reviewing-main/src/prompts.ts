import { z } from "zod";

// Define prompt argument schemas
const createPromptArgsSchema = z.object({
  name: z.string().describe("Name of the prompt"),
  description: z.string().optional().describe("Description of what the prompt does"),
  content: z.string().describe("The actual prompt content/template"),
  isTemplate: z.boolean().optional().default(false).describe("Whether this is a template prompt"),
  variables: z.array(z.string()).optional().describe("Variables that can be used in the template"),
  tags: z.array(z.string()).optional().describe("Tags to categorize the prompt"),
  category: z.string().optional().describe("Primary category for the prompt"),
  metadata: z.record(z.any()).optional().describe("Additional metadata for the prompt")
});

const updatePromptArgsSchema = createPromptArgsSchema.partial().extend({
  id: z.string().describe("ID of the prompt to update")
});

const deletePromptArgsSchema = z.object({
  id: z.string().describe("ID of the prompt to delete")
});

const listPromptsArgsSchema = z.object({
  category: z.string().optional().describe("Filter prompts by category"),
  tag: z.string().optional().describe("Filter prompts by tag"),
  isTemplate: z.boolean().optional().describe("Filter for template/non-template prompts")
});

// Export schemas for use in server registration
export const promptSchemas = {
  create: createPromptArgsSchema,
  update: updatePromptArgsSchema,
  delete: deletePromptArgsSchema,
  list: listPromptsArgsSchema
};

// Export types derived from schemas
export type CreatePromptArgs = z.infer<typeof createPromptArgsSchema>;
export type UpdatePromptArgs = z.infer<typeof updatePromptArgsSchema>;
export type DeletePromptArgs = z.infer<typeof deletePromptArgsSchema>;
export type ListPromptsArgs = z.infer<typeof listPromptsArgsSchema>;

// Define some example prompts
export const defaultPrompts = {
  "code-review": {
    name: "code-review",
    description: "Review code changes and provide feedback",
    content: "Please review the following code changes:\n\n{{code}}\n\nProvide feedback on:\n1. Code quality\n2. Potential bugs\n3. Performance considerations\n4. Security implications\n5. Suggested improvements",
    isTemplate: true,
    variables: ["code"],
    tags: ["development", "review"],
    category: "development"
  },
  "bug-report": {
    name: "bug-report",
    description: "Generate a detailed bug report",
    content: "Issue Type: Bug\n\nDescription:\n{{description}}\n\nSteps to Reproduce:\n{{steps}}\n\nExpected Behavior:\n{{expected}}\n\nActual Behavior:\n{{actual}}\n\nEnvironment:\n{{environment}}",
    isTemplate: true,
    variables: ["description", "steps", "expected", "actual", "environment"],
    tags: ["development", "issues"],
    category: "development"
  }
}; 
/**
 * Prompt Service
 * Centralizes management of all prompt-related operations
 */

import type { StorageAdapter } from './interfaces.js';
import { Prompt } from './interfaces.js';
import { CreatePromptArgs, UpdatePromptArgs, ListPromptsArgs, defaultPrompts } from './prompts.js';

export class PromptService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async initialize() {
    await this.storage.connect();
    
    // Load default prompts if storage is empty
    const existingPrompts = await this.listPrompts({});
    if (existingPrompts.length === 0) {
      await Promise.all(
        Object.values(defaultPrompts).map(prompt => 
          this.createPrompt(prompt as CreatePromptArgs)
        )
      );
    }
  }

  async createPrompt(args: CreatePromptArgs): Promise<Prompt> {
    const prompt: Prompt = {
      id: args.name.toLowerCase().replace(/\s+/g, '-'),
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    return this.storage.savePrompt(prompt);
  }

  async updatePrompt(id: string, args: Partial<UpdatePromptArgs>): Promise<Prompt> {
    const existing = await this.storage.getPrompt(id);
    if (!existing) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated: Prompt = {
      ...existing,
      ...args,
      id, // Preserve original ID
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1
    };

    return this.storage.updatePrompt(id, updated);
  }

  async deletePrompt(id: string): Promise<void> {
    return this.storage.deletePrompt(id);
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    return this.storage.getPrompt(id);
  }

  async listPrompts(args: ListPromptsArgs): Promise<Prompt[]> {
    const prompts = await this.storage.listPrompts();
    
    return prompts.filter(prompt => {
      if (args.category && prompt.category !== args.category) {
        return false;
      }
      if (args.tag && !prompt.tags?.includes(args.tag)) {
        return false;
      }
      if (args.isTemplate !== undefined && prompt.isTemplate !== args.isTemplate) {
        return false;
      }
      return true;
    });
  }

  async applyTemplate(id: string, variables: Record<string, string>): Promise<string> {
    const prompt = await this.getPrompt(id);
    if (!prompt) {
      throw new Error(`Template prompt not found: ${id}`);
    }
    if (!prompt.isTemplate) {
      throw new Error(`Prompt is not a template: ${id}`);
    }

    let content = prompt.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Check for any remaining template variables
    const remaining = content.match(/{{[^}]+}}/g);
    if (remaining) {
      throw new Error(`Missing template variables: ${remaining.join(', ')}`);
    }

    return content;
  }

  /**
   * Format a prompt according to the MCP prompts/get protocol
   * @param prompt The prompt to format
   * @param variables Optional variables to apply for templates
   * @returns Formatted prompt for MCP protocol
   */
  formatMcpPrompt(prompt: Prompt, variables?: Record<string, string>): {
    description: string;
    messages: Array<{
      role: string;
      content: {
        type: string;
        text: string;
      };
    }>;
  } {
    // Apply template variables if provided and this is a template
    let content = prompt.content;
    if (prompt.isTemplate && variables) {
      content = this.processTemplate(content, variables);
    }
    
    return {
      description: prompt.description || '',
      messages: [
        {
          role: 'system',
          content: {
            type: 'text',
            text: content
          }
        }
      ]
    };
  }

  /**
   * Format a list of prompts according to the MCP prompts/list protocol
   * @param prompts Array of prompts to format
   * @returns Formatted prompts list for MCP protocol
   */
  formatMcpPromptsList(prompts: Prompt[]): {
    prompts: Array<{
      name: string;
      description: string;
      arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
      }>;
    }>;
  } {
    return {
      prompts: prompts.map(prompt => {
        // For template prompts, extract variables information
        const args = prompt.isTemplate && prompt.variables?.length
          ? prompt.variables.map((variable: any) => {
              // Handle both string variables and complex variable objects
              if (typeof variable === 'string') {
                return { name: variable };
              } else {
                return {
                  name: variable.name,
                  description: variable.description,
                  required: variable.required
                };
              }
            })
          : undefined;
          
        return {
          name: prompt.id,
          description: prompt.description || '',
          ...(args && { arguments: args })
        };
      })
    };
  }

  /**
   * Process a template string by replacing variables
   * @param template Template string
   * @param variables Variables to replace
   * @returns Processed string
   */
  private processTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
} 
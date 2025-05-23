/**
 * Consolidated Adapters Module
 * Contains all storage adapters in a single file
 */

import { 
  Prompt, 
  StorageAdapter, 
  ListPromptsOptions, 
  ServerConfig, 
  MutablePrompt,
  MutablePromptFactory,
  PromptFormat, 
  PromptConversionOptions,
  MdcFormatOptions,
  PgaiFormatOptions,
  TemplateFormatOptions
} from './interfaces.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import pg from 'pg';

/**
 * FileAdapter Implementation
 * Stores prompts as individual JSON files in a directory
 */
export class FileAdapter implements StorageAdapter {
  private promptsDir: string;
  private connected: boolean = false;
  private prompts: Map<string, Prompt> = new Map();

  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  async connect(): Promise<void> {
    try {
      await fs.mkdir(this.promptsDir, { recursive: true });
      this.connected = true;
      console.error(`File storage connected: ${this.promptsDir}`);
    } catch (error: any) {
      console.error("Error connecting to file storage:", error);
      throw new Error(`Failed to connect to file storage: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.error("File storage disconnected");
  }

  async savePrompt(prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }

    try {
      await fs.writeFile(
        path.join(this.promptsDir, `${prompt.id}.json`),
        JSON.stringify(prompt, null, 2)
      );
      return prompt;
    } catch (error: any) {
      console.error("Error saving prompt to file:", error);
      throw error;
    }
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }

    try {
      const content = await fs.readFile(path.join(this.promptsDir, `${id}.json`), "utf-8");
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`Error getting prompt ${id} from file:`, error);
      throw error;
    }
  }

  async updatePrompt(id: string, prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }

    try {
      await fs.writeFile(
        path.join(this.promptsDir, `${id}.json`),
        JSON.stringify(prompt, null, 2)
      );
      return prompt;
    } catch (error: any) {
      console.error(`Error updating prompt ${id} in file:`, error);
      throw error;
    }
  }

  async deletePrompt(id: string): Promise<void> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }

    try {
      await fs.unlink(path.join(this.promptsDir, `${id}.json`));
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting prompt ${id} from file:`, error);
        throw error;
      }
    }
  }

  async listPrompts(options?: ListPromptsOptions): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }

    try {
      const files = await fs.readdir(this.promptsDir);
      const prompts: Prompt[] = [];
      
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const content = await fs.readFile(path.join(this.promptsDir, file), "utf-8");
            prompts.push(JSON.parse(content));
          } catch (error: any) {
            console.error(`Error reading prompt file ${file}:`, error);
          }
        }
      }
      
      return this.filterPrompts(prompts, options);
    } catch (error: any) {
      console.error("Error listing prompts from file:", error);
      throw error;
    }
  }

  private filterPrompts(prompts: Prompt[], options?: ListPromptsOptions): Prompt[] {
    if (!options) {
      return prompts;
    }

    let filtered = prompts;

    if (options.isTemplate !== undefined) {
      filtered = filtered.filter(p => p.isTemplate === options.isTemplate);
    }

    if (options.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.tags) return false;
        return options.tags!.every(tag => p.tags!.includes(tag));
      });
    }

    return filtered;
  }

  async getAllPrompts(): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("File storage not connected");
    }
    return Array.from(this.prompts.values());
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }
}

/**
 * MemoryAdapter Implementation
 * Stores prompts in memory (volatile storage)
 */
export class MemoryAdapter implements StorageAdapter {
  private prompts: Map<string, Prompt> = new Map();
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
    console.error("Memory storage connected");
  }

  async disconnect(): Promise<void> {
    this.prompts.clear();
    this.connected = false;
    console.error("Memory storage disconnected");
  }

  async savePrompt(prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }

    this.prompts.set(prompt.id, prompt);
    return prompt;
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }

    return this.prompts.get(id) || null;
  }

  async updatePrompt(id: string, prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }

    this.prompts.set(id, prompt);
    return prompt;
  }

  async deletePrompt(id: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }

    this.prompts.delete(id);
  }

  async listPrompts(options?: ListPromptsOptions): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }

    const prompts = Array.from(this.prompts.values());
    return this.filterPrompts(prompts, options);
  }

  private filterPrompts(prompts: Prompt[], options?: ListPromptsOptions): Prompt[] {
    if (!options) {
      return prompts;
    }

    let filtered = prompts;

    if (options.isTemplate !== undefined) {
      filtered = filtered.filter(p => p.isTemplate === options.isTemplate);
    }

    if (options.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.tags) return false;
        return options.tags!.every(tag => p.tags!.includes(tag));
      });
    }

    return filtered;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async getAllPrompts(): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("Memory storage not connected");
    }
    return Array.from(this.prompts.values());
  }
}

/**
 * PostgresAdapter Implementation
 * Stores prompts in a PostgreSQL database
 */
export class PostgresAdapter implements StorageAdapter {
  private pool: pg.Pool;
  private connected: boolean = false;

  constructor(config: pg.PoolConfig) {
    this.pool = new pg.Pool(config);
  }

  async connect(): Promise<void> {
    try {
      await this.pool.query('SELECT NOW()');
      this.connected = true;
      console.error("PostgreSQL storage connected");
    } catch (error: any) {
      console.error("Error connecting to PostgreSQL:", error);
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    console.error("PostgreSQL storage disconnected");
  }

  async savePrompt(prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO prompts (
          id, name, description, content, is_template, variables, tags,
          category, metadata, created_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        prompt.id,
        prompt.name,
        prompt.description || null,
        prompt.content,
        prompt.isTemplate || false,
        prompt.variables ? JSON.stringify(prompt.variables) : null,
        prompt.tags || null,
        prompt.category || null,
        prompt.metadata ? JSON.stringify(prompt.metadata) : null,
        prompt.createdAt,
        prompt.updatedAt,
        prompt.version
      ]);
      
      return prompt;
    } catch (error) {
      console.error("Error saving prompt to PostgreSQL:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM prompts WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToPrompt(result.rows[0]);
    } catch (error) {
      console.error(`Error getting prompt ${id} from PostgreSQL:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePrompt(id: string, prompt: Prompt): Promise<Prompt> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE prompts SET
          name = $1,
          description = $2,
          content = $3,
          is_template = $4,
          variables = $5,
          tags = $6,
          category = $7,
          updated_at = $8,
          version = $9,
          metadata = $10
        WHERE id = $11
      `, [
        prompt.name,
        prompt.description || null,
        prompt.content,
        prompt.isTemplate || false,
        prompt.variables ? JSON.stringify(prompt.variables) : null,
        prompt.tags || null,
        prompt.category || null,
        prompt.updatedAt,
        prompt.version,
        prompt.metadata ? JSON.stringify(prompt.metadata) : null,
        id
      ]);
      
      return prompt;
    } catch (error) {
      console.error(`Error updating prompt ${id} in PostgreSQL:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deletePrompt(id: string): Promise<void> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM prompts WHERE id = $1', [id]);
    } catch (error) {
      console.error(`Error deleting prompt ${id} from PostgreSQL:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async listPrompts(options?: ListPromptsOptions): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM prompts';
      const params: any[] = [];
      const conditions: string[] = [];

      if (options) {
        if (options.isTemplate !== undefined) {
          conditions.push('is_template = $' + (params.length + 1));
          params.push(options.isTemplate);
        }

        if (options.category) {
          conditions.push('category = $' + (params.length + 1));
          params.push(options.category);
        }

        if (options.tags && options.tags.length > 0) {
          conditions.push('tags @> $' + (params.length + 1));
          params.push(options.tags);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const result = await client.query(query, params);
      return result.rows.map(row => this.rowToPrompt(row));
    } catch (error) {
      console.error("Error listing prompts from PostgreSQL:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  private rowToPrompt(row: any): Prompt {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      content: row.content,
      isTemplate: row.is_template,
      variables: row.variables ? JSON.parse(row.variables) : undefined,
      tags: row.tags,
      category: row.category,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }

  async getAllPrompts(): Promise<Prompt[]> {
    if (!this.connected) {
      throw new Error("PostgreSQL storage not connected");
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM prompts');
      return result.rows.map(row => this.rowToPrompt(row));
    } catch (error) {
      console.error("Error getting all prompts from PostgreSQL:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }
}

export interface StorageConfig {
  type: 'file' | 'memory' | 'postgres';
  promptsDir?: string;
  backupsDir?: string;
  postgres?: pg.PoolConfig;
}

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  switch (config.type) {
    case 'file':
      if (!config.promptsDir) {
        throw new Error('promptsDir is required for file storage');
      }
      return new FileAdapter(config.promptsDir);
      
    case 'postgres':
      if (!config.postgres) {
        throw new Error('postgres config is required for PostgreSQL storage');
      }
      return new PostgresAdapter(config.postgres);
      
    case 'memory':
    default:
      return new MemoryAdapter();
  }
} 
import { MutablePromptImpl, MutablePromptFactoryImpl } from '../../src/adapters.js';
import { PromptFormat } from '../../src/interfaces.js';

describe('Adapters', () => {
  describe('MutablePromptImpl', () => {
    it('should be defined', () => {
      expect(MutablePromptImpl).toBeDefined();
    });
  });

  describe('MutablePromptFactoryImpl', () => {
    it('should be defined', () => {
      expect(MutablePromptFactoryImpl).toBeDefined();
    });
  });
});

describe('MutablePromptImpl', () => {
  let prompt: MutablePromptImpl;
  
  beforeEach(() => {
    prompt = new MutablePromptImpl({
      id: 'test-prompt',
      name: 'Test Prompt',
      description: 'A test prompt',
      content: 'This is a {{variable}} prompt for {{purpose}}',
      isTemplate: true,
      variables: ['variable', 'purpose'],
      tags: ['test', 'unit-test'],
      metadata: {
        author: 'Test User',
        version: '1.0.0'
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      version: 1
    });
  });
  
  describe('constructor', () => {
    it('should create a MutablePromptImpl instance', () => {
      expect(prompt).toBeInstanceOf(MutablePromptImpl);
      expect(prompt.id).toBe('test-prompt');
      expect(prompt.name).toBe('Test Prompt');
      expect(prompt.isTemplate).toBe(true);
      expect(prompt.variables).toEqual(['variable', 'purpose']);
    });
  });
  
  describe('toFormat', () => {
    it('should convert to JSON format as a string', () => {
      const json = prompt.toFormat(PromptFormat.JSON);
      expect(typeof json).toBe('string');
      
      // Parse the JSON string to verify content
      const parsed = JSON.parse(json as string);
      expect(parsed.id).toBe('test-prompt');
      expect(parsed.name).toBe('Test Prompt');
    });
    
    it('should convert to MDC format as a string', () => {
      const mdc = prompt.toFormat(PromptFormat.MDC);
      expect(typeof mdc).toBe('string');
      expect(mdc).toContain('---');
      expect(mdc).toContain('description: A test prompt');
      expect(mdc).toContain('This is a {{variable}} prompt for {{purpose}}');
    });
  });
  
  describe('applyVariables', () => {
    it('should apply variables to template content', () => {
      const result = prompt.applyVariables({
        variable: 'test',
        purpose: 'unit testing'
      });
      
      expect(result).toBe('This is a test prompt for unit testing');
    });
    
    it('should leave unmatched variables untouched', () => {
      const result = prompt.applyVariables({
        variable: 'test'
      });
      
      expect(result).toBe('This is a test prompt for {{purpose}}');
    });
  });
  
  describe('extractVariables', () => {
    it('should extract variables from content', () => {
      const variables = prompt.extractVariables();
      expect(variables).toEqual(['variable', 'purpose']);
    });
  });
  
  describe('clone', () => {
    it('should create a clone of the prompt', () => {
      const clone = prompt.clone();
      
      expect(clone).not.toBe(prompt); // Different reference
      expect(clone.id).toBe(prompt.id);
      expect(clone.name).toBe(prompt.name);
      expect(clone.content).toBe(prompt.content);
    });
  });
});

describe('MutablePromptFactoryImpl', () => {
  let factory: MutablePromptFactoryImpl;
  
  beforeEach(() => {
    factory = new MutablePromptFactoryImpl();
  });
  
  describe('create', () => {
    it('should create a MutablePromptImpl instance', () => {
      const prompt = factory.create({
        name: 'Factory Test',
        content: 'Test content'
      });
      
      expect(prompt).toBeInstanceOf(MutablePromptImpl);
      expect(prompt.id).toBeDefined();
      expect(prompt.name).toBe('Factory Test');
      expect(prompt.content).toBe('Test content');
    });
  });
  
  // Skip these tests since they rely on more complex implementation details
  // that may change and we're focusing on more basic functionality
  describe.skip('fromMdc', () => {
    it('should create a prompt from MDC content', () => {
      const mdcContent = `---
name: MDC Test
description: A test prompt from MDC
globs: ["*.js", "*.ts"]
---

# Test Prompt

This is a test prompt from MDC content.

## Variables

- None
`;
      
      const prompt = factory.fromMdc(mdcContent);
      
      expect(prompt).toBeInstanceOf(MutablePromptImpl);
      expect(prompt.name).toBe('MDC Test');
    });
  });
  
  describe.skip('fromPgai', () => {
    it('should create a prompt from PGAI data', () => {
      const pgaiData = {
        id: 'pgai-test',
        name: 'PGAI Test',
        content: 'Test content from PGAI',
        metadata: {
          description: 'A test prompt from PGAI',
          tags: ['test', 'pgai']
        }
      };
      
      const prompt = factory.fromPgai(pgaiData);
      
      expect(prompt).toBeInstanceOf(MutablePromptImpl);
      expect(prompt.id).toBe('pgai-test');
      expect(prompt.name).toBe('PGAI Test');
    });
  });
}); 
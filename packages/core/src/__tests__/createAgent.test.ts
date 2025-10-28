import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, registerAdapter } from '../createAgent.js';
import { MockAdapter } from '../../../../tests/utils/mocks.js';

describe('createAgent', () => {
  beforeEach(() => {
    // Register mock adapter
    registerAdapter('mock', () => new MockAdapter());
  });

  it('should create an agent with registered adapter', () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    expect(agent).toBeDefined();
    expect(agent.getThread()).toBeDefined();
  });

  it('should pass options to agent', () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      system: 'You are a test assistant',
      tools: [],
    });
    
    expect(agent['options'].system).toBe('You are a test assistant');
  });

  it('should throw error for unregistered provider', () => {
    expect(() => {
      createAgent({
        provider: 'nonexistent' as any,
        model: 'test-model',
      });
    }).toThrow();
  });

  it('should support temperature and other parameters', () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    expect(agent['options'].temperature).toBe(0.7);
    expect(agent['options'].maxTokens).toBe(1000);
  });

  it('should initialize with tools', () => {
    const tools = [
      {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const, properties: {} },
        runtime: 'builtin' as const,
        handler: async () => ({}),
      },
    ];
    
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      tools,
    });
    
    expect(agent['options'].tools).toHaveLength(1);
  });
});

describe('registerAdapter', () => {
  it('should register a new adapter', () => {
    const registered = registerAdapter('custom', () => new MockAdapter());
    expect(registered).toBe(true);
  });

  it('should allow creating agent with registered adapter', () => {
    registerAdapter('custom2', () => new MockAdapter());
    
    const agent = createAgent({
      provider: 'custom2' as any,
      model: 'test-model',
    });
    
    expect(agent).toBeDefined();
  });

  it('should override existing adapter', () => {
    registerAdapter('mock', () => new MockAdapter({ responses: ['Override'] }));
    
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    expect(agent).toBeDefined();
  });
});


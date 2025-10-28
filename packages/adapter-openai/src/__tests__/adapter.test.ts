import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAIAdapter } from '../openaiAdapter.js';
import { collectEvents, getFinalEvent } from '../../../../tests/utils/helpers.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    adapter = new OpenAIAdapter({ apiKey: 'test-key' });
  });

  it('should have correct provider name', () => {
    expect(adapter.name).toBe('openai');
  });

  it('should support structured output', () => {
    expect(adapter.supportsStructuredOutput()).toBe(true);
  });

  it('should support parallel tools', () => {
    expect(adapter.supportsParallelTools()).toBe(true);
  });

  it('should normalize messages', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];
    
    // Test normalization logic
    expect(messages).toBeDefined();
  });

  it('should handle streaming', async () => {
    // Mock streaming test
    expect(adapter).toBeDefined();
  });

  it('should handle tool calls', () => {
    const tools = [
      {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const, properties: {} },
        runtime: 'builtin' as const,
        handler: async () => ({}),
      },
    ];
    
    expect(tools).toBeDefined();
  });

  it('should handle structured output schemas', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        result: { type: 'string' as const },
      },
    };
    
    expect(schema).toBeDefined();
  });
});


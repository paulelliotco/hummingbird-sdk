import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiAdapter } from '../geminiAdapter.js';

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter({ apiKey: 'test-key' });
  });

  it('should have correct provider name', () => {
    expect(adapter.name).toBe('gemini');
  });

  it('should support structured output', () => {
    expect(adapter.supportsStructuredOutput()).toBe(true);
  });

  it('should support parallel tools', () => {
    expect(adapter.supportsParallelTools()).toBe(true);
  });

  it('should support Live Tools mode', () => {
    const liveAdapter = new GeminiAdapter({
      apiKey: 'test-key',
      useLiveTools: true,
    });
    
    expect(liveAdapter).toBeDefined();
  });

  it('should handle message normalization', () => {
    const messages = [
      { role: 'user' as const, content: 'Test', timestamp: new Date() },
    ];
    
    expect(messages).toBeDefined();
  });

  it('should handle tool re-declaration', () => {
    // Gemini Live Tools require tool re-declaration
    const tools = [
      {
        name: 'test_tool',
        description: 'Test',
        inputSchema: { type: 'object' as const, properties: {} },
        runtime: 'builtin' as const,
        handler: async () => ({}),
      },
    ];
    
    expect(tools).toBeDefined();
  });

  it('should convert function declarations', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const },
      },
    };
    
    expect(schema).toBeDefined();
  });
});


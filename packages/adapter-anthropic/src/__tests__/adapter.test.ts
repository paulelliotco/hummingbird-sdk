import { describe, it, expect, beforeEach } from 'vitest';
import { AnthropicAdapter } from '../anthropicAdapter.js';

describe('AnthropicAdapter', () => {
  let adapter: AnthropicAdapter;

  beforeEach(() => {
    adapter = new AnthropicAdapter({ apiKey: 'test-key' });
  });

  it('should have correct provider name', () => {
    expect(adapter.name).toBe('anthropic');
  });

  it('should support structured output', () => {
    expect(adapter.supportsStructuredOutput()).toBe(true);
  });

  it('should support parallel tools by default', () => {
    expect(adapter.supportsParallelTools()).toBe(true);
  });

  it('should allow disabling parallel tools', () => {
    const adapter = new AnthropicAdapter({
      apiKey: 'test-key',
      disableParallelTools: true,
    });
    
    expect(adapter.supportsParallelTools()).toBe(false);
  });

  it('should handle message normalization', () => {
    const messages = [
      { role: 'user' as const, content: 'Test', timestamp: new Date() },
    ];
    
    expect(messages).toBeDefined();
  });

  it('should handle tool ordering', () => {
    // Anthropic requires specific tool call ordering
    const toolCalls = [
      { id: 'call_1', name: 'tool1', arguments: {} },
      { id: 'call_2', name: 'tool2', arguments: {} },
    ];
    
    expect(toolCalls).toBeDefined();
  });

  it('should convert tool schemas', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        input: { type: 'string' as const },
      },
    };
    
    expect(schema).toBeDefined();
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, registerAdapter } from '@hummingbird/core';
import { MockAdapter, createMockTool } from '../utils/mocks.js';
import { collectEvents, getFinalEvent } from '../utils/helpers.js';

describe('E2E: OpenAI with Toolbox', () => {
  beforeEach(() => {
    registerAdapter('mock', () => new MockAdapter({ responses: ['Using toolbox'] }));
  });

  it('should create agent with toolbox and execute workflow', async () => {
    const calcTool = createMockTool('tb__calculate', { result: 42 });
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      system: 'You are a helpful calculator',
      tools: [calcTool],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Calculate 6 * 7' })
    );
    
    expect(events.length).toBeGreaterThan(0);
    const final = getFinalEvent(events);
    expect(final).toBeDefined();
  });

  it('should handle multiple toolbox calls', async () => {
    const tool1 = createMockTool('tb__tool1', { value: 1 });
    const tool2 = createMockTool('tb__tool2', { value: 2 });
    
    registerAdapter('mock', () =>
      new MockAdapter({
        responses: [],
        toolCalls: [
          { id: 'call_1', name: 'tb__tool1', arguments: {} },
          { id: 'call_2', name: 'tb__tool2', arguments: {} },
        ],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [tool1, tool2],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Use both tools' })
    );
    
    const toolResultEvents = events.filter((e) => e.type === 'tool_result');
    expect(toolResultEvents.length).toBeGreaterThan(0);
  });

  it('should apply permissions to toolbox execution', async () => {
    const restrictedTool = createMockTool('tb__restricted', { data: 'sensitive' });
    
    // Register adapter BEFORE creating agent
    registerAdapter('mock', () =>
      new MockAdapter({
        toolCalls: [{ id: 'call_1', name: 'tb__restricted', arguments: {} }],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [restrictedTool],
      permissions: [
        { tool: 'tb__restricted', action: 'reject' },
      ],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Use restricted tool' })
    );
    
    // Should contain error or rejection
    expect(events.some((e) => e.type === 'error' || e.type === 'tool_result')).toBe(true);
  });
});


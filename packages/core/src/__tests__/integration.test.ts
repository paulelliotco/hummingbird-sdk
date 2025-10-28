import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, registerAdapter } from '../createAgent.js';
import { MockAdapter, createMockTool } from '../../../../tests/utils/mocks.js';
import { collectEvents, getFinalEvent } from '../../../../tests/utils/helpers.js';

describe('Core Integration', () => {
  beforeEach(() => {
    registerAdapter('mock', () => new MockAdapter({ responses: ['Mock response'] }));
  });

  it('should handle full agent lifecycle', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      system: 'You are helpful',
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Hello' })
    );
    
    expect(events.length).toBeGreaterThan(0);
    const final = getFinalEvent(events);
    expect(final).toBeDefined();
    expect(agent.getThread().getMessages().length).toBeGreaterThan(0);
  });

  it('should handle tool execution workflow', async () => {
    const mockTool = createMockTool('calculate', { result: 42 });
    
    registerAdapter('mock', () =>
      new MockAdapter({
        responses: [],
        toolCalls: [{ id: 'call_1', name: 'calculate', arguments: { input: '6 * 7' } }],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      tools: [mockTool],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Calculate 6 * 7' })
    );
    
    const assistantEvents = events.filter((e) => e.type === 'assistant' && e.toolCalls);
    const toolResultEvents = events.filter((e) => e.type === 'tool_result');

    expect(assistantEvents.length).toBeGreaterThan(0);
    expect(toolResultEvents.length).toBeGreaterThan(0);
  });

  it('should handle thread handoff', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    // Initial conversation
    await collectEvents(agent.send({ text: 'First message' }));
    await collectEvents(agent.send({ text: 'Second message' }));
    
    // Create handoff
    const focusedAgent = agent.handoff({ lastN: 1 });
    
    expect(focusedAgent.getThread().getMessages()).toHaveLength(1);
    expect(agent.getThread().getMessages().length).toBeGreaterThan(1);
  });

  it('should handle thread fork', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    await collectEvents(agent.send({ text: 'Initial message' }));
    
    const forked = agent.fork();
    
    // Forked agent has same messages
    expect(forked.getThread().getMessages()).toHaveLength(
      agent.getThread().getMessages().length
    );
    
    // But is independent
    await collectEvents(forked.send({ text: 'Forked message' }));
    
    expect(forked.getThread().getMessages().length).toBeGreaterThan(
      agent.getThread().getMessages().length
    );
  });

  it('should handle structured output', async () => {
    const schema = {
      type: 'object' as const,
      properties: {
        answer: { type: 'number' as const },
      },
      required: ['answer'],
    };
    
    registerAdapter('mock', () =>
      new MockAdapter({ responses: ['{"answer": 42}'] })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
      structured: { schema, strict: true },
    });
    
    const events = await collectEvents(
      agent.send({ text: 'What is the answer?' })
    );
    
    const final = getFinalEvent(events);
    expect(final?.output).toBeDefined();
  });

  it('should accumulate metrics across requests', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    await collectEvents(agent.send({ text: 'First' }));
    await collectEvents(agent.send({ text: 'Second' }));
    await collectEvents(agent.send({ text: 'Third' }));
    
    const metrics = agent.getMetrics();
    expect(metrics.totalRequests).toBe(3);
  });

  it('should handle errors without crashing', async () => {
    registerAdapter('mock', () =>
      new MockAdapter({ shouldError: true })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Test' })
    );
    
    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBeGreaterThan(0);
  });
});


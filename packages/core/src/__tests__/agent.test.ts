import { describe, it, expect, beforeEach } from 'vitest';
import { AgentImpl } from '../agent.js';
import type { Agent } from '../types.js';
import { MockAdapter, createMockTool } from '../../../../tests/utils/mocks.js';
import { collectEvents, getFinalEvent } from '../../../../tests/utils/helpers.js';

describe('Agent', () => {
  let agent: Agent;
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ responses: ['Test response'] });
    agent = new AgentImpl(
      {
        provider: 'mock',
        model: 'test-model',
        system: 'You are a test assistant',
        tools: [],
      },
      adapter
    );
  });

  describe('send', () => {
    it('should send a message and receive response', async () => {
      const events = await collectEvents(
        agent.send({ text: 'Hello' })
      );
      
      expect(events.length).toBeGreaterThan(0);
      const final = getFinalEvent(events);
      expect(final).toBeDefined();
    });

    it('should accumulate assistant deltas', async () => {
      adapter = new MockAdapter({ responses: ['Hello', ' world'] });
      agent = new AgentImpl({ provider: 'mock', model: 'test' }, adapter);
      
      const events = await collectEvents(
        agent.send({ text: 'Test' })
      );
      
      const assistantEvents = events.filter((e) => e.type === 'assistant');
      expect(assistantEvents.length).toBe(2);
    });

    it('should handle tool calls', async () => {
      const mockTool = createMockTool('test_tool', { result: 'success' });

      adapter = new MockAdapter({
        responses: [],
        toolCalls: [{ id: 'call_1', name: 'test_tool', arguments: {} }],
      });

      agent = new AgentImpl({ provider: 'mock', model: 'test', tools: [mockTool] }, adapter);

      const events = await collectEvents(
        agent.send({ text: 'Use the tool' })
      );

      const assistantEvents = events.filter((e) => e.type === 'assistant' && e.toolCalls);
      expect(assistantEvents.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      adapter = new MockAdapter({ shouldError: true });
      agent = new AgentImpl({ provider: 'mock', model: 'test' }, adapter);
      
      const events = await collectEvents(
        agent.send({ text: 'Test' })
      );
      
      const errorEvents = events.filter((e) => e.type === 'error');
      expect(errorEvents.length).toBeGreaterThan(0);
    });
  });

  describe('addTools', () => {
    it('should add tools dynamically', () => {
      const tool = createMockTool('new_tool', { result: 'ok' });
      agent.addTools([tool]);
      
      expect(agent['tools']).toContainEqual(tool);
    });

    it('should allow multiple tool additions', () => {
      const tool1 = createMockTool('tool1', {});
      const tool2 = createMockTool('tool2', {});
      
      agent.addTools([tool1]);
      agent.addTools([tool2]);
      
      expect(agent['tools']).toHaveLength(2);
    });
  });

  describe('handoff', () => {
    it('should create a handoff thread', async () => {
      agent.getThread().addMessage({
        role: 'user',
        content: 'First message',
        timestamp: new Date(),
      });
      
      const focusedAgent = agent.handoff({ lastN: 1 });
      
      expect(focusedAgent.getThread().id).not.toBe(agent.getThread().id);
      expect(focusedAgent.getThread().getMessages()).toHaveLength(1);
    });
  });

  describe('fork', () => {
    it('should fork the agent with same thread', () => {
      agent.getThread().addMessage({
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      });
      
      const forked = agent.fork();
      
      expect(forked.getThread().id).not.toBe(agent.getThread().id);
      expect(forked.getThread().getMessages()).toHaveLength(1);
    });
  });

  describe('getThread', () => {
    it('should return the agent thread', () => {
      const thread = agent.getThread();
      expect(thread).toBeDefined();
      expect(thread.id).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics after execution', async () => {
      await collectEvents(agent.send({ text: 'Test' }));
      
      const metrics = agent.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBeGreaterThan(0);
    });
  });
});


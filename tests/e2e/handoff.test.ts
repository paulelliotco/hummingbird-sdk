import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, registerAdapter } from '@hummingbird/core';
import { MockAdapter } from '../utils/mocks.js';
import { collectEvents } from '../utils/helpers.js';

describe('E2E: Thread Handoff', () => {
  beforeEach(() => {
    registerAdapter('mock', () => new MockAdapter({ responses: ['Response'] }));
  });

  it('should handoff conversation to focused agent', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      system: 'You are a general assistant',
    });
    
    // Initial conversation
    await collectEvents(agent.send({ text: 'First message' }));
    await collectEvents(agent.send({ text: 'Second message' }));
    await collectEvents(agent.send({ text: 'Third message' }));
    
    // Create handoff with last 1 message
    const focusedAgent = agent.handoff({ lastN: 1 });
    
    expect(focusedAgent.getThread().id).not.toBe(agent.getThread().id);
    expect(focusedAgent.getThread().getMessages()).toHaveLength(1);
    expect(agent.getThread().getMessages().length).toBeGreaterThan(1);
  });

  it('should preserve metadata in handoff', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
    });
    
    agent.getThread().setMetadata('userId', 'user123');
    agent.getThread().setMetadata('sessionId', 'session456');
    
    await collectEvents(agent.send({ text: 'Message' }));
    
    const focusedAgent = agent.handoff({ lastN: 1 });
    
    expect(focusedAgent.getThread().getMetadata('userId')).toBe('user123');
    expect(focusedAgent.getThread().getMetadata('sessionId')).toBe('session456');
  });

  it('should handle fork for parallel exploration', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
    });
    
    await collectEvents(agent.send({ text: 'Initial prompt' }));
    
    const forked1 = agent.fork();
    const forked2 = agent.fork();
    
    await collectEvents(forked1.send({ text: 'Branch 1' }));
    await collectEvents(forked2.send({ text: 'Branch 2' }));
    
    // Original unchanged
    expect(agent.getThread().getMessages().length).toBe(2);
    
    // Forks evolved independently
    expect(forked1.getThread().getMessages().length).toBeGreaterThan(2);
    expect(forked2.getThread().getMessages().length).toBeGreaterThan(2);
  });
});


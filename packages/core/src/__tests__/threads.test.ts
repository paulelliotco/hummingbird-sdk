import { describe, it, expect, beforeEach } from 'vitest';
import { Thread, handoff, fork } from '../threads.js';
import type { Message } from '../types.js';

describe('Thread', () => {
  let thread: Thread;

  beforeEach(() => {
    thread = new Thread();
  });

  it('should create a thread with unique ID', () => {
    expect(thread.id).toBeDefined();
    expect(thread.id.length).toBeGreaterThan(0);
  });

  it('should add messages', () => {
    thread.addMessage({
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    });
    
    expect(thread.getMessages()).toHaveLength(1);
    expect(thread.getMessages()[0].content).toBe('Hello');
  });

  it('should get messages by role', () => {
    thread.addMessage({ role: 'user', content: 'User message', timestamp: new Date() });
    thread.addMessage({ role: 'assistant', content: 'Assistant message', timestamp: new Date() });
    thread.addMessage({ role: 'user', content: 'Another user message', timestamp: new Date() });
    
    const userMessages = thread.getMessagesByRole('user');
    expect(userMessages).toHaveLength(2);
  });

  it('should get recent messages', () => {
    for (let i = 0; i < 10; i++) {
      thread.addMessage({ role: 'user', content: `Message ${i}`, timestamp: new Date() });
    }
    
    const recent = thread.getRecentMessages(3);
    expect(recent).toHaveLength(3);
    expect(recent[2].content).toBe('Message 9');
  });

  it('should export and import thread', () => {
    thread.addMessage({ role: 'user', content: 'Test', timestamp: new Date() });
    
    const exported = thread.export();
    const imported = Thread.import(exported);
    
    expect(imported.id).toBe(thread.id);
    expect(imported.getMessages()).toHaveLength(1);
    expect(imported.getMessages()[0].content).toBe('Test');
  });

  it('should maintain metadata', () => {
    thread.setMetadata('userId', 'user123');
    thread.setMetadata('sessionId', 'session456');
    
    expect(thread.getMetadata('userId')).toBe('user123');
    expect(thread.getMetadata('sessionId')).toBe('session456');
  });

  it('should export metadata', () => {
    thread.setMetadata('key', 'value');
    const exported = thread.export();
    
    expect(exported.metadata?.key).toBe('value');
  });
});

describe('handoff', () => {
  it('should extract focus from messages', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'First message', timestamp: new Date() });
    thread.addMessage({ role: 'assistant', content: 'First response', timestamp: new Date() });
    thread.addMessage({ role: 'user', content: 'Second message', timestamp: new Date() });
    
    const focusedThread = handoff(thread, { lastN: 1 });
    
    expect(focusedThread.id).not.toBe(thread.id);
    expect(focusedThread.getMessages()).toHaveLength(1);
    expect(focusedThread.getMessages()[0].content).toBe('Second message');
  });

  it('should preserve original thread ID in metadata', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'Test', timestamp: new Date() });
    
    const focusedThread = handoff(thread, { lastN: 1 });
    
    expect(focusedThread.getMetadata('parentThreadId')).toBe(thread.id);
  });

  it('should copy thread metadata', () => {
    const thread = new Thread();
    thread.setMetadata('userId', 'user123');
    thread.addMessage({ role: 'user', content: 'Test', timestamp: new Date() });
    
    const focusedThread = handoff(thread, { lastN: 1 });
    
    expect(focusedThread.getMetadata('userId')).toBe('user123');
  });

  it('should filter by role', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'User 1', timestamp: new Date() });
    thread.addMessage({ role: 'assistant', content: 'Assistant 1', timestamp: new Date() });
    thread.addMessage({ role: 'user', content: 'User 2', timestamp: new Date() });
    
    const focusedThread = handoff(thread, { role: 'user' });
    
    expect(focusedThread.getMessages()).toHaveLength(2);
    expect(focusedThread.getMessages().every((m) => m.role === 'user')).toBe(true);
  });
});

describe('fork', () => {
  it('should create a new thread with same messages', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'Message 1', timestamp: new Date() });
    thread.addMessage({ role: 'assistant', content: 'Response 1', timestamp: new Date() });
    
    const forked = fork(thread);
    
    expect(forked.id).not.toBe(thread.id);
    expect(forked.getMessages()).toHaveLength(2);
    expect(forked.getMessages()[0].content).toBe('Message 1');
  });

  it('should preserve metadata', () => {
    const thread = new Thread();
    thread.setMetadata('userId', 'user123');
    thread.addMessage({ role: 'user', content: 'Test', timestamp: new Date() });
    
    const forked = fork(thread);
    
    expect(forked.getMetadata('userId')).toBe('user123');
  });

  it('should track parent thread', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'Test', timestamp: new Date() });
    
    const forked = fork(thread);
    
    expect(forked.getMetadata('parentThreadId')).toBe(thread.id);
  });

  it('should allow independent modifications', () => {
    const thread = new Thread();
    thread.addMessage({ role: 'user', content: 'Original', timestamp: new Date() });
    
    const forked = fork(thread);
    forked.addMessage({ role: 'user', content: 'Forked addition', timestamp: new Date() });
    
    expect(thread.getMessages()).toHaveLength(1);
    expect(forked.getMessages()).toHaveLength(2);
  });
});


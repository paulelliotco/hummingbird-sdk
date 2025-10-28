import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogger, AuditEvent } from '../audit.js';

describe('Audit Logger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger({ storage: 'memory' });
  });

  it('should log audit events', async () => {
    await logger.log({
      timestamp: new Date(),
      userId: 'user123',
      action: 'agent.create',
      resource: 'agent-001',
      result: 'success',
    });
    
    const events = await logger.query({ userId: 'user123' });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('agent.create');
  });

  it('should query events by user', async () => {
    await logger.log({
      timestamp: new Date(),
      userId: 'user1',
      action: 'test',
      result: 'success',
    });
    
    await logger.log({
      timestamp: new Date(),
      userId: 'user2',
      action: 'test',
      result: 'success',
    });
    
    const events = await logger.query({ userId: 'user1' });
    expect(events).toHaveLength(1);
    expect(events[0].userId).toBe('user1');
  });

  it('should query events by action', async () => {
    await logger.log({
      timestamp: new Date(),
      userId: 'user1',
      action: 'agent.create',
      result: 'success',
    });
    
    await logger.log({
      timestamp: new Date(),
      userId: 'user1',
      action: 'agent.delete',
      result: 'success',
    });
    
    const events = await logger.query({ action: 'agent.create' });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('agent.create');
  });

  it('should query events by time range', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
    
    await logger.log({
      timestamp: oneHourAgo,
      userId: 'user1',
      action: 'test',
      result: 'success',
    });
    
    const events = await logger.query({
      startTime: new Date(now.getTime() - 7200 * 1000),
      endTime: now,
    });
    
    expect(events).toHaveLength(1);
  });

  it('should include metadata in events', async () => {
    await logger.log({
      timestamp: new Date(),
      userId: 'user1',
      action: 'test',
      result: 'success',
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Test/1.0',
      },
    });
    
    const events = await logger.query({ userId: 'user1' });
    expect(events[0].metadata?.ip).toBe('127.0.0.1');
  });

  it('should handle failed actions', async () => {
    await logger.log({
      timestamp: new Date(),
      userId: 'user1',
      action: 'agent.create',
      result: 'failure',
      error: 'Permission denied',
    });
    
    const events = await logger.query({ result: 'failure' });
    expect(events).toHaveLength(1);
    expect(events[0].error).toBe('Permission denied');
  });
});


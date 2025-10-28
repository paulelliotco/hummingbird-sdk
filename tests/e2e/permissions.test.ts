import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, registerAdapter } from '@hummingbird/core';
import { MockAdapter, createMockTool } from '../utils/mocks.js';
import { collectEvents } from '../utils/helpers.js';

describe('E2E: Permission Enforcement', () => {
  beforeEach(() => {
    registerAdapter('mock', () =>
      new MockAdapter({
        toolCalls: [{ id: 'call_1', name: 'File.write', arguments: { path: 'test.txt' } }],
      })
    );
  });

  it('should allow permitted tools', async () => {
    const writeTool = createMockTool('File.write', { success: true });
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [writeTool],
      permissions: [
        { tool: 'File.write', action: 'allow' },
      ],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Write file' })
    );
    
    const toolResults = events.filter((e) => e.type === 'tool_result');
    expect(toolResults.length).toBeGreaterThan(0);
  });

  it('should reject forbidden tools', async () => {
    const deleteTool = createMockTool('File.delete', { success: true });
    
    registerAdapter('mock', () =>
      new MockAdapter({
        toolCalls: [{ id: 'call_1', name: 'File.delete', arguments: {} }],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [deleteTool],
      permissions: [
        { tool: 'File.delete', action: 'reject' },
      ],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Delete file' })
    );
    
    // Should have error or rejection event
    expect(events.some((e) => e.type === 'error')).toBe(true);
  });

  it('should match tool patterns with glob', async () => {
    const readTool = createMockTool('File.read', { content: 'data' });
    const writeTool = createMockTool('File.write', { success: true });
    
    registerAdapter('mock', () =>
      new MockAdapter({
        toolCalls: [
          { id: 'call_1', name: 'File.read', arguments: {} },
          { id: 'call_2', name: 'File.write', arguments: {} },
        ],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [readTool, writeTool],
      permissions: [
        { tool: 'File.*', action: 'allow' },
      ],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Read and write files' })
    );
    
    const toolResults = events.filter((e) => e.type === 'tool_result');
    expect(toolResults.length).toBe(2);
  });

  it('should match argument patterns', async () => {
    const bashTool = createMockTool('Bash', { stdout: 'done' });
    
    registerAdapter('mock', () =>
      new MockAdapter({
        toolCalls: [
          { id: 'call_1', name: 'Bash', arguments: { cmd: 'rm -rf /' } },
        ],
      })
    );
    
    const agent = createAgent({
      provider: 'mock',
      model: 'gpt-4',
      tools: [bashTool],
      permissions: [
        { tool: 'Bash', matches: { cmd: '*rm -rf*' }, action: 'reject' },
        { tool: 'Bash', action: 'allow' },
      ],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Run dangerous command' })
    );
    
    expect(events.some((e) => e.type === 'error')).toBe(true);
  });
});


import { describe, it, expect } from 'vitest';
import {
  createAssistantEvent,
  createToolCallEvent,
  createToolResultEvent,
  createArtifactEvent,
  createFinalEvent,
  createErrorEvent,
  accumulateEvents,
} from '../events.js';

describe('Event Creators', () => {
  it('should create assistant event', () => {
    const event = createAssistantEvent('Hello', undefined, false);
    expect(event.type).toBe('assistant');
    expect(event.delta).toBe('Hello');
    expect(event.done).toBe(false);
  });

  it('should create tool call event', () => {
    const toolCalls = [{ id: 'call_1', name: 'test', arguments: {} }];
    const event = createToolCallEvent(toolCalls);
    expect(event.type).toBe('tool_call');
    expect(event.toolCalls).toEqual(toolCalls);
  });

  it('should create tool result event', () => {
    const results = [{ id: 'call_1', result: 'success' }];
    const event = createToolResultEvent(results);
    expect(event.type).toBe('tool_result');
    expect(event.results).toEqual(results);
  });

  it('should create artifact event', () => {
    const event = createArtifactEvent('artifact_1', 'Artifact content', 'text');
    expect(event.type).toBe('artifact');
    expect(event.ref).toBe('artifact_1');
    expect(event.content).toBe('Artifact content');
    expect(event.artifactType).toBe('text');
  });

  it('should create final event', () => {
    const event = createFinalEvent('response', undefined, { totalTokens: 100 });
    expect(event.type).toBe('final');
    expect(event.response).toBe('response');
    expect(event.usage?.totalTokens).toBe(100);
  });

  it('should create error event', () => {
    const event = createErrorEvent('Test error', 'TestError');
    expect(event.type).toBe('error');
    expect(event.error).toBe('Test error');
    expect(event.code).toBe('TestError');
  });
});

describe('accumulateEvents', () => {
  it('should accumulate assistant deltas', () => {
    const events = [
      createAssistantEvent('Hello', undefined, false),
      createAssistantEvent(' world', undefined, true),
      createFinalEvent(),
    ];
    
    const result = accumulateEvents(events);
    expect(result.text).toBe('Hello world');
  });

  it('should collect tool calls', () => {
    const events = [
      createToolCallEvent([{ id: 'call_1', name: 'test1', arguments: {} }]),
      createToolCallEvent([{ id: 'call_2', name: 'test2', arguments: {} }]),
      createFinalEvent(),
    ];
    
    const result = accumulateEvents(events);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls?.[0].id).toBe('call_1');
    expect(result.toolCalls?.[1].id).toBe('call_2');
  });

  it('should collect artifacts', () => {
    const events = [
      createArtifactEvent('art_1', 'Content 1', 'text'),
      createArtifactEvent('art_2', 'Content 2', 'code'),
      createFinalEvent(),
    ];
    
    const result = accumulateEvents(events);
    expect(result.artifacts).toHaveLength(2);
    expect(result.artifacts?.[0].ref).toBe('art_1');
  });

  it('should capture usage from final event', () => {
    const events = [
      createAssistantEvent('Test', undefined, false),
      createFinalEvent(undefined, undefined, { totalTokens: 150 }),
    ];
    
    const result = accumulateEvents(events);
    expect(result.usage?.totalTokens).toBe(150);
  });

  it('should capture structured output', () => {
    const structuredData = { result: 'success' };
    const events = [
      createFinalEvent(undefined, structuredData),
    ];
    
    const result = accumulateEvents(events);
    expect(result.structured).toEqual(structuredData);
  });

  it('should handle empty events', () => {
    const result = accumulateEvents([]);
    expect(result.text).toBe('');
    expect(result.toolCalls).toBeUndefined();
    expect(result.artifacts).toBeUndefined();
  });
});


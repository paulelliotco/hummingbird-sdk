import { describe, it, expect } from 'vitest';
import { startSpan, recordSpanEvent, setSpanAttributes, endSpan } from '../tracing.js';

describe('OpenTelemetry Tracing', () => {
  it('should create a span', () => {
    const span = startSpan('test.operation', {
      'test.attribute': 'value',
    });
    
    expect(span).toBeDefined();
  });

  it('should record span events', () => {
    const span = startSpan('test.operation');
    
    expect(() => {
      recordSpanEvent(span, 'test.event', { data: 'test' });
    }).not.toThrow();
  });

  it('should set span attributes', () => {
    const span = startSpan('test.operation');
    
    expect(() => {
      setSpanAttributes(span, {
        'gen_ai.system': 'openai',
        'gen_ai.request.model': 'gpt-4',
      });
    }).not.toThrow();
  });

  it('should end span', () => {
    const span = startSpan('test.operation');
    expect(() => endSpan(span)).not.toThrow();
  });

  it('should handle nested spans', () => {
    const parent = startSpan('parent.operation');
    const child = startSpan('child.operation', {}, parent);
    
    expect(child).toBeDefined();
    
    endSpan(child);
    endSpan(parent);
  });

  it('should record GenAI semantic conventions', () => {
    const span = startSpan('gen_ai.completion');
    
    setSpanAttributes(span, {
      'gen_ai.system': 'openai',
      'gen_ai.request.model': 'gpt-4',
      'gen_ai.request.temperature': 0.7,
      'gen_ai.request.max_tokens': 1000,
    });
    
    endSpan(span);
    expect(span).toBeDefined();
  });
});


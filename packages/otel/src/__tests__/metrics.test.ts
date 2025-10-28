import { describe, it, expect } from 'vitest';
import {
  incrementCounter,
  recordHistogram,
  recordGauge,
  createCounter,
  createHistogram,
} from '../metrics.js';

describe('OpenTelemetry Metrics', () => {
  it('should increment counter', () => {
    expect(() => {
      incrementCounter('test.counter', 1, { label: 'test' });
    }).not.toThrow();
  });

  it('should record histogram value', () => {
    expect(() => {
      recordHistogram('test.duration', 100, { operation: 'test' });
    }).not.toThrow();
  });

  it('should record gauge value', () => {
    expect(() => {
      recordGauge('test.memory', 1024, { unit: 'bytes' });
    }).not.toThrow();
  });

  it('should create custom counter', () => {
    const counter = createCounter('custom.counter', {
      description: 'A custom counter',
      unit: 'requests',
    });
    
    expect(counter).toBeDefined();
  });

  it('should create custom histogram', () => {
    const histogram = createHistogram('custom.histogram', {
      description: 'A custom histogram',
      unit: 'ms',
    });
    
    expect(histogram).toBeDefined();
  });

  it('should track GenAI metrics', () => {
    expect(() => {
      incrementCounter('gen_ai.client.operation.duration', 1, {
        'gen_ai.system': 'openai',
        'gen_ai.operation.name': 'chat',
      });
      
      recordHistogram('gen_ai.client.token.usage', 150, {
        'gen_ai.token.type': 'output',
      });
    }).not.toThrow();
  });
});


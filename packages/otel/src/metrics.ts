/**
 * OpenTelemetry metrics utilities
 */

export interface Counter {
  add(value: number, attributes?: Record<string, any>): void;
}

export interface Histogram {
  record(value: number, attributes?: Record<string, any>): void;
}

class MockCounter implements Counter {
  add(value: number, attributes?: Record<string, any>): void {}
}

class MockHistogram implements Histogram {
  record(value: number, attributes?: Record<string, any>): void {}
}

export function incrementCounter(name: string, value: number, attributes?: Record<string, any>): void {
  // Mock implementation
}

export function recordHistogram(name: string, value: number, attributes?: Record<string, any>): void {
  // Mock implementation
}

export function recordGauge(name: string, value: number, attributes?: Record<string, any>): void {
  // Mock implementation
}

export function createCounter(name: string, options?: { description?: string; unit?: string }): Counter {
  return new MockCounter();
}

export function createHistogram(name: string, options?: { description?: string; unit?: string }): Histogram {
  return new MockHistogram();
}

/**
 * OpenTelemetry tracing utilities
 */

export interface Span {
  end(): void;
  setAttribute(key: string, value: any): void;
  addEvent(name: string, attributes?: any): void;
}

class MockSpan implements Span {
  end(): void {}
  setAttribute(key: string, value: any): void {}
  addEvent(name: string, attributes?: any): void {}
}

export function startSpan(name: string, attributes?: Record<string, any>, parent?: Span): Span {
  const span = new MockSpan();
  return span;
}

export function recordSpanEvent(span: Span, name: string, attributes?: Record<string, any>): void {
  span.addEvent(name, attributes);
}

export function setSpanAttributes(span: Span, attributes: Record<string, any>): void {
  for (const [key, value] of Object.entries(attributes)) {
    span.setAttribute(key, value);
  }
}

export function endSpan(span: Span): void {
  span.end();
}

import { describe, it, expect } from 'vitest';
import { logInfo, logError, logDebug, logWarn, createLogger } from '../logs.js';

describe('OpenTelemetry Logs', () => {
  it('should log info messages', () => {
    expect(() => {
      logInfo('Test info message', { context: 'test' });
    }).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => {
      logError('Test error', { code: 'TEST_ERROR' });
    }).not.toThrow();
  });

  it('should log debug messages', () => {
    expect(() => {
      logDebug('Test debug', { detail: 'extra info' });
    }).not.toThrow();
  });

  it('should log warnings', () => {
    expect(() => {
      logWarn('Test warning', { severity: 'medium' });
    }).not.toThrow();
  });

  it('should create custom logger', () => {
    const logger = createLogger('custom-component');
    expect(logger).toBeDefined();
  });

  it('should support structured logging', () => {
    expect(() => {
      logInfo('Structured log', {
        userId: 'user123',
        action: 'login',
        timestamp: new Date().toISOString(),
        metadata: {
          ip: '127.0.0.1',
          userAgent: 'Test/1.0',
        },
      });
    }).not.toThrow();
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    expect(() => {
      logError('Error occurred', {
        error: error.message,
        stack: error.stack,
      });
    }).not.toThrow();
  });
});


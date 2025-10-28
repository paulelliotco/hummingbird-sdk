/**
 * OpenTelemetry logging utilities
 */

export interface Logger {
  info(message: string, attributes?: Record<string, any>): void;
  error(message: string, attributes?: Record<string, any>): void;
  debug(message: string, attributes?: Record<string, any>): void;
  warn(message: string, attributes?: Record<string, any>): void;
}

class MockLogger implements Logger {
  info(message: string, attributes?: Record<string, any>): void {}
  error(message: string, attributes?: Record<string, any>): void {}
  debug(message: string, attributes?: Record<string, any>): void {}
  warn(message: string, attributes?: Record<string, any>): void {}
}

const defaultLogger = new MockLogger();

export function logInfo(message: string, attributes?: Record<string, any>): void {
  defaultLogger.info(message, attributes);
}

export function logError(message: string, attributes?: Record<string, any>): void {
  defaultLogger.error(message, attributes);
}

export function logDebug(message: string, attributes?: Record<string, any>): void {
  defaultLogger.debug(message, attributes);
}

export function logWarn(message: string, attributes?: Record<string, any>): void {
  defaultLogger.warn(message, attributes);
}

export function createLogger(name: string): Logger {
  return new MockLogger();
}

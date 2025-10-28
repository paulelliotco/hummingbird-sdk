/**
 * @hummingbird/otel - OpenTelemetry helpers for AI agents
 */

export {
  startSpan,
  endSpan,
  setSpanAttributes,
  recordSpanEvent,
} from './tracing.js';

export {
  incrementCounter,
  recordHistogram,
  recordGauge,
  createCounter,
  createHistogram,
} from './metrics.js';

export {
  logInfo,
  logError,
  logDebug,
  logWarn,
} from './logs.js';


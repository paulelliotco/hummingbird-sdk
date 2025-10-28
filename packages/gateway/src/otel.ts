/**
 * OpenTelemetry exporter configuration
 */

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { GatewayConfig } from './config.js';

export function setupOTelExporter(config: GatewayConfig): OTLPTraceExporter | null {
  if (!config.otel.enabled || !config.otel.endpoint) {
    return null;
  }

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: config.otel.serviceName,
  });

  const exporter = new OTLPTraceExporter({
    url: config.otel.endpoint,
  });

  return exporter;
}


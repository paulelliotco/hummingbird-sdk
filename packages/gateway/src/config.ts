/**
 * Gateway configuration
 */

export interface GatewayConfig {
  port: number;
  host: string;
  auth?: {
    type: 'api-key' | 'jwt';
    keys?: string[];
    secret?: string;
    algorithm?: string;
  };
  otel?: {
    enabled: boolean;
    endpoint: string;
  };
}

export function loadConfig(): GatewayConfig {
  return {
    port: parseInt(process.env.GATEWAY_PORT || '8080'),
    host: process.env.GATEWAY_HOST || '0.0.0.0',
    auth: {
      type: 'api-key',
      keys: process.env.GATEWAY_API_KEYS?.split(',') || [],
    },
    otel: {
      enabled: process.env.OTEL_ENABLED === 'true',
      endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318',
    },
  };
}

export function validateConfig(config: GatewayConfig): void {
  if (typeof config.port !== 'number' || config.port < 0 || config.port > 65535) {
    throw new Error('Invalid port number');
  }
  
  if (!config.host || typeof config.host !== 'string') {
    throw new Error('Invalid host');
  }
}

import { describe, it, expect } from 'vitest';
import { loadConfig, validateConfig, GatewayConfig } from '../config.js';

describe('Gateway Config', () => {
  it('should load default config', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.port).toBeDefined();
  });

  it('should validate valid config', () => {
    const config: GatewayConfig = {
      port: 8080,
      host: '0.0.0.0',
      auth: {
        type: 'api-key',
        keys: ['test-key'],
      },
      otel: {
        enabled: true,
        endpoint: 'http://localhost:4318',
      },
    };
    
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should reject invalid port', () => {
    const config: any = {
      port: 'invalid',
      host: '0.0.0.0',
    };
    
    expect(() => validateConfig(config)).toThrow();
  });

  it('should handle environment variables', () => {
    process.env.GATEWAY_PORT = '9000';
    const config = loadConfig();
    expect(config.port).toBe(9000);
    delete process.env.GATEWAY_PORT;
  });

  it('should support JWT auth config', () => {
    const config: GatewayConfig = {
      port: 8080,
      host: '0.0.0.0',
      auth: {
        type: 'jwt',
        secret: 'test-secret',
        algorithm: 'HS256',
      },
    };
    
    expect(() => validateConfig(config)).not.toThrow();
  });
});


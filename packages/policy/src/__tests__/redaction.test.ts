import { describe, it, expect } from 'vitest';
import { redactSecrets, redactSecretsFromObject, containsSecrets, redactEnv } from '../redaction.js';

describe('redactSecrets', () => {
  it('should redact OpenAI API keys', () => {
    const text = 'My key is sk-proj-abc123def456';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('sk-proj-abc123def456');
    expect(redacted).toContain('***REDACTED***');
  });

  it('should redact AWS keys', () => {
    const text = 'Access: AKIAIOSFODNN7EXAMPLE Secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(redacted).not.toContain('wJalrXUtnFEMI');
  });

  it('should redact GitHub tokens', () => {
    const text = 'Token: ghp_1234567890abcdefghijklmnopqrst';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('ghp_1234567890');
  });

  it('should redact JWTs', () => {
    const text = 'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('should handle text with no secrets', () => {
    const text = 'This is normal text with no secrets';
    const redacted = redactSecrets(text);
    expect(redacted).toBe(text);
  });

  it('should respect custom replacement string', () => {
    const text = 'Key: sk-abc123';
    const redacted = redactSecrets(text, { replacement: '[HIDDEN]' });
    expect(redacted).toContain('[HIDDEN]');
    expect(redacted).not.toContain('***REDACTED***');
  });

  it('should skip redaction when disabled', () => {
    const text = 'Key: sk-abc123';
    const redacted = redactSecrets(text, { enabled: false });
    expect(redacted).toBe(text);
  });
});

describe('redactSecretsFromObject', () => {
  it('should redact secrets in object values', () => {
    const obj = {
      apiKey: 'sk-abc123',
      message: 'Hello',
    };
    const redacted = redactSecretsFromObject(obj);
    expect(redacted.apiKey).toBe('***REDACTED***');
    expect(redacted.message).toBe('Hello');
  });

  it('should redact nested objects', () => {
    const obj = {
      config: {
        password: 'secret123',
        username: 'john',
      },
    };
    const redacted = redactSecretsFromObject(obj);
    expect(redacted.config.password).toBe('***REDACTED***');
    expect(redacted.config.username).toBe('john');
  });

  it('should redact arrays', () => {
    const obj = {
      keys: ['sk-abc123', 'normal-text'],
    };
    const redacted = redactSecretsFromObject(obj);
    expect(redacted.keys[0]).not.toContain('sk-abc123');
    expect(redacted.keys[1]).toBe('normal-text');
  });

  it('should redact sensitive field names', () => {
    const obj = {
      token: 'anything',
      secret: 'anything',
      api_key: 'anything',
      normal: 'keep',
    };
    const redacted = redactSecretsFromObject(obj);
    expect(redacted.token).toBe('***REDACTED***');
    expect(redacted.secret).toBe('***REDACTED***');
    expect(redacted.api_key).toBe('***REDACTED***');
    expect(redacted.normal).toBe('keep');
  });
});

describe('containsSecrets', () => {
  it('should detect secrets in text', () => {
    expect(containsSecrets('Key: sk-abc123')).toBe(true);
    expect(containsSecrets('Token: ghp_abc123')).toBe(true);
    expect(containsSecrets('Normal text')).toBe(false);
  });
});

describe('redactEnv', () => {
  it('should redact environment variables with sensitive names', () => {
    const env = {
      API_KEY: 'secret',
      PASSWORD: 'secret',
      USERNAME: 'john',
      PATH: '/usr/bin',
    };
    const redacted = redactEnv(env);
    expect(redacted.API_KEY).toBe('***REDACTED***');
    expect(redacted.PASSWORD).toBe('***REDACTED***');
    expect(redacted.USERNAME).toBe('john');
    expect(redacted.PATH).toBe('/usr/bin');
  });

  it('should redact environment variables with secret values', () => {
    const env = {
      SOME_CONFIG: 'sk-abc123',
      NORMAL_CONFIG: 'value',
    };
    const redacted = redactEnv(env);
    expect(redacted.SOME_CONFIG).toBe('***REDACTED***');
    expect(redacted.NORMAL_CONFIG).toBe('value');
  });
});


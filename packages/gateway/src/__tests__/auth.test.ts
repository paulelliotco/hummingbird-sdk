import { describe, it, expect } from 'vitest';
import { authenticateApiKey, authenticateJWT, generateJWT } from '../auth.js';

describe('Gateway Authentication', () => {
  describe('API Key Authentication', () => {
    it('should authenticate valid API key', () => {
      const result = authenticateApiKey('valid-key', ['valid-key', 'another-key']);
      expect(result.authenticated).toBe(true);
    });

    it('should reject invalid API key', () => {
      const result = authenticateApiKey('invalid-key', ['valid-key']);
      expect(result.authenticated).toBe(false);
    });

    it('should handle empty key list', () => {
      const result = authenticateApiKey('any-key', []);
      expect(result.authenticated).toBe(false);
    });
  });

  describe('JWT Authentication', () => {
    it('should generate and verify JWT', () => {
      const secret = 'test-secret';
      const payload = { userId: 'user123', role: 'admin' };
      
      const token = generateJWT(payload, secret);
      expect(token).toBeDefined();
      
      const result = authenticateJWT(token, secret);
      expect(result.authenticated).toBe(true);
      expect(result.payload?.userId).toBe('user123');
    });

    it('should reject invalid JWT', () => {
      const result = authenticateJWT('invalid.token.here', 'test-secret');
      expect(result.authenticated).toBe(false);
    });

    it('should reject expired JWT', () => {
      const secret = 'test-secret';
      const payload = { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 };
      
      const token = generateJWT(payload, secret);
      const result = authenticateJWT(token, secret);
      
      expect(result.authenticated).toBe(false);
    });

    it('should handle different algorithms', () => {
      const secret = 'test-secret';
      const payload = { userId: 'user123' };
      
      const token = generateJWT(payload, secret, { algorithm: 'HS256' });
      expect(token).toBeDefined();
    });
  });
});


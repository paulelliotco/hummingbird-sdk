import { describe, it, expect, beforeEach } from 'vitest';
import { SecretsVault, encryptSecret, decryptSecret } from '../secrets.js';

describe('Secrets Vault', () => {
  let vault: SecretsVault;

  beforeEach(() => {
    vault = new SecretsVault({ encryptionKey: 'test-key-32-bytes-long-enough!!' });
  });

  it('should store and retrieve secrets', async () => {
    await vault.set('api-key', 'secret-value');
    const value = await vault.get('api-key');
    
    expect(value).toBe('secret-value');
  });

  it('should return undefined for non-existent secrets', async () => {
    const value = await vault.get('nonexistent');
    expect(value).toBeUndefined();
  });

  it('should delete secrets', async () => {
    await vault.set('temp', 'value');
    await vault.delete('temp');
    
    const value = await vault.get('temp');
    expect(value).toBeUndefined();
  });

  it('should list secret keys', async () => {
    await vault.set('key1', 'value1');
    await vault.set('key2', 'value2');
    
    const keys = await vault.list();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should encrypt secrets', () => {
    const encrypted = encryptSecret('my-secret', 'encryption-key');
    expect(encrypted).not.toBe('my-secret');
  });

  it('should decrypt secrets', () => {
    const key = 'encryption-key';
    const encrypted = encryptSecret('my-secret', key);
    const decrypted = decryptSecret(encrypted, key);
    
    expect(decrypted).toBe('my-secret');
  });

  it('should handle concurrent access', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(vault.set(`key${i}`, `value${i}`));
    }
    
    await Promise.all(promises);
    
    const keys = await vault.list();
    expect(keys.length).toBe(10);
  });
});


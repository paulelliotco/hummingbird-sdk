/**
 * Secrets management
 */

export class SecretsVault {
  private secrets: Map<string, string> = new Map();
  private encryptionKey: string;
  
  constructor(options: { encryptionKey: string }) {
    this.encryptionKey = options.encryptionKey;
  }
  
  async set(key: string, value: string): Promise<void> {
    const encrypted = encryptSecret(value, this.encryptionKey);
    this.secrets.set(key, encrypted);
  }
  
  async get(key: string): Promise<string | undefined> {
    const encrypted = this.secrets.get(key);
    if (!encrypted) return undefined;
    return decryptSecret(encrypted, this.encryptionKey);
  }
  
  async delete(key: string): Promise<void> {
    this.secrets.delete(key);
  }
  
  async list(): Promise<string[]> {
    return Array.from(this.secrets.keys());
  }
}

export function encryptSecret(value: string, key: string): string {
  // Simple XOR encryption for testing
  let result = '';
  for (let i = 0; i < value.length; i++) {
    result += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result).toString('base64');
}

export function decryptSecret(encrypted: string, key: string): string {
  const decoded = Buffer.from(encrypted, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Secret redaction utilities
 */

export interface RedactionOptions {
  replacement?: string;
  enabled?: boolean;
}

const SECRET_PATTERNS = [
  // OpenAI API keys (including sk-proj-, sk-test-, etc.)
  /sk-[a-zA-Z0-9_-]+/g,
  // AWS Access Key ID
  /AKIA[0-9A-Z]{16}/g,
  // AWS Secret Access Key (base64-like, typically 40 chars)
  /[a-zA-Z0-9/+=]{40,}/g,
  // GitHub tokens
  /ghp_[a-zA-Z0-9]+/g,
  /gho_[a-zA-Z0-9]+/g,
  /ghu_[a-zA-Z0-9]+/g,
  // JWTs
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
];

const SENSITIVE_FIELD_NAMES = [
  'token',
  'secret',
  'password',
  'api_key',
  'apiKey',
  'apikey',
  'access_token',
  'accessToken',
  'private_key',
  'privateKey',
];

export function redactSecrets(text: string, options: RedactionOptions = {}): string {
  if (options.enabled === false) {
    return text;
  }

  const replacement = options.replacement || '***REDACTED***';
  let redacted = text;

  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redacted;
}

export function redactSecretsFromObject(obj: any, options: RedactionOptions = {}): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'string') {
        return redactSecrets(item, options);
      }
      return redactSecretsFromObject(item, options);
    });
  }

  const redacted: any = {};
  const replacement = options.replacement || '***REDACTED***';

  for (const [key, value] of Object.entries(obj)) {
    // Check if field name is sensitive
    if (SENSITIVE_FIELD_NAMES.some((name) => key.toLowerCase().includes(name.toLowerCase()))) {
      redacted[key] = replacement;
    } else if (typeof value === 'string') {
      redacted[key] = redactSecrets(value, options);
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSecretsFromObject(value, options);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function containsSecrets(text: string): boolean {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

export function redactEnv(env: Record<string, string>, options: RedactionOptions = {}): Record<string, string> {
  const redacted: Record<string, string> = {};
  const replacement = options.replacement || '***REDACTED***';

  for (const [key, value] of Object.entries(env)) {
    // Check if env var name is sensitive
    if (SENSITIVE_FIELD_NAMES.some((name) => key.toLowerCase().includes(name.toLowerCase()))) {
      redacted[key] = replacement;
    } else if (containsSecrets(value)) {
      redacted[key] = replacement;
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

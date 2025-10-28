/**
 * Test fixtures and data
 */

import type { Message, ToolCall, JSONSchema } from '@hummingbird/core';

/**
 * Sample messages
 */
export const sampleMessages: Message[] = [
  {
    role: 'user',
    content: 'Hello, can you help me?',
    timestamp: new Date('2025-01-01T00:00:00Z'),
  },
  {
    role: 'assistant',
    content: 'Of course! What do you need help with?',
    timestamp: new Date('2025-01-01T00:00:01Z'),
  },
  {
    role: 'user',
    content: 'List the files in the current directory',
    timestamp: new Date('2025-01-01T00:00:02Z'),
  },
];

/**
 * Sample tool calls
 */
export const sampleToolCalls: ToolCall[] = [
  {
    id: 'call_1',
    name: 'File.list',
    arguments: { path: '.' },
  },
  {
    id: 'call_2',
    name: 'File.read',
    arguments: { path: 'package.json' },
  },
];

/**
 * Sample JSON schemas
 */
export const validSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string' },
  },
  required: ['name', 'email'],
};

export const invalidData = {
  age: 25,
  // missing required fields: name, email
};

export const validData = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
};

/**
 * Sample API keys (fake)
 */
export const mockApiKeys = {
  openai: 'sk-mock-openai-key-1234567890',
  anthropic: 'sk-ant-mock-anthropic-key-1234567890',
  gemini: 'mock-gemini-key-1234567890',
};

/**
 * Sample secrets to test redaction
 */
export const secretsToRedact = {
  openaiKey: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz',
  awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
};

/**
 * Sample text with secrets
 */
export const textWithSecrets = `
Here's my OpenAI key: ${secretsToRedact.openaiKey}
And my AWS credentials: ${secretsToRedact.awsAccessKey}
Secret: ${secretsToRedact.awsSecretKey}
`;

/**
 * Sample policy configurations
 */
export const samplePolicyRules = {
  permissive: [
    { tool: 'File.read', action: 'allow' as const },
    { tool: '*', action: 'allow' as const },
  ],
  strict: [
    { tool: 'File.read', action: 'allow' as const },
    { tool: '*', action: 'reject' as const },
  ],
  mixed: [
    { tool: 'File.read', action: 'allow' as const },
    { tool: 'File.write', action: 'ask' as const },
    { tool: 'Bash', action: 'reject' as const },
    { tool: 'Bash', matches: { cmd: '*git commit*' }, action: 'ask' as const },
  ],
};


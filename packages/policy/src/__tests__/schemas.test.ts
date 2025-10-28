import { describe, it, expect } from 'vitest';
import {
  PermissionRuleSchema,
  PolicyConfigSchema,
  DefaultPolicy,
  StrictPolicy,
  PermissivePolicy,
} from '../schemas.js';

describe('PolicySchemas', () => {
  it('should have valid PermissionRuleSchema', () => {
    expect(PermissionRuleSchema.type).toBe('object');
    expect(PermissionRuleSchema.required).toContain('tool');
    expect(PermissionRuleSchema.required).toContain('action');
  });

  it('should have valid PolicyConfigSchema', () => {
    expect(PolicyConfigSchema.type).toBe('object');
    expect(PolicyConfigSchema.required).toContain('version');
    expect(PolicyConfigSchema.required).toContain('rules');
  });
});

describe('DefaultPolicy', () => {
  it('should allow safe read operations', () => {
    const readRule = DefaultPolicy.rules.find((r) => r.tool === 'File.read');
    expect(readRule?.action).toBe('allow');
  });

  it('should ask for write operations', () => {
    const writeRule = DefaultPolicy.rules.find((r) => r.tool === 'File.write');
    expect(writeRule?.action).toBe('ask');
  });

  it('should ask for bash commands', () => {
    const bashRule = DefaultPolicy.rules.find((r) => r.tool === 'Bash' && !r.matches);
    expect(bashRule?.action).toBe('ask');
  });

  it('should reject dangerous operations', () => {
    const dangerousRule = DefaultPolicy.rules.find(
      (r) => r.tool === 'Bash' && r.matches?.cmd === '*rm -rf*'
    );
    expect(dangerousRule?.action).toBe('reject');
  });

  it('should have metadata', () => {
    expect(DefaultPolicy.metadata.name).toBeDefined();
    expect(DefaultPolicy.metadata.description).toBeDefined();
  });
});

describe('StrictPolicy', () => {
  it('should only allow read operations', () => {
    const allowedRules = StrictPolicy.rules.filter((r) => r.action === 'allow');
    expect(allowedRules.every((r) => r.tool === 'File.read' || r.tool === 'File.list')).toBe(true);
  });

  it('should reject everything else', () => {
    const catchAll = StrictPolicy.rules.find((r) => r.tool === '*');
    expect(catchAll?.action).toBe('reject');
  });
});

describe('PermissivePolicy', () => {
  it('should reject only truly dangerous operations', () => {
    const rejectRules = PermissivePolicy.rules.filter((r) => r.action === 'reject');
    expect(rejectRules.length).toBeGreaterThan(0);
    expect(rejectRules.every((r) => r.matches !== undefined)).toBe(true);
  });

  it('should allow most operations', () => {
    const allowAll = PermissivePolicy.rules.find((r) => r.tool === '*' && r.action === 'allow');
    expect(allowAll).toBeDefined();
  });
});


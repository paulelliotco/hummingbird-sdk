/**
 * JSON schemas for policy configuration
 */

export const PermissionRuleSchema = {
  type: 'object',
  properties: {
    tool: {
      type: 'string',
      description: 'Tool name or glob pattern',
    },
    matches: {
      type: 'object',
      description: 'Argument patterns to match',
      additionalProperties: {
        type: 'string',
      },
    },
    action: {
      type: 'string',
      enum: ['allow', 'ask', 'reject', 'delegate'],
      description: 'Action to take when rule matches',
    },
    to: {
      type: 'string',
      description: 'Delegate target (required if action is "delegate")',
    },
  },
  required: ['tool', 'action'],
  additionalProperties: false,
};

export const PolicyConfigSchema = {
  type: 'object',
  properties: {
    version: {
      type: 'string',
      description: 'Policy version',
    },
    rules: {
      type: 'array',
      items: PermissionRuleSchema,
      description: 'Permission rules',
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        workspace: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
  required: ['version', 'rules'],
  additionalProperties: false,
};

/**
 * Example policy configurations
 */
export const DefaultPolicy = {
  version: '1.0',
  rules: [
    // Allow safe read-only operations
    { tool: 'File.read', action: 'allow' },
    { tool: 'File.list', action: 'allow' },
    
    // Ask for write operations
    { tool: 'File.write', action: 'ask' },
    { tool: 'File.delete', action: 'ask' },
    
    // Ask for bash commands
    { tool: 'Bash', action: 'ask' },
    
    // Reject dangerous operations
    { tool: 'Bash', matches: { cmd: '*rm -rf*' }, action: 'reject' },
    { tool: 'Bash', matches: { cmd: '*git push --force*' }, action: 'reject' },
    
    // Default: ask for all other tools
    { tool: '*', action: 'ask' },
  ],
  metadata: {
    name: 'Default Policy',
    description: 'Safe defaults for development',
  },
};

export const StrictPolicy = {
  version: '1.0',
  rules: [
    // Only allow explicit read operations
    { tool: 'File.read', action: 'allow' },
    { tool: 'File.list', action: 'allow' },
    
    // Reject everything else
    { tool: '*', action: 'reject' },
  ],
  metadata: {
    name: 'Strict Policy',
    description: 'Minimal permissions for maximum security',
  },
};

export const PermissivePolicy = {
  version: '1.0',
  rules: [
    // Reject only truly dangerous operations
    { tool: 'Bash', matches: { cmd: '*rm -rf /*' }, action: 'reject' },
    { tool: 'Bash', matches: { cmd: '*format*' }, action: 'reject' },
    
    // Allow everything else
    { tool: '*', action: 'allow' },
  ],
  metadata: {
    name: 'Permissive Policy',
    description: 'Allow most operations with minimal friction',
  },
};


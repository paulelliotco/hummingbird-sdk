/**
 * Policy types (re-export from core for convenience)
 */

export type PermissionAction = 'allow' | 'ask' | 'reject' | 'delegate';

export interface PermissionRule {
  tool: string;
  matches?: Record<string, string>;
  action: PermissionAction;
  to?: string;
}


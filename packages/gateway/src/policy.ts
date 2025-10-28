/**
 * Policy management and evaluation
 */

import { PermissionEngine, DefaultPolicy, StrictPolicy, PermissivePolicy } from '@hummingbird/policy';
import type { GatewayConfig } from './config.js';
import type { AuthContext } from './auth.js';

export class PolicyManager {
  private engines = new Map<string, PermissionEngine>();

  constructor(private config: GatewayConfig) {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // Load default policies based on config
    const defaultPolicyConfig = this.getPolicyConfig(this.config.policy.defaultPolicy);
    const defaultEngine = new PermissionEngine(defaultPolicyConfig.rules);
    this.engines.set('default', defaultEngine);
  }

  private getPolicyConfig(policyName: string): any {
    switch (policyName) {
      case 'strict':
        return StrictPolicy;
      case 'permissive':
        return PermissivePolicy;
      default:
        return DefaultPolicy;
    }
  }

  /**
   * Get policy engine for a workspace
   */
  getEngine(auth: AuthContext): PermissionEngine {
    const workspaceId = auth.workspaceId || 'default';
    
    // Check for workspace-specific policy
    if (this.engines.has(workspaceId)) {
      return this.engines.get(workspaceId)!;
    }

    // Fall back to default
    return this.engines.get('default')!;
  }

  /**
   * Load workspace-specific policy
   */
  loadWorkspacePolicy(workspaceId: string, policy: any): void {
    const engine = new PermissionEngine(policy.rules);
    this.engines.set(workspaceId, engine);
  }

  /**
   * Check if IP is allowed
   */
  isIPAllowed(ip: string, auth: AuthContext): boolean {
    // Placeholder for IP allow-listing
    // In production, check against workspace-specific allow lists
    return true;
  }
}

export function createPolicyManager(config: GatewayConfig): PolicyManager {
  return new PolicyManager(config);
}


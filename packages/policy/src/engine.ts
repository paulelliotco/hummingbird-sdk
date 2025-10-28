/**
 * Permission engine for tool execution
 */

import type { PermissionRule, PermissionAction } from './types.js';
import { matchGlob, matchArgs } from './matcher.js';

export interface PermissionDecision {
  action: PermissionAction;
  delegateTo?: string;
  matchedRule?: PermissionRule;
}

export interface ToolInvocation {
  tool: string;
  args: Record<string, any>;
}

export class PermissionEngine {
  constructor(private rules: PermissionRule[] = []) {}

  /**
   * Evaluate a tool invocation against the permission rules
   */
  evaluate(invocation: ToolInvocation): PermissionDecision {
    for (const rule of this.rules) {
      if (this.matchesRule(invocation, rule)) {
        return {
          action: rule.action,
          delegateTo: rule.to,
          matchedRule: rule,
        };
      }
    }

    // Default: ask for permission
    return { action: 'ask' };
  }

  /**
   * Check if a tool invocation matches a permission rule
   */
  private matchesRule(invocation: ToolInvocation, rule: PermissionRule): boolean {
    // Check tool name match (supports glob patterns)
    if (!matchGlob(invocation.tool, rule.tool)) {
      return false;
    }

    // Check arg patterns if specified
    if (rule.matches) {
      if (!matchArgs(invocation.args, rule.matches)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add rules to the engine
   */
  addRules(rules: PermissionRule[]): void {
    this.rules.push(...rules);
  }

  /**
   * Replace all rules
   */
  setRules(rules: PermissionRule[]): void {
    this.rules = rules;
  }

  /**
   * Get current rules
   */
  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }
}

/**
 * Permission evaluator with callback support for 'ask' actions
 */
export class InteractivePermissionEngine extends PermissionEngine {
  constructor(
    rules: PermissionRule[],
    private askCallback?: (invocation: ToolInvocation) => Promise<boolean>
  ) {
    super(rules);
  }

  /**
   * Evaluate and potentially prompt user for permission
   */
  async evaluateInteractive(invocation: ToolInvocation): Promise<boolean> {
    const decision = this.evaluate(invocation);

    switch (decision.action) {
      case 'allow':
        return true;

      case 'reject':
        return false;

      case 'ask':
        if (this.askCallback) {
          return this.askCallback(invocation);
        }
        // Default to reject if no callback
        return false;

      case 'delegate':
        // For MVP, treat delegate as ask
        // In full implementation, this would invoke the delegate handler
        if (this.askCallback) {
          return this.askCallback(invocation);
        }
        return false;

      default:
        return false;
    }
  }
}


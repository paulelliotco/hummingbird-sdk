/**
 * @hummingbird/policy - Permission engine and security utilities
 */

export {
  PermissionEngine,
  InteractivePermissionEngine,
} from './engine.js';
export type { PermissionDecision, ToolInvocation } from './engine.js';

export { matchGlob, matchArgs, isMoreSpecific } from './matcher.js';

export {
  PermissionRuleSchema,
  PolicyConfigSchema,
  DefaultPolicy,
  StrictPolicy,
  PermissivePolicy,
} from './schemas.js';

export {
  redactSecrets,
  redactSecretsFromObject,
  containsSecrets,
  redactEnv,
} from './redaction.js';
export type { RedactionOptions } from './redaction.js';

export type { PermissionRule, PermissionAction } from './types.js';


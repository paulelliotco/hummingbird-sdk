/**
 * Hummingbird SDK - Core package
 * Provider-agnostic agents SDK for TypeScript
 */

// Public API
export { createAgent, registerAdapter, createAgentWithAdapter } from './createAgent.js';

// Types
export type {
  Agent,
  AgentOptions,
  AgentEvent,
  AgentError,
  Provider,
  ProviderAdapter,
  UserMessage,
  Attachment,
  ToolDefinition,
  ToolCall,
  ToolResult,
  ToolResults,
  Thread,
  ThreadRef,
  Message,
  HandoffFilters,
  ArtifactRef,
  JSONSchema,
  StructuredOutputConfig,
  PermissionRule,
  PermissionAction,
  MCPServerConfig,
  TelemetryConfig,
  ParallelTools,
  SystemEvent,
  AssistantEvent,
  ToolResultEvent,
  FinalEvent,
  ErrorEvent,
} from './types.js';

// Thread management
export { ThreadManager, InMemoryThreadStore } from './threads.js';
export type { ThreadStore } from './threads.js';

// Events
export {
  createSystemEvent,
  createAssistantEvent,
  createToolResultEvent,
  createFinalEvent,
  createErrorEvent,
  createAgentError,
  DeltaAccumulator,
} from './events.js';

// Structured outputs
export {
  compileSchema,
  CompiledSchema,
  toOpenAISchema,
  toAnthropicSchema,
  toGeminiSchema,
} from './structured.js';
export type { ValidationResult } from './structured.js';

// Agent implementation (for custom adapters)
export { AgentImpl } from './agent.js';


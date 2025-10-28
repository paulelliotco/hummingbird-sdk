/**
 * Core types for the Hummingbird SDK
 */

// ============================================================================
// Provider types
// ============================================================================

export type Provider = 'openai' | 'gemini' | 'anthropic';

export type ParallelTools = 'auto' | 'force' | 'disable';

// ============================================================================
// JSON Schema types (2020-12)
// ============================================================================

export interface JSONSchema {
  $schema?: string;
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  enum?: any[];
  const?: any;
  [key: string]: any;
}

export interface StructuredOutputConfig {
  schema: JSONSchema;
  strict?: boolean;
}

// ============================================================================
// Tool types
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  runtime?: 'mcp' | 'toolbox' | 'builtin' | 'http';
  handler?: (args: any) => Promise<any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface ToolResult {
  id: string;
  result?: any;
  error?: string;
}

export type ToolResults = ToolResult[];

// ============================================================================
// MCP types
// ============================================================================

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport?: 'stdio' | 'sse';
}

// ============================================================================
// Permission types
// ============================================================================

export type PermissionAction = 'allow' | 'ask' | 'reject' | 'delegate';

export interface PermissionRule {
  tool: string; // glob pattern or exact name
  matches?: Record<string, string>; // arg patterns
  action: PermissionAction;
  to?: string; // delegate target
}

// ============================================================================
// Thread types
// ============================================================================

export interface ThreadRef {
  id: string;
  visibility?: 'private' | 'workspace' | 'unlisted';
}

export interface Thread {
  id: string;
  createdBy: string;
  visibility: 'private' | 'workspace' | 'unlisted';
  messages: Message[];
  toolsUsed: string[];
  artifacts: ArtifactRef[];
  cost?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  otelTraceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResults;
  timestamp: Date;
}

export interface ArtifactRef {
  id: string;
  type: string;
  uri: string;
}

export interface HandoffFilters {
  includeMessages?: number; // last N messages
  includeTools?: string[]; // specific tool names
  excludeContext?: boolean;
}

// ============================================================================
// Telemetry types
// ============================================================================

export interface TelemetryConfig {
  enabled?: boolean;
  serviceName?: string;
  endpoint?: string;
  exportIntervalMs?: number;
}

// ============================================================================
// Agent options
// ============================================================================

export interface AgentOptions {
  provider: Provider;
  model: string;
  system?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  parallelTools?: ParallelTools;
  structured?: StructuredOutputConfig;
  tools?: ToolDefinition[];
  mcpServers?: MCPServerConfig[];
  toolboxPaths?: string[];
  cwd?: string;
  permissions?: PermissionRule[];
  telemetry?: TelemetryConfig;
  session?: ThreadRef | 'new';
  apiKey?: string;
  zeroRetention?: boolean; // provider-specific zero data retention
}

// ============================================================================
// Agent events
// ============================================================================

export type AgentEvent =
  | SystemEvent
  | AssistantEvent
  | ToolResultEvent
  | FinalEvent
  | ErrorEvent;

export interface SystemEvent {
  type: 'system';
  sessionId: string;
  tools: string[];
  model?: string;
}

export interface AssistantEvent {
  type: 'assistant';
  text?: string;
  toolCalls?: ToolCall[];
  delta?: boolean; // true if streaming delta
}

export interface ToolResultEvent {
  type: 'tool-result';
  results: ToolResults;
}

export interface FinalEvent {
  type: 'final';
  output?: any; // structured output if configured
  artifacts?: ArtifactRef[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface ErrorEvent {
  type: 'error';
  error: AgentError;
}

export interface AgentError {
  code: string;
  message: string;
  provider?: Provider;
  details?: any;
}

// ============================================================================
// User input types
// ============================================================================

export interface UserMessage {
  text: string;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'file' | 'image' | 'url';
  data: string | Buffer;
  mimeType?: string;
  filename?: string;
}

// ============================================================================
// Agent interface
// ============================================================================

export interface Agent {
  send(input: UserMessage | ToolResults): AsyncIterable<AgentEvent>;
  handoff(filters?: { lastN?: number; role?: 'user' | 'assistant' }): Agent;
  fork(): Agent;
  addTools(tools: ToolDefinition[]): void;
  getThread(): any; // Returns Thread class instance with getMessages(), setMetadata(), etc.
  getMetrics(): { totalRequests: number };
}

// ============================================================================
// Provider adapter interface
// ============================================================================

export interface ProviderAdapter {
  name: Provider;
  send(
    messages: Message[],
    options: AgentOptions
  ): AsyncIterable<AgentEvent>;
  supportsStructuredOutput(): boolean;
  supportsParallelTools(): boolean;
}


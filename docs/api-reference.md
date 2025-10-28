# API Reference

## Core API

### createAgent(options: AgentOptions): Agent

Create a new agent instance.

```typescript
import { createAgent, registerAdapter } from '@hummingbird/core';
import { OpenAIAdapter } from '@hummingbird/adapter-openai';

registerAdapter('openai', () => new OpenAIAdapter());

const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  system: 'You are a helpful assistant.',
  temperature: 0.7,
  tools: [/* tools */],
  permissions: [/* permission rules */],
});
```

### AgentOptions

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `'openai' \| 'gemini' \| 'anthropic'` | Provider to use |
| `model` | `string` | Model name |
| `system` | `string?` | System prompt |
| `temperature` | `number?` | Temperature (0-1) |
| `topP` | `number?` | Top-p sampling |
| `maxTokens` | `number?` | Max output tokens |
| `parallelTools` | `'auto' \| 'force' \| 'disable'?` | Parallel tool execution |
| `structured` | `StructuredOutputConfig?` | Structured output schema |
| `tools` | `ToolDefinition[]?` | Available tools |
| `mcpServers` | `MCPServerConfig[]?` | MCP servers |
| `toolboxPaths` | `string[]?` | Toolbox discovery paths |
| `permissions` | `PermissionRule[]?` | Tool permissions |
| `telemetry` | `TelemetryConfig?` | OpenTelemetry config |
| `session` | `ThreadRef \| 'new'?` | Thread session |
| `apiKey` | `string?` | Provider API key |
| `zeroRetention` | `boolean?` | Zero data retention |

### Agent Methods

#### send(input: UserMessage | ToolResults): AsyncIterable<AgentEvent>

Send a message or tool results to the agent.

```typescript
for await (const event of agent.send({ text: 'Hello!' })) {
  if (event.type === 'assistant' && event.text) {
    console.log(event.text);
  }
}
```

#### handoff(goal: string, filters?: HandoffFilters): Promise<ThreadRef>

Create a focused handoff thread.

```typescript
const newThread = await agent.handoff(
  'Debug the failing test',
  { includeMessages: 10 }
);
```

#### fork(): Promise<ThreadRef>

Fork the current thread.

```typescript
const forkedThread = await agent.fork();
```

#### addTools(tools: ToolDefinition[]): void

Add tools dynamically.

```typescript
agent.addTools([myCustomTool]);
```

### AgentEvent Types

```typescript
type AgentEvent =
  | { type: 'system'; sessionId: string; tools: string[] }
  | { type: 'assistant'; text?: string; toolCalls?: ToolCall[] }
  | { type: 'tool-result'; results: ToolResults }
  | { type: 'final'; output?: any; usage?: TokenUsage }
  | { type: 'error'; error: AgentError };
```

## Permissions

### PermissionRule

```typescript
interface PermissionRule {
  tool: string;           // Glob pattern or exact name
  matches?: Record<string, string>; // Argument patterns
  action: 'allow' | 'ask' | 'reject' | 'delegate';
  to?: string;            // Delegate target
}
```

### Examples

```typescript
const permissions = [
  // Allow safe reads
  { tool: 'File.read', action: 'allow' },
  
  // Ask for writes
  { tool: 'File.write', action: 'ask' },
  
  // Reject dangerous commands
  { tool: 'Bash', matches: { cmd: '*rm -rf*' }, action: 'reject' },
  
  // Default: ask
  { tool: '*', action: 'ask' },
];
```

## Structured Outputs

### StructuredOutputConfig

```typescript
interface StructuredOutputConfig {
  schema: JSONSchema;     // JSON Schema 2020-12
  strict?: boolean;       // Strict validation (OpenAI)
}
```

### Example

```typescript
const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  structured: {
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        items: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['summary', 'items']
    },
    strict: true
  }
});
```

## Threads & Handoff

### Thread Management

```typescript
import { ThreadManager } from '@hummingbird/core';

const manager = new ThreadManager();

// Create thread
const thread = await manager.create();

// Add message
await manager.addMessage(thread.id, {
  role: 'user',
  content: 'Hello',
  timestamp: new Date()
});

// Handoff
const newThread = await manager.handoff(
  thread.id,
  'Continue debugging',
  { includeMessages: 5 }
);
```

## Telemetry

### OpenTelemetry

```typescript
import { startAgentSpan, recordLLMResponse } from '@hummingbird/otel';

const span = startAgentSpan('agent.request', {
  sessionId: 'session-123',
  model: 'gpt-4',
  provider: 'openai'
});

// ... make LLM call ...

recordLLMResponse(span, {
  inputTokens: 100,
  outputTokens: 50,
  finishReason: 'stop'
});

span.end();
```

## Sub-Agents

Create specialized sub-agents:

```typescript
// Oracle: deep reasoning
const oracle = createAgent({
  provider: 'openai',
  model: 'gpt-5',
  temperature: 0.2,
});

// Librarian: code research
const librarian = createAgent({
  provider: 'anthropic',
  model: 'claude-4.5-sonnet',
  tools: [/* research tools */],
});
```


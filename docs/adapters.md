# Provider Adapters

## Overview

Hummingbird supports three major AI providers with unified semantics:

- **OpenAI** - Responses API with tools and structured outputs
- **Anthropic** - Messages API with strict tool ordering
- **Google Gemini** - Function calling and Live Tools

## OpenAI Adapter

### Features

- ✅ Streaming responses
- ✅ Multiple parallel tool calls
- ✅ Structured outputs (strict mode)
- ✅ Function calling

### Setup

```typescript
import { registerAdapter } from '@hummingbird/core';
import { OpenAIAdapter } from '@hummingbird/adapter-openai';

registerAdapter('openai', () => new OpenAIAdapter());
```

### Configuration

```typescript
const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  parallelTools: 'force', // Enable parallel tool calls
  structured: {
    schema: mySchema,
    strict: true, // Use OpenAI strict mode
  },
});
```

### Models

- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

## Anthropic Adapter

### Features

- ✅ Streaming responses
- ✅ Tool use with Messages API
- ✅ Configurable parallel tool control
- ✅ Automatic tool_result ordering

### Setup

```typescript
import { registerAdapter } from '@hummingbird/core';
import { AnthropicAdapter } from '@hummingbird/adapter-anthropic';

registerAdapter('anthropic', () => new AnthropicAdapter());
```

### Configuration

```typescript
const agent = createAgent({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
  parallelTools: 'disable', // Disable parallel tool calls
  maxTokens: 4096,
});
```

### Important Notes

- **Tool result ordering**: The adapter automatically ensures tool_result blocks immediately follow tool_use messages
- **System messages**: Handled via the `system` parameter, not in message list
- **Parallel tools**: Use `parallelTools: 'disable'` to prevent parallel execution

### Models

- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

## Gemini Adapter

### Features

- ✅ Streaming responses
- ✅ Function calling
- ✅ Live Tools sessions
- ✅ Tool re-declaration on reconnect

### Setup

```typescript
import { registerAdapter } from '@hummingbird/core';
import { GeminiAdapter } from '@hummingbird/adapter-gemini';

registerAdapter('gemini', () => new GeminiAdapter());
```

### Configuration

```typescript
const agent = createAgent({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
  tools: [/* function declarations */],
});
```

### Live Tools

Gemini Live API sessions maintain tool declarations across the session:

```typescript
const adapter = new GeminiAdapter();

// Tools are session-scoped
await adapter.reconnectWithTools([tool1, tool2]);
```

### Models

- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## Comparison

| Feature | OpenAI | Anthropic | Gemini |
|---------|--------|-----------|--------|
| Streaming | ✅ | ✅ | ✅ |
| Parallel Tools | ✅ Native | ⚙️ Configurable | ✅ Native |
| Structured Output | ✅ Strict mode | ⚙️ Post-validation | ⚙️ Function returns |
| Tool Calling | ✅ | ✅ | ✅ Function calling |
| Live Sessions | ❌ | ❌ | ✅ |

## Custom Adapters

Implement the `ProviderAdapter` interface:

```typescript
import type { ProviderAdapter, AgentOptions, Message, AgentEvent } from '@hummingbird/core';

export class CustomAdapter implements ProviderAdapter {
  name = 'custom';

  async *send(
    messages: Message[],
    options: AgentOptions
  ): AsyncIterable<AgentEvent> {
    // Your implementation
  }

  supportsStructuredOutput(): boolean {
    return true;
  }

  supportsParallelTools(): boolean {
    return true;
  }
}
```

Register your adapter:

```typescript
registerAdapter('custom', () => new CustomAdapter());
```


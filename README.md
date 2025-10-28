# Hummingbird SDK

Enterprise-grade, provider-agnostic Agents SDK for TypeScript.

## Features

- **Multi-provider support**: OpenAI, Anthropic, Gemini (including Live Tools)
- **Tooling**: Toolboxes, MCP client, built-in tools
- **Threads & handoff**: Persistent conversations with focused follow-ups
- **Structured outputs**: JSON Schema 2020-12 with validation and repair
- **Permissions**: Granular tool-level allow/ask/reject/delegate
- **Observability**: OpenTelemetry with GenAI semantic conventions
- **Enterprise**: Gateway with SSO, audit logs, secrets management

## Packages

- `@hummingbird/core` - Core SDK and orchestration
- `@hummingbird/adapter-openai` - OpenAI provider adapter
- `@hummingbird/adapter-anthropic` - Anthropic provider adapter
- `@hummingbird/adapter-gemini` - Google Gemini provider adapter
- `@hummingbird/tooling` - Toolboxes, MCP, and built-in tools
- `@hummingbird/policy` - Permissions engine
- `@hummingbird/otel` - OpenTelemetry helpers
- `@hummingbird/gateway` - Enterprise gateway server

## Quick Start

```typescript
import { createAgent } from '@hummingbird/core';

const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  system: 'You are a helpful assistant.',
});

for await (const event of agent.send({ text: 'Hello!' })) {
  if (event.type === 'assistant' && event.text) {
    console.log(event.text);
  }
}
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT


# Contributing to Hummingbird SDK

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Type Check

```bash
npm run typecheck
```

## Project Structure

```
packages/
  core/           - Core SDK and types
  policy/         - Permission engine
  tooling/        - Toolboxes, MCP, built-ins
  otel/          - OpenTelemetry helpers
  adapter-openai/ - OpenAI adapter
  adapter-anthropic/ - Anthropic adapter
  adapter-gemini/ - Gemini adapter
  gateway/       - Enterprise gateway server

examples/        - Usage examples
docs/           - Documentation
```

## Making Changes

1. Create a feature branch
2. Make your changes
3. Add tests
4. Run `npm run build` and `npm test`
5. Submit a pull request

## Adding a New Adapter

1. Create package in `packages/adapter-{provider}/`
2. Implement `ProviderAdapter` interface
3. Add tests
4. Update documentation
5. Add example

## Code Style

- TypeScript strict mode
- ESLint configured
- Prefer explicit types over `any`
- Document public APIs

## Testing

- Unit tests with Vitest
- Integration tests for adapters
- E2E tests for examples

## Versioning

We use semantic versioning:

- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

## License

MIT


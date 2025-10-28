# Agent SDK Guidelines

## Commands
- **Build**: `turbo run build` or `pnpm build`
- **Test all**: `vitest run` or `pnpm test`
- **Test single**: `vitest run packages/core/src/some.test.ts`
- **Test watch**: `pnpm test:watch`
- **Test coverage**: `pnpm test:coverage`
- **Lint**: `turbo run lint` or `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Clean**: `pnpm clean`

## Architecture
Monorepo with pnpm workspaces and Turbo orchestration. Provider-agnostic agents SDK with adapters for OpenAI, Anthropic, Gemini. Key packages: core (orchestration), adapter-* (providers), tooling (MCP/tools), policy (permissions), otel (observability), gateway (enterprise server).

## Code Style
- TypeScript strict mode with ES2022 target
- Imports: relative paths with `.js` extension for ES modules
- Naming: camelCase functions/vars, PascalCase types/interfaces
- Error handling: custom AgentError types, try/catch blocks
- ESLint: @typescript-eslint with no-explicit-any off, unused vars warn (ignore _ prefix)
- Formatting: consistent casing, declaration maps, source maps enabled

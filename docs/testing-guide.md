# Hummingbird SDK - Testing Guide

Comprehensive guide for testing the Hummingbird SDK implementation.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Coverage Requirements](#coverage-requirements)
- [CI Integration](#ci-integration)

## Overview

The Hummingbird SDK uses **Vitest** as its testing framework, providing fast unit tests, integration tests, and E2E scenarios across all packages.

### Test Levels

1. **Unit Tests** - Test individual functions and classes in isolation
2. **Integration Tests** - Test interactions between components
3. **E2E Tests** - Test complete workflows from user perspective

## Test Structure

```
agent-sdk/
├── packages/
│   ├── core/
│   │   └── src/__tests__/
│   │       ├── agent.test.ts
│   │       ├── events.test.ts
│   │       ├── threads.test.ts
│   │       └── integration.test.ts
│   ├── policy/
│   │   └── src/__tests__/
│   ├── tooling/
│   │   └── src/__tests__/
│   ├── otel/
│   │   └── src/__tests__/
│   ├── adapter-*/
│   │   └── src/__tests__/
│   └── gateway/
│       └── src/__tests__/
└── tests/
    ├── e2e/
    │   ├── openai-toolbox.test.ts
    │   ├── handoff.test.ts
    │   └── permissions.test.ts
    └── utils/
        ├── mocks.ts
        ├── fixtures.ts
        └── helpers.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific package tests
npm test -- packages/core

# Run E2E tests only
npm test -- tests/e2e

# Run specific test file
npm test -- packages/core/src/__tests__/agent.test.ts
```

### Coverage Reports

Coverage reports are generated in multiple formats:
- **Terminal**: Summary displayed after test run
- **HTML**: Open `coverage/index.html` in browser
- **LCOV**: For CI integration

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML coverage report
open coverage/index.html
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { PermissionEngine } from '../engine.js';

describe('PermissionEngine', () => {
  it('should allow tools with allow action', () => {
    const engine = new PermissionEngine([
      { tool: 'File.read', action: 'allow' }
    ]);
    
    const decision = engine.evaluate({ tool: 'File.read', args: {} });
    expect(decision.action).toBe('allow');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createAgent } from '@hummingbird/core';
import { MockAdapter } from '../utils/mocks.js';

describe('Agent Integration', () => {
  it('should handle full workflow', async () => {
    const agent = createAgent({
      provider: 'mock',
      model: 'test-model',
    });
    
    const events = await collectEvents(
      agent.send({ text: 'Hello' })
    );
    
    expect(events.length).toBeGreaterThan(0);
  });
});
```

### E2E Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createAgent } from '@hummingbird/core';

describe('E2E: OpenAI Workflow', () => {
  it('should execute complete agent workflow', async () => {
    const agent = createAgent({
      provider: 'openai', // or 'mock' for CI
      model: 'gpt-4',
      tools: [/* tools */],
    });
    
    const events = await collectEvents(
      agent.send({ text: 'User query' })
    );
    
    const final = getFinalEvent(events);
    expect(final).toBeDefined();
  });
});
```

## Test Utilities

### Mocks

Located in `tests/utils/mocks.ts`:

```typescript
import { MockAdapter, createMockTool } from '../utils/mocks.js';

// Mock adapter for testing without API calls
const adapter = new MockAdapter({ 
  responses: ['Test response'],
  toolCalls: [{ id: 'call_1', name: 'tool', arguments: {} }]
});

// Mock tools
const tool = createMockTool('test_tool', { result: 'success' });
const failingTool = createFailingTool('error_tool');
const asyncTool = createAsyncTool('slow_tool', 1000, { result: 'ok' });
```

### Fixtures

Located in `tests/utils/fixtures.ts`:

```typescript
import { sampleMessages, sampleToolCalls, validSchema } from '../utils/fixtures.js';

// Use predefined test data
const messages = sampleMessages;
const toolCalls = sampleToolCalls;
const schema = validSchema;
```

### Helpers

Located in `tests/utils/helpers.ts`:

```typescript
import { 
  collectEvents, 
  getFinalEvent, 
  createTempDir,
  createTestToolbox,
  withEnv 
} from '../utils/helpers.js';

// Collect all events from stream
const events = await collectEvents(agent.send({ text: 'test' }));

// Get final event
const final = getFinalEvent(events);

// Create temporary directory for file tests
const tempDir = await createTempDir();

// Create test toolbox
await createTestToolbox(tempDir, 'my_tool', 'Description', schema);

// Run with environment variables
await withEnv({ HB_TOOLBOX: '/path/to/tools' }, async () => {
  // test code
});
```

## Coverage Requirements

### Targets

| Package | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
| core | 90%+ | 85%+ | 90%+ | 90%+ |
| policy | 95%+ | 90%+ | 95%+ | 95%+ |
| tooling | 85%+ | 80%+ | 85%+ | 85%+ |
| otel | 80%+ | 75%+ | 80%+ | 80%+ |
| adapters | 85%+ | 80%+ | 85%+ | 85%+ |
| gateway | 80%+ | 75%+ | 80%+ | 80%+ |

### Critical Paths

All critical paths must have 100% coverage:

1. ✅ Agent creation → tool discovery → execution → response
2. ✅ Permission check → allow/reject/ask flow
3. ✅ Thread handoff with context extraction
4. ✅ Structured output validation → repair → success
5. ✅ Provider adapter streaming → event emission → completion
6. ✅ Gateway auth → policy check → execution → audit
7. ✅ MCP server connection → tool discovery → execution
8. ✅ Toolbox discovery → describe → run → result

## Best Practices

### 1. Test Organization

- Group related tests with `describe` blocks
- Use clear, descriptive test names
- One assertion per test when possible
- Setup and teardown with `beforeEach`/`afterEach`

### 2. Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### 3. Error Testing

```typescript
it('should throw on invalid input', () => {
  expect(() => dangerousFunction()).toThrow(ExpectedError);
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow();
});
```

### 4. Mock Cleanup

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 5. Timeout Handling

```typescript
it('should complete within timeout', async () => {
  // Vitest default is 5s
}, 10000); // Custom timeout: 10s
```

## CI Integration

Tests run automatically on:
- Every push
- Pull requests
- Before releases

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

### Coverage Gates

CI will fail if coverage drops below:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Troubleshooting

### Tests Timing Out

- Increase timeout: `it('test', async () => { ... }, 15000)`
- Check for missing `await` on promises
- Use `--testTimeout` flag: `npm test -- --testTimeout=15000`

### Flaky Tests

- Avoid timing-dependent assertions
- Use proper mocking for external dependencies
- Ensure proper cleanup in `afterEach`

### Coverage Not Generated

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage flag
npm test -- --coverage
```

### Mock Not Working

```typescript
// Ensure mocks are registered before use
import { vi } from 'vitest';

vi.mock('./module', () => ({
  function: vi.fn(() => 'mocked result')
}));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Reports](./coverage/index.html)
- [CI Dashboard](./.github/workflows/ci.yml)


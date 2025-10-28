import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@hummingbird/core': resolve(__dirname, './packages/core/src/index.ts'),
      '@hummingbird/policy': resolve(__dirname, './packages/policy/src/index.ts'),
      '@hummingbird/tooling': resolve(__dirname, './packages/tooling/src/index.ts'),
      '@hummingbird/otel': resolve(__dirname, './packages/otel/src/index.ts'),
      '@hummingbird/adapter-openai': resolve(__dirname, './packages/adapter-openai/src/index.ts'),
      '@hummingbird/adapter-anthropic': resolve(__dirname, './packages/adapter-anthropic/src/index.ts'),
      '@hummingbird/adapter-gemini': resolve(__dirname, './packages/adapter-gemini/src/index.ts'),
      '@hummingbird/gateway': resolve(__dirname, './packages/gateway/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests/utils/fixtures.ts',
        '**/__tests__/**',
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    include: ['packages/**/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});


/**
 * Mock implementations for testing
 */

import type {
  Provider,
  ProviderAdapter,
  AgentOptions,
  Message,
  AgentEvent,
  ToolDefinition,
} from '@hummingbird/core';
import { createAssistantEvent, createFinalEvent, createToolResultEvent } from '@hummingbird/core';

/**
 * Mock adapter for testing without real API calls
 */
export class MockAdapter implements ProviderAdapter {
  name: Provider = 'openai';
  private responses: string[] = [];
  private toolCallsToEmit: any[] = [];
  private shouldError = false;

  constructor(config?: {
    responses?: string[];
    toolCalls?: any[];
    shouldError?: boolean;
  }) {
    this.responses = config?.responses || ['Mock response'];
    this.toolCallsToEmit = config?.toolCalls || [];
    this.shouldError = config?.shouldError || false;
  }

  async *send(messages: Message[], options: AgentOptions): AsyncIterable<AgentEvent> {
    if (this.shouldError) {
      throw new Error('Mock adapter error');
    }

    // Emit responses
    for (const response of this.responses) {
      yield createAssistantEvent(response, undefined, true);
    }

    // Emit tool calls if any
    if (this.toolCallsToEmit.length > 0) {
      yield createAssistantEvent(undefined, this.toolCallsToEmit, false);
    }

    // Determine final output
    let finalOutput: any = undefined;
    let finalStructured: any = undefined;

    if (options.structured && this.responses.length > 0) {
      try {
        finalStructured = JSON.parse(this.responses[0]);
      } catch {
        finalOutput = this.responses[0];
      }
    } else if (this.responses.length > 0) {
      finalOutput = this.responses[0];
    }

    // Emit final event
    yield createFinalEvent(
      finalOutput,
      finalStructured,
      { inputTokens: 10, outputTokens: 20, totalTokens: 30 }
    );
  }

  supportsStructuredOutput(): boolean {
    return true;
  }

  supportsParallelTools(): boolean {
    return true;
  }
}

/**
 * Mock tool that returns a fixed result
 */
export function createMockTool(name: string, result: any): ToolDefinition {
  return {
    name,
    description: `Mock tool: ${name}`,
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
    },
    runtime: 'builtin',
    handler: async (args: any) => result,
  };
}

/**
 * Mock tool that fails
 */
export function createFailingTool(name: string): ToolDefinition {
  return {
    name,
    description: `Failing tool: ${name}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    runtime: 'builtin',
    handler: async () => {
      throw new Error(`Tool ${name} failed`);
    },
  };
}

/**
 * Mock tool with delay (for async testing)
 */
export function createAsyncTool(name: string, delayMs: number, result: any): ToolDefinition {
  return {
    name,
    description: `Async tool: ${name}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    runtime: 'builtin',
    handler: async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return result;
    },
  };
}

/**
 * Create a mock adapter factory
 */
export function createMockAdapterFactory(config?: any) {
  return () => new MockAdapter(config);
}


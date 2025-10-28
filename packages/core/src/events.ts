/**
 * Event utilities for streaming agent responses
 */

import type {
  AgentEvent,
  SystemEvent,
  AssistantEvent,
  ToolResultEvent,
  FinalEvent,
  ErrorEvent,
  AgentError,
  ToolResults,
  ToolCall,
  ArtifactRef,
} from './types.js';

export function createSystemEvent(
  sessionId: string,
  tools: string[],
  model?: string
): SystemEvent {
  return {
    type: 'system',
    sessionId,
    tools,
    model,
  };
}

export function createAssistantEvent(
  text?: string,
  toolCalls?: ToolCall[],
  done = false
): any {
  return {
    type: 'assistant',
    text,
    delta: text,
    toolCalls,
    done,
  };
}

export function createToolCallEvent(toolCalls: ToolCall[]): any {
  return {
    type: 'tool_call',
    toolCalls,
  };
}

export function createToolResultEvent(results: ToolResults): any {
  return {
    type: 'tool_result',
    results,
  };
}

export function createArtifactEvent(ref: string, content: string, artifactType: string): any {
  return {
    type: 'artifact',
    ref,
    content,
    artifactType,
  };
}

export function createFinalEvent(
  response?: any,
  structured?: any,
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens: number }
): any {
  return {
    type: 'final',
    response,
    output: response || structured,
    structured,
    artifacts: [],
    usage,
  };
}

export function createErrorEvent(error: string | AgentError, code?: string): any {
  if (typeof error === 'string') {
    return {
      type: 'error',
      error,
      code,
    };
  }
  return {
    type: 'error',
    error: error.message,
    code: error.code,
  };
}

/**
 * Accumulate all events into a final result
 */
export function accumulateEvents(events: AgentEvent[]): {
  text: string;
  toolCalls?: ToolCall[];
  artifacts?: ArtifactRef[];
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  structured?: any;
} {
  let text = '';
  let toolCalls: ToolCall[] = [];
  let artifacts: ArtifactRef[] = [];
  let usage: any;
  let structured: any;

  for (const event of events) {
    const eventAny = event as any;
    
    if (event.type === 'assistant' || eventAny.type === 'tool_call') {
      if (eventAny.delta) {
        // This is a delta chunk
        text += eventAny.delta;
      } else if (eventAny.text) {
        // This is complete text (accumulate it)
        text += eventAny.text;
      }
      if (eventAny.toolCalls) {
        toolCalls.push(...eventAny.toolCalls);
      }
    } else if (eventAny.type === 'artifact') {
      artifacts.push({
        ref: eventAny.ref,
        type: eventAny.artifactType,
        content: eventAny.content,
      } as any);
    } else if (event.type === 'final') {
      usage = eventAny.usage;
      structured = eventAny.structured || eventAny.output;
      if (eventAny.artifacts && Array.isArray(eventAny.artifacts)) {
        artifacts.push(...eventAny.artifacts);
      }
    }
  }

  return {
    text,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    artifacts: artifacts.length > 0 ? artifacts : undefined,
    usage,
    structured,
  };
}

export function createAgentError(
  code: string,
  message: string,
  provider?: string,
  details?: any
): AgentError {
  return {
    code,
    message,
    provider: provider as any,
    details,
  };
}

/**
 * Helper to accumulate streaming deltas
 */
export class DeltaAccumulator {
  private buffer = '';
  private toolCallsBuffer: Map<string, Partial<ToolCall>> = new Map();

  appendText(delta: string): void {
    this.buffer += delta;
  }

  appendToolCall(id: string, name?: string, argsDelta?: string): void {
    const existing = this.toolCallsBuffer.get(id) || { id, name: '', arguments: '' };
    if (name) existing.name = name;
    if (argsDelta) {
      existing.arguments = (existing.arguments || '') + argsDelta;
    }
    this.toolCallsBuffer.set(id, existing);
  }

  getText(): string {
    return this.buffer;
  }

  getToolCalls(): ToolCall[] {
    return Array.from(this.toolCallsBuffer.values()).map((tc) => ({
      id: tc.id!,
      name: tc.name!,
      arguments: tc.arguments ? JSON.parse(tc.arguments as string) : {},
    }));
  }

  clear(): void {
    this.buffer = '';
    this.toolCallsBuffer.clear();
  }
}


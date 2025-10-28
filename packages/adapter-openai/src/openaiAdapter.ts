/**
 * OpenAI provider adapter
 * Implements Responses API with streaming, tools, and structured outputs
 */

import OpenAI from 'openai';
import type {
  Provider,
  ProviderAdapter,
  AgentOptions,
  Message,
  AgentEvent,
  ToolCall,
} from '@hummingbird/core';
import {
  createAssistantEvent,
  createToolResultEvent,
  createFinalEvent,
  createErrorEvent,
  createAgentError,
  DeltaAccumulator,
  toOpenAISchema,
} from '@hummingbird/core';

export class OpenAIAdapter implements ProviderAdapter {
  name: Provider = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async *send(messages: Message[], options: AgentOptions): AsyncIterable<AgentEvent> {
    try {
      const openaiMessages = this.convertMessages(messages);
      const tools = this.convertTools(options.tools || []);
      
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: options.model,
        messages: openaiMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: true,
      };

      // Add tools if specified
      if (tools.length > 0) {
        requestParams.tools = tools;
        
        // Map parallelTools option
        if (options.parallelTools === 'disable') {
          requestParams.parallel_tool_calls = false;
        } else if (options.parallelTools === 'force') {
          requestParams.parallel_tool_calls = true;
        }
      }

      // Add structured output if specified
      if (options.structured) {
        requestParams.response_format = toOpenAISchema(options.structured);
      }

      const stream = await this.client.chat.completions.create(requestParams);
      
      const accumulator = new DeltaAccumulator();
      let usage: any = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (!delta) continue;

        // Text delta
        if (delta.content) {
          accumulator.appendText(delta.content);
          yield createAssistantEvent(delta.content, undefined, true);
        }

        // Tool calls delta
        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            accumulator.appendToolCall(
              toolCall.id || `tool_${toolCall.index}`,
              toolCall.function?.name,
              toolCall.function?.arguments
            );
          }
        }

        // Usage (comes at the end)
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      // Emit final assistant message with tool calls
      const toolCalls = accumulator.getToolCalls();
      if (toolCalls.length > 0) {
        yield createAssistantEvent(undefined, toolCalls, false);
      }

      // Emit final event
      yield createFinalEvent(
        options.structured ? JSON.parse(accumulator.getText()) : undefined,
        undefined,
        usage ? {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined
      );

    } catch (error: any) {
      yield createErrorEvent(
        createAgentError(
          'OPENAI_ERROR',
          error.message || 'OpenAI request failed',
          'openai',
          error
        )
      );
    }
  }

  supportsStructuredOutput(): boolean {
    return true;
  }

  supportsParallelTools(): boolean {
    return true;
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content || '',
        };
      } else if (msg.role === 'assistant') {
        const message: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
          role: 'assistant',
          content: msg.content || null,
        };
        
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          message.tool_calls = msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }
        
        return message;
      } else if (msg.role === 'tool') {
        // Tool results must come as separate messages
        return msg.toolResults?.map((result) => ({
          role: 'tool' as const,
          tool_call_id: result.id,
          content: result.error || JSON.stringify(result.result),
        })) || [];
      } else {
        return {
          role: 'system',
          content: msg.content || '',
        };
      }
    }).flat();
  }

  private convertTools(tools: any[]): OpenAI.Chat.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }
}


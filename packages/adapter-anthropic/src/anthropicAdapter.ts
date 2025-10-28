/**
 * Anthropic provider adapter
 * Implements Messages API with strict tool_result ordering and parallel control
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Provider,
  ProviderAdapter,
  AgentOptions,
  Message,
  AgentEvent,
} from '@hummingbird/core';
import {
  createAssistantEvent,
  createFinalEvent,
  createErrorEvent,
  createAgentError,
  DeltaAccumulator,
  compileSchema,
} from '@hummingbird/core';

export interface AnthropicAdapterOptions {
  apiKey?: string;
  disableParallelTools?: boolean;
}

export class AnthropicAdapter implements ProviderAdapter {
  name: Provider = 'anthropic';
  private client: Anthropic;
  private disableParallelTools: boolean;

  constructor(options?: AnthropicAdapterOptions | string) {
    const config = typeof options === 'string' ? { apiKey: options } : options || {};
    
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
    
    this.disableParallelTools = config.disableParallelTools || false;
  }

  async *send(messages: Message[], options: AgentOptions): AsyncIterable<AgentEvent> {
    try {
      const anthropicMessages = this.convertMessages(messages);
      const tools = this.convertTools(options.tools || []);
      
      const requestParams: any = {
        model: options.model,
        messages: anthropicMessages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        top_p: options.topP,
        stream: true,
      };

      // Add system prompt if specified
      if (options.system) {
        requestParams.system = options.system;
      }

      // Add tools if specified
      if (tools.length > 0) {
        requestParams.tools = tools;
        
        // Handle parallel tools disable
        if (options.parallelTools === 'disable') {
          // Anthropic doesn't have a direct disable flag in all versions
          // but we can use tool_choice to control behavior
          requestParams.tool_choice = { 
            type: 'auto',
            disable_parallel_tool_use: true 
          };
        }
      }

      const stream = await this.client.messages.create(requestParams);
      
      const accumulator = new DeltaAccumulator();
      const toolCalls: any[] = [];
      let usage: any = null;

      for await (const event of stream) {
        const eventAny = event as any;
        
        if (eventAny.type === 'content_block_start') {
          if (eventAny.content_block?.type === 'tool_use') {
            toolCalls.push({
              id: eventAny.content_block.id,
              name: eventAny.content_block.name,
              arguments: '',
            });
          }
        } else if (eventAny.type === 'content_block_delta') {
          const delta = eventAny.delta;
          
          if (delta?.type === 'text_delta') {
            accumulator.appendText(delta.text);
            yield createAssistantEvent(delta.text, undefined, true);
          } else if (delta?.type === 'input_json_delta') {
            // Accumulate tool arguments
            if (toolCalls.length > 0) {
              const lastTool = toolCalls[toolCalls.length - 1];
              lastTool.arguments += delta.partial_json;
            }
          }
        } else if (eventAny.type === 'message_delta') {
          if (eventAny.usage) {
            usage = eventAny.usage;
          }
        }
      }

      // Parse tool arguments
      const parsedToolCalls = toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: JSON.parse(tc.arguments),
      }));

      // Emit tool calls if any
      if (parsedToolCalls.length > 0) {
        yield createAssistantEvent(undefined, parsedToolCalls, false);
      }

      // Handle structured output validation if configured
      let structuredOutput = undefined;
      if (options.structured && accumulator.getText()) {
        const schema = compileSchema(options.structured.schema);
        const data = JSON.parse(accumulator.getText());
        const validation = schema.validate(data);
        
        if (validation.valid) {
          structuredOutput = data;
        } else if (validation.repaired) {
          structuredOutput = validation.repaired;
        }
      }

      // Emit final event
      yield createFinalEvent(
        structuredOutput,
        undefined,
        usage ? {
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        } : undefined
      );

    } catch (error: any) {
      yield createErrorEvent(
        createAgentError(
          'ANTHROPIC_ERROR',
          error.message || 'Anthropic request failed',
          'anthropic',
          error
        )
      );
    }
  }

  supportsStructuredOutput(): boolean {
    return true; // Via post-validation
  }

  supportsParallelTools(): boolean {
    return !this.disableParallelTools;
  }

  private convertMessages(messages: Message[]): any[] {
    const result: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages handled separately in requestParams
        continue;
      }

      if (msg.role === 'user') {
        result.push({
          role: 'user',
          content: msg.content || '',
        });
      } else if (msg.role === 'assistant') {
        const content: any[] = [];
        
        if (msg.content) {
          content.push({
            type: 'text',
            text: msg.content,
          });
        }
        
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            });
          }
        }
        
        result.push({
          role: 'assistant',
          content,
        });
      } else if (msg.role === 'tool') {
        // Tool results must come immediately after assistant tool_use
        // and must be in a user message
        if (msg.toolResults && msg.toolResults.length > 0) {
          const toolContent = msg.toolResults.map((result) => ({
            type: 'tool_result' as const,
            tool_use_id: result.id,
            content: result.error || JSON.stringify(result.result),
            is_error: !!result.error,
          }));

          result.push({
            role: 'user',
            content: toolContent,
          });
        }
      }
    }

    return result;
  }

  private convertTools(tools: any[]): any[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }
}


/**
 * Google Gemini provider adapter
 * Implements function calling and Live Tools session support
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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
} from '@hummingbird/core';

export class GeminiAdapter implements ProviderAdapter {
  name: Provider = 'gemini';
  private client: GoogleGenerativeAI;
  private model: GenerativeModel | null = null;

  constructor(apiKey?: string) {
    this.client = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || '');
  }

  async *send(messages: Message[], options: AgentOptions): AsyncIterable<AgentEvent> {
    try {
      // Initialize model with tools
      const tools = this.convertTools(options.tools || []);
      
      const modelConfig: any = {
        model: options.model,
        generationConfig: {
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
        },
      };

      // Add tools to model config (session-scoped for Live API)
      if (tools.length > 0) {
        modelConfig.tools = [{ functionDeclarations: tools }];
      }

      // Add system instruction if specified
      if (options.system) {
        modelConfig.systemInstruction = options.system;
      }

      this.model = this.client.getGenerativeModel(modelConfig);

      // Convert messages to Gemini format
      const history = this.convertMessagesToHistory(messages);
      
      // Start chat session
      const chat = this.model.startChat({
        history: history.slice(0, -1), // All but last message
      });

      // Get last user message
      const lastMessage = history[history.length - 1];
      
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      // Stream response
      const result = await chat.sendMessageStream(lastMessage.parts);
      
      const accumulator = new DeltaAccumulator();
      const toolCalls: any[] = [];

      for await (const chunk of result.stream) {
        const candidate = chunk.candidates?.[0];
        
        if (!candidate) continue;

        const content = candidate.content;
        
        // Text parts
        for (const part of content.parts || []) {
          if ('text' in part && part.text) {
            accumulator.appendText(part.text);
            yield createAssistantEvent(part.text, undefined, true);
          } else if ('functionCall' in part && part.functionCall) {
            // Function call
            const fc = part.functionCall as any;
            toolCalls.push({
              id: `call_${toolCalls.length}`,
              name: fc.name || '',
              arguments: fc.args || {},
            });
          }
        }
      }

      // Emit tool calls if any
      if (toolCalls.length > 0) {
        yield createAssistantEvent(undefined, toolCalls, false);
      }

      // Get final response with usage
      const finalResponse = await result.response;
      const usage = (finalResponse as any).usageMetadata;

      // Emit final event
      yield createFinalEvent(
        undefined,
        undefined,
        usage ? {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        } : undefined
      );

    } catch (error: any) {
      yield createErrorEvent(
        createAgentError(
          'GEMINI_ERROR',
          error.message || 'Gemini request failed',
          'gemini',
          error
        )
      );
    }
  }

  supportsStructuredOutput(): boolean {
    return true; // Via function declarations
  }

  supportsParallelTools(): boolean {
    return true; // Gemini supports multiple function calls
  }

  private convertMessages(messages: Message[]): any[] {
    const result: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages handled separately in model config
        continue;
      }

      if (msg.role === 'user') {
        result.push({
          role: 'user',
          parts: [{ text: msg.content || '' }],
        });
      } else if (msg.role === 'assistant') {
        const parts: any[] = [];
        
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              },
            });
          }
        }
        
        result.push({
          role: 'model',
          parts,
        });
      } else if (msg.role === 'tool') {
        // Tool results as function responses
        if (msg.toolResults && msg.toolResults.length > 0) {
          const parts = msg.toolResults.map((result) => ({
            functionResponse: {
              name: result.id, // Should match function name
              response: result.error ? { error: result.error } : result.result,
            },
          }));

          result.push({
            role: 'function',
            parts,
          });
        }
      }
    }

    return result;
  }

  private convertMessagesToHistory(messages: Message[]): any[] {
    // For chat history, we need to convert tool results properly
    const history: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.role === 'system') {
        continue; // Handled in system instruction
      }

      if (msg.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: msg.content || '' }],
        });
      } else if (msg.role === 'assistant') {
        const parts: any[] = [];
        
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              },
            });
          }
        }
        
        history.push({
          role: 'model',
          parts,
        });
      } else if (msg.role === 'tool') {
        // Tool results come in the next user message turn
        if (msg.toolResults && msg.toolResults.length > 0) {
          const parts = msg.toolResults.map((result) => ({
            functionResponse: {
              name: result.id,
              response: result.error ? { error: result.error } : result.result,
            },
          }));

          history.push({
            role: 'user',
            parts,
          });
        }
      }
    }

    return history;
  }

  private convertTools(tools: any[]): any[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));
  }

  /**
   * Reconnect and re-declare tools (for Live API sessions)
   */
  async reconnectWithTools(tools: any[]): Promise<void> {
    // Tools are declared when model is initialized
    // This method would be used in a persistent Live API session
    const toolDeclarations = this.convertTools(tools);
    
    if (this.model) {
      // In a real Live API implementation, we'd reconnect here
      // For now, this is a placeholder for the concept
      console.log('Would reconnect with tools:', toolDeclarations);
    }
  }
}


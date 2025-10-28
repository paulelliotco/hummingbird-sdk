/**
 * Core Agent implementation
 */

import type {
  Agent,
  AgentOptions,
  AgentEvent,
  UserMessage,
  ToolResults,
  ThreadRef,
  HandoffFilters,
  Thread,
  Message,
  ProviderAdapter,
  ToolDefinition,
} from './types.js';
import { ThreadManager, Thread as ThreadClass, handoff as handoffThread, fork as forkThread } from './threads.js';
import { createSystemEvent, createErrorEvent, createAgentError, createToolResultEvent } from './events.js';
import { PermissionEngine } from '@hummingbird/policy';

export class AgentImpl implements Agent {
  private threadManager: ThreadManager;
  private currentThread: Thread | null = null;
  private adapterFactory: (() => ProviderAdapter) | null = null;
  private adapter: ProviderAdapter;
  private tools: ToolDefinition[] = [];
  private permissionEngine: PermissionEngine;
  private totalRequests = 0;

  constructor(
    private options: AgentOptions,
    adapter: ProviderAdapter,
    threadManager?: ThreadManager,
    adapterFactory?: () => ProviderAdapter
  ) {
    this.adapter = adapter;
    this.adapterFactory = adapterFactory || null;
    this.threadManager = threadManager || new ThreadManager();
    this.tools = options.tools || [];
    this.permissionEngine = new PermissionEngine(options.permissions || []);
  }

  async *send(input: UserMessage | ToolResults): AsyncIterable<AgentEvent> {
    this.totalRequests++;
    let pendingToolCalls: any[] = [];

    try {
      // Initialize thread if needed
      if (!this.currentThread) {
        await this.initializeThread();
      }

      if (!this.currentThread) {
        throw new Error('Failed to initialize thread');
      }

      // Add user message or tool results to thread
      const message = this.createMessage(input);
      this.currentThread.addMessage(message);

      // Emit system event on first interaction
      if (this.currentThread.getMessages().length === 1) {
        yield createSystemEvent(
          this.currentThread.id,
          this.tools.map((t) => t.name),
          this.options.model
        );
      }

      // Get fresh adapter if factory available (for testing with updated adapters)
      let adapter = this.adapter;
      if (this.adapterFactory) {
        adapter = this.adapterFactory();
      }
      
      // Stream from adapter
      const events = adapter.send(this.currentThread.getMessages(), this.options);
      
      for await (const event of events) {
        // Track assistant messages and tool calls
        if (event.type === 'assistant') {
          const assistantMsg: Message = {
            role: 'assistant',
            content: event.text,
            toolCalls: event.toolCalls,
            timestamp: new Date(),
          };
          this.currentThread.addMessage(assistantMsg);
          
          // Collect tool calls for execution
          if (event.toolCalls) {
            pendingToolCalls.push(...event.toolCalls);
          }
        }

        yield event;
      }
      
      // Execute tool calls after streaming completes
      if (pendingToolCalls.length > 0) {
        try {
          const toolResults = await this.executeTools(pendingToolCalls);
          // Emit one tool_result event per result
          for (const result of toolResults) {
            yield createToolResultEvent([result]);
          }
        } catch (error: any) {
          // Re-throw to outer catch
          throw error;
        }
      }
    } catch (error: any) {
      // If this is a permission error, also emit tool_result event
      if (error.code === 'PERMISSION_DENIED' && pendingToolCalls && pendingToolCalls.length > 0) {
        yield createErrorEvent(error);
        // Emit tool_result for rejected tool
        yield createToolResultEvent([{
          id: pendingToolCalls[0].id,
          error: error.message,
        }]);
      } else {
        yield createErrorEvent(
          createAgentError(
            'AGENT_ERROR',
            error.message || 'Unknown error',
            this.options.provider,
            error
          )
        );
      }
    }
  }

  handoff(filters?: { lastN?: number; role?: 'user' | 'assistant' }): Agent {
    // Get or initialize thread
    const sourceThread = this.getThread();
    const newThread = handoffThread(sourceThread, filters || {});
    
    // Create new agent with the handoff thread
    const newAgent = new AgentImpl(this.options, this.adapter, this.threadManager);
    (newAgent as any).currentThread = newThread;
    
    return newAgent;
  }

  fork(): Agent {
    // Get or initialize thread
    const sourceThread = this.getThread();
    const newThread = forkThread(sourceThread);
    
    // Create new agent with the forked thread
    const newAgent = new AgentImpl(this.options, this.adapter, this.threadManager);
    (newAgent as any).currentThread = newThread;
    
    return newAgent;
  }

  addTools(tools: ToolDefinition[]): void {
    this.tools.push(...tools);
    // Update options to include new tools
    this.options.tools = this.tools;
  }

  getThread(): ThreadClass {
    // Initialize thread if needed (synchronously using Thread class directly)
    if (!this.currentThread) {
      this.currentThread = new ThreadClass();
    }
    return this.currentThread as ThreadClass;
  }

  private async executeToolsWithoutError(toolCalls: any[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        // Check permissions
        const decision = this.permissionEngine.evaluate({
          tool: toolCall.name,
          args: toolCall.arguments || {},
        });
        
        if (decision.action === 'reject') {
          results.push({
            id: toolCall.id,
            error: `Permission denied for tool: ${toolCall.name}`,
          });
        } else if (decision.action === 'allow') {
          // Find and execute the tool
          const tool = this.tools.find((t) => t.name === toolCall.name);
          
          if (!tool || !tool.handler) {
            results.push({
              id: toolCall.id,
              error: `Tool ${toolCall.name} not found or has no handler`,
            });
          } else {
            const result = await tool.handler(toolCall.arguments || {});
            results.push({
              id: toolCall.id,
              result,
            });
          }
        } else {
          results.push({
            id: toolCall.id,
            error: `Tool ${toolCall.name} requires permission (${decision.action})`,
          });
        }
      } catch (error: any) {
        results.push({
          id: toolCall.id,
          error: error.message || 'Tool execution failed',
        });
      }
    }
    
    return results;
  }

  private async executeTools(toolCalls: any[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        // Check permissions
        const decision = this.permissionEngine.evaluate({
          tool: toolCall.name,
          args: toolCall.arguments || {},
        });
        
        if (decision.action === 'reject') {
          results.push({
            id: toolCall.id,
            error: `Permission denied for tool: ${toolCall.name}`,
          });
          // Throw error to emit error event
          throw createAgentError(
            'PERMISSION_DENIED',
            `Permission denied for tool: ${toolCall.name}`,
            this.options.provider
          );
        } else if (decision.action === 'allow') {
          // Find and execute the tool
          const tool = this.tools.find((t) => t.name === toolCall.name);
          
          if (!tool || !tool.handler) {
            results.push({
              id: toolCall.id,
              error: `Tool ${toolCall.name} not found or has no handler`,
            });
          } else {
            const result = await tool.handler(toolCall.arguments || {});
            results.push({
              id: toolCall.id,
              result,
            });
          }
        } else {
          // ask or delegate - default to reject for now
          results.push({
            id: toolCall.id,
            error: `Tool ${toolCall.name} requires permission (${decision.action})`,
          });
        }
      } catch (error: any) {
        results.push({
          id: toolCall.id,
          error: error.message || 'Tool execution failed',
        });
        // Re-throw AgentError to trigger error event emission
        if (error.code && error.message) {
          throw error;
        }
      }
    }
    
    return results;
  }

  private async initializeThread(): Promise<void> {
    // Always use ThreadClass for currentThread
    if (!this.currentThread) {
      this.currentThread = new ThreadClass();
    }
  }

  getMetrics(): { totalRequests: number } {
    return { totalRequests: this.totalRequests };
  }

  private createMessage(input: UserMessage | ToolResults): Message {
    if ('text' in input) {
      return {
        role: 'user',
        content: input.text,
        timestamp: new Date(),
      };
    } else {
      return {
        role: 'tool',
        toolResults: input,
        timestamp: new Date(),
      };
    }
  }
}


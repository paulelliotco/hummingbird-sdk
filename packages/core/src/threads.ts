/**
 * Thread management with handoff and fork capabilities
 */

import { randomUUID } from 'crypto';
import type {
  Thread as ThreadType,
  ThreadRef,
  Message,
  HandoffFilters,
  ArtifactRef,
} from './types.js';

/**
 * Thread class for managing conversation history
 */
export class Thread {
  public id: string;
  private messages: Message[] = [];
  private metadata: Map<string, any> = new Map();
  
  constructor(id?: string) {
    this.id = id || randomUUID();
  }
  
  addMessage(message: Message): void {
    this.messages.push(message);
  }
  
  getMessages(): Message[] {
    return [...this.messages];
  }
  
  getMessagesByRole(role: 'user' | 'assistant' | 'system'): Message[] {
    return this.messages.filter((m) => m.role === role);
  }
  
  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }
  
  setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }
  
  getMetadata(key: string): any {
    return this.metadata.get(key);
  }
  
  export(): any {
    const metadataObj: any = {};
    for (const [key, value] of this.metadata.entries()) {
      metadataObj[key] = value;
    }
    
    return {
      id: this.id,
      messages: this.messages,
      metadata: metadataObj,
    };
  }
  
  static import(data: any): Thread {
    const thread = new Thread(data.id);
    thread.messages = data.messages || [];
    
    if (data.metadata) {
      for (const [key, value] of Object.entries(data.metadata)) {
        thread.metadata.set(key, value);
      }
    }
    
    return thread;
  }
}

/**
 * Create a handoff thread with focused context
 */
export function handoff(sourceThread: Thread, options: { lastN?: number; role?: 'user' | 'assistant' }): Thread {
  const newThread = new Thread();
  
  // Copy metadata
  for (const [key, value] of (sourceThread as any).metadata.entries()) {
    newThread.setMetadata(key, value);
  }
  
  // Set parent thread ID
  newThread.setMetadata('parentThreadId', sourceThread.id);
  
  // Extract messages based on options
  let messages = sourceThread.getMessages();
  
  if (options.role) {
    messages = messages.filter((m) => m.role === options.role);
  }
  
  if (options.lastN !== undefined) {
    messages = messages.slice(-options.lastN);
  }
  
  // Add filtered messages to new thread
  for (const msg of messages) {
    newThread.addMessage(msg);
  }
  
  return newThread;
}

/**
 * Fork a thread (create exact copy)
 */
export function fork(sourceThread: Thread): Thread {
  const newThread = new Thread();
  
  // Copy all messages
  for (const msg of sourceThread.getMessages()) {
    newThread.addMessage(msg);
  }
  
  // Copy metadata
  for (const [key, value] of (sourceThread as any).metadata.entries()) {
    newThread.setMetadata(key, value);
  }
  
  // Set parent thread ID
  newThread.setMetadata('parentThreadId', sourceThread.id);
  
  return newThread;
}

export interface ThreadStore {
  get(id: string): Promise<ThreadType | null>;
  save(thread: ThreadType): Promise<void>;
  list(filters?: { createdBy?: string; visibility?: string }): Promise<ThreadType[]>;
  delete(id: string): Promise<void>;
}

/**
 * In-memory thread store (default implementation)
 */
export class InMemoryThreadStore implements ThreadStore {
  private threads = new Map<string, ThreadType>();

  async get(id: string): Promise<ThreadType | null> {
    return this.threads.get(id) || null;
  }

  async save(thread: ThreadType): Promise<void> {
    this.threads.set(thread.id, thread);
  }

  async list(filters?: { createdBy?: string; visibility?: string }): Promise<ThreadType[]> {
    let threads = Array.from(this.threads.values());
    
    if (filters?.createdBy) {
      threads = threads.filter((t) => t.createdBy === filters.createdBy);
    }
    if (filters?.visibility) {
      threads = threads.filter((t) => t.visibility === filters.visibility);
    }
    
    return threads;
  }

  async delete(id: string): Promise<void> {
    this.threads.delete(id);
  }
}

/**
 * Thread manager with handoff and fork capabilities
 */
export class ThreadManager {
  constructor(
    private store: ThreadStore = new InMemoryThreadStore(),
    private userId = 'default-user'
  ) {}

  async create(ref?: ThreadRef): Promise<ThreadType> {
    const thread: ThreadType = {
      id: ref?.id || randomUUID(),
      createdBy: this.userId,
      visibility: ref?.visibility || 'private',
      messages: [],
      toolsUsed: [],
      artifacts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.store.save(thread);
    return thread;
  }

  async get(id: string): Promise<ThreadType | null> {
    return this.store.get(id);
  }

  async addMessage(threadId: string, message: Message): Promise<void> {
    const thread = await this.store.get(threadId);
    if (!thread) throw new Error(`Thread ${threadId} not found`);

    thread.messages.push(message);
    thread.updatedAt = new Date();
    
    // Track tools used
    if (message.toolCalls) {
      for (const call of message.toolCalls) {
        if (!thread.toolsUsed.includes(call.name)) {
          thread.toolsUsed.push(call.name);
        }
      }
    }

    await this.store.save(thread);
  }

  async updateCost(
    threadId: string,
    cost: { inputTokens: number; outputTokens: number; totalTokens: number }
  ): Promise<void> {
    const thread = await this.store.get(threadId);
    if (!thread) throw new Error(`Thread ${threadId} not found`);

    if (!thread.cost) {
      thread.cost = cost;
    } else {
      thread.cost.inputTokens += cost.inputTokens;
      thread.cost.outputTokens += cost.outputTokens;
      thread.cost.totalTokens += cost.totalTokens;
    }

    thread.updatedAt = new Date();
    await this.store.save(thread);
  }

  async addArtifact(threadId: string, artifact: ArtifactRef): Promise<void> {
    const thread = await this.store.get(threadId);
    if (!thread) throw new Error(`Thread ${threadId} not found`);

    thread.artifacts.push(artifact);
    thread.updatedAt = new Date();
    await this.store.save(thread);
  }

  /**
   * Handoff: create a new focused thread from the current one
   * Extracts relevant context without lossy compaction
   */
  async handoff(
    sourceThreadId: string,
    goal: string,
    filters?: HandoffFilters
  ): Promise<ThreadRef> {
    const sourceThread = await this.store.get(sourceThreadId);
    if (!sourceThread) throw new Error(`Source thread ${sourceThreadId} not found`);

    // Create new thread
    const newThread = await this.create({
      id: randomUUID(),
      visibility: sourceThread.visibility,
    });

    // Extract context based on filters
    let contextMessages = sourceThread.messages;

    if (filters?.includeMessages !== undefined) {
      // Take last N messages
      contextMessages = contextMessages.slice(-filters.includeMessages);
    }

    if (filters?.includeTools && filters.includeTools.length > 0) {
      // Filter to messages involving specific tools
      contextMessages = contextMessages.filter((msg) => {
        if (msg.toolCalls) {
          return msg.toolCalls.some((tc) => filters.includeTools!.includes(tc.name));
        }
        return true; // Keep non-tool messages
      });
    }

    if (!filters?.excludeContext) {
      // Add context messages to new thread
      for (const msg of contextMessages) {
        await this.addMessage(newThread.id, msg);
      }
    }

    // Add handoff goal as first user message
    await this.addMessage(newThread.id, {
      role: 'user',
      content: goal,
      timestamp: new Date(),
    });

    return { id: newThread.id, visibility: newThread.visibility };
  }

  /**
   * Fork: create an exact copy of the current thread
   */
  async fork(sourceThreadId: string): Promise<ThreadRef> {
    const sourceThread = await this.store.get(sourceThreadId);
    if (!sourceThread) throw new Error(`Source thread ${sourceThreadId} not found`);

    const newThread: ThreadType = {
      ...sourceThread,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [...sourceThread.messages],
      toolsUsed: [...sourceThread.toolsUsed],
      artifacts: [...sourceThread.artifacts],
    };

    await this.store.save(newThread);
    return { id: newThread.id, visibility: newThread.visibility };
  }

  /**
   * List threads
   */
  async list(filters?: { visibility?: string }): Promise<ThreadType[]> {
    return this.store.list({ createdBy: this.userId, ...filters });
  }

  /**
   * Delete thread
   */
  async delete(threadId: string): Promise<void> {
    await this.store.delete(threadId);
  }
}


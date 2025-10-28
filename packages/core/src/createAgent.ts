/**
 * Factory function to create agents
 */

import type { Agent, AgentOptions, ProviderAdapter } from './types.js';
import { AgentImpl } from './agent.js';
import { ThreadManager } from './threads.js';

// Registry for provider adapters
const adapterRegistry = new Map<string, () => ProviderAdapter>();

/**
 * Register a provider adapter
 */
export function registerAdapter(
  provider: string,
  factory: () => ProviderAdapter
): boolean {
  adapterRegistry.set(provider, factory);
  return true;
}

/**
 * Create an agent with the specified options
 */
export function createAgent(options: AgentOptions): Agent {
  const adapterFactory = adapterRegistry.get(options.provider);
  
  if (!adapterFactory) {
    throw new Error(
      `Provider '${options.provider}' not registered. ` +
      `Available providers: ${Array.from(adapterRegistry.keys()).join(', ')}`
    );
  }

  const adapter = adapterFactory();
  const threadManager = new ThreadManager();

  return new AgentImpl(options, adapter, threadManager, adapterFactory);
}

/**
 * Create an agent with a custom adapter (for testing or custom providers)
 */
export function createAgentWithAdapter(
  options: AgentOptions,
  adapter: ProviderAdapter
): Agent {
  const threadManager = new ThreadManager();
  return new AgentImpl(options, adapter, threadManager);
}


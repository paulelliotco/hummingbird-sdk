/**
 * Test helper functions
 */

import type { AgentEvent } from '@hummingbird/core';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

/**
 * Collect all events from an async iterable
 */
export async function collectEvents(
  stream: AsyncIterable<AgentEvent>
): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

/**
 * Find events by type
 */
export function filterEventsByType<T extends AgentEvent['type']>(
  events: AgentEvent[],
  type: T
): Extract<AgentEvent, { type: T }>[] {
  return events.filter((e) => e.type === type) as Extract<AgentEvent, { type: T }>[];
}

/**
 * Get the final event
 */
export function getFinalEvent(events: AgentEvent[]) {
  return events.find((e) => e.type === 'final');
}

/**
 * Check if events contain an error
 */
export function hasError(events: AgentEvent[]): boolean {
  return events.some((e) => e.type === 'error');
}

/**
 * Create a temporary directory for tests
 */
export async function createTempDir(): Promise<string> {
  const tempDir = join(tmpdir(), `hb-test-${randomBytes(8).toString('hex')}`);
  await mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Create a test toolbox executable
 */
export async function createTestToolbox(
  dir: string,
  name: string,
  description: string,
  schema: any
): Promise<string> {
  const toolPath = join(dir, `tb__${name}`);
  
  const script = `#!/usr/bin/env node
const action = process.env.TOOLBOX_ACTION;

if (action === 'describe') {
  console.log(JSON.stringify({
    name: '${name}',
    description: '${description}',
    inputSchema: ${JSON.stringify(schema)}
  }));
} else if (action === 'run') {
  const args = JSON.parse(process.env.TOOLBOX_ARGS || '{}');
  console.log(JSON.stringify({ result: 'success', args }));
}
`;

  await writeFile(toolPath, script, { mode: 0o755 });
  return toolPath;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Mock environment variables for a test
 */
export function withEnv<T>(
  env: Record<string, string>,
  fn: () => T | Promise<T>
): Promise<T> {
  const originalEnv = { ...process.env };
  
  // Set new env vars
  Object.assign(process.env, env);
  
  const restore = () => {
    // Restore original env
    process.env = originalEnv;
  };
  
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
    return Promise.resolve(result);
  } catch (error) {
    restore();
    throw error;
  }
}

/**
 * Assert that a value is defined
 */
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is not defined');
  }
}

/**
 * Sleep for a duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


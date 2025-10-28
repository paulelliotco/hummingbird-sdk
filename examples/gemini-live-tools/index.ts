/**
 * Gemini example with Live Tools session
 */

import { createAgent, registerAdapter } from '@hummingbird/core';
import { GeminiAdapter } from '@hummingbird/adapter-gemini';
import { createFetchTool } from '@hummingbird/tooling';

// Register Gemini adapter
registerAdapter('gemini', () => new GeminiAdapter());

async function main() {
  // Create tools
  const tools = [
    createFetchTool({ allowedHosts: ['api.github.com', 'jsonplaceholder.typicode.com'] }),
  ];

  // Create agent with Gemini
  const agent = createAgent({
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    system: 'You are a helpful assistant that can fetch data from APIs.',
    tools,
    temperature: 0.7,
  });

  console.log('Starting Gemini session with Live Tools...\n');

  for await (const event of agent.send({
    text: 'Fetch the first post from jsonplaceholder.typicode.com/posts/1 and tell me about it.',
  })) {
    if (event.type === 'system') {
      console.log(`[System] Session: ${event.sessionId}`);
    } else if (event.type === 'assistant') {
      if (event.text) {
        process.stdout.write(event.text);
      }
      if (event.toolCalls) {
        console.log('\n[Function Calls]', event.toolCalls);
      }
    } else if (event.type === 'tool-result') {
      console.log('[Function Responses]', event.results);
    } else if (event.type === 'final') {
      console.log('\n\n[Done]');
      if (event.usage) {
        console.log('[Usage]', event.usage);
      }
    } else if (event.type === 'error') {
      console.error('[Error]', event.error);
    }
  }

  // Demonstrate handoff
  console.log('\n\n--- Demonstrating Handoff ---\n');
  const handoffRef = await agent.handoff(
    'Now fetch post #2 and compare it to post #1',
    { includeMessages: 5 }
  );
  console.log(`Created handoff thread: ${handoffRef.id}`);
}

main().catch(console.error);


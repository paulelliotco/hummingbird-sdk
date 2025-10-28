/**
 * Minimal OpenAI example with toolbox and structured output
 */

import { createAgent, registerAdapter } from '@hummingbird/core';
import { OpenAIAdapter } from '@hummingbird/adapter-openai';
import { discoverToolboxes } from '@hummingbird/tooling';

// Register OpenAI adapter
registerAdapter('openai', () => new OpenAIAdapter());

async function main() {
  // Discover toolboxes from environment
  const tools = await discoverToolboxes({
    paths: ['./.hummingbird/tools'],
    prefix: 'tb__',
  });

  console.log(`Discovered ${tools.length} tools`);

  // Create agent with structured output
  const agent = createAgent({
    provider: 'openai',
    model: 'gpt-4',
    system: 'You are a helpful assistant that can run tests.',
    toolboxPaths: ['./.hummingbird/tools'],
    tools,
    structured: {
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          tests_passed: { type: 'number' },
          tests_failed: { type: 'number' },
        },
        required: ['summary', 'tests_passed', 'tests_failed'],
      },
      strict: true,
    },
    permissions: [
      { tool: 'tb__run_tests', action: 'ask' },
      { tool: '*', action: 'allow' },
    ],
  });

  // Stream agent response
  console.log('\nSending request...\n');
  
  for await (const event of agent.send({ text: 'Run the unit tests and summarize the results.' })) {
    if (event.type === 'system') {
      console.log(`[System] Session: ${event.sessionId}`);
      console.log(`[System] Tools: ${event.tools.join(', ')}`);
    } else if (event.type === 'assistant') {
      if (event.text) {
        process.stdout.write(event.text);
      }
      if (event.toolCalls) {
        console.log('\n[Tool Calls]', event.toolCalls);
      }
    } else if (event.type === 'tool-result') {
      console.log('[Tool Results]', event.results);
    } else if (event.type === 'final') {
      console.log('\n\n[Final Output]', event.output);
      if (event.usage) {
        console.log('[Usage]', event.usage);
      }
    } else if (event.type === 'error') {
      console.error('[Error]', event.error);
    }
  }
}

main().catch(console.error);


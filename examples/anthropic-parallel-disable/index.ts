/**
 * Anthropic example with parallel tool calls disabled
 */

import { createAgent, registerAdapter } from '@hummingbird/core';
import { AnthropicAdapter } from '@hummingbird/adapter-anthropic';
import { createFileTools, createBashTool } from '@hummingbird/tooling';

// Register Anthropic adapter
registerAdapter('anthropic', () => new AnthropicAdapter());

async function main() {
  // Create tools
  const tools = [
    ...createFileTools({ baseDir: '.' }),
    createBashTool({ cwd: '.' }),
  ];

  // Create agent with parallel tools disabled
  const agent = createAgent({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    system: 'You are a helpful coding assistant.',
    tools,
    parallelTools: 'disable', // Maps to disable_parallel_tool_use
    permissions: [
      { tool: 'File.read', action: 'allow' },
      { tool: 'File.write', action: 'ask' },
      { tool: 'Bash', action: 'ask' },
    ],
  });

  console.log('Sending request with parallel tools disabled...\n');

  for await (const event of agent.send({
    text: 'Read package.json and show me the version.',
  })) {
    if (event.type === 'assistant' && event.text) {
      process.stdout.write(event.text);
    } else if (event.type === 'tool-result') {
      console.log('\n[Tool Results]', event.results);
    } else if (event.type === 'final') {
      console.log('\n\n[Done]');
      if (event.usage) {
        console.log('[Usage]', event.usage);
      }
    } else if (event.type === 'error') {
      console.error('[Error]', event.error);
    }
  }
}

main().catch(console.error);


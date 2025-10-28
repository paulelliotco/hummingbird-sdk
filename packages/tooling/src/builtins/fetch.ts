/**
 * Fetch tool - HTTP requests
 */

import type { ToolDefinition } from '../types.js';

export const FetchTool: ToolDefinition = {
  name: 'Fetch',
  description: 'Make HTTP requests',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' },
      method: { type: 'string', description: 'HTTP method', default: 'GET' },
      headers: { type: 'object', description: 'HTTP headers' },
      body: { type: 'string', description: 'Request body' },
    },
    required: ['url'],
  },
  runtime: 'builtin',
  handler: async (args: any) => {
    try {
      const response = await fetch(args.url, {
        method: args.method || 'GET',
        headers: args.headers,
        body: args.body,
      });
      
      const content = await response.text();
      
      return {
        content,
        status: response.status,
        ok: response.ok,
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
};

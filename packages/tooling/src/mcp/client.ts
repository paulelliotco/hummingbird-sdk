/**
 * MCP (Model Context Protocol) client
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ToolDefinition } from '../types.js';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport?: 'stdio' | 'sse';
}

export class MCPClient {
  private clients = new Map<string, Client>();
  private tools = new Map<string, { client: Client; mcpTool: any }>();

  /**
   * Connect to an MCP server
   */
  async connect(serverId: string, config: MCPServerConfig): Promise<void> {
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    if (config.env) {
      Object.assign(env, config.env);
    }
    
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env,
    });

    const client = new Client(
      {
        name: 'hummingbird-client',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await client.connect(transport);
    this.clients.set(serverId, client);

    // Discover tools from the server
    await this.discoverTools(serverId, client);
  }

  /**
   * Discover tools from an MCP server
   */
  private async discoverTools(serverId: string, client: Client): Promise<void> {
    const response = await client.listTools();
    
    for (const tool of response.tools) {
      const toolName = `${serverId}:${tool.name}`;
      this.tools.set(toolName, { client, mcpTool: tool });
    }
  }

  /**
   * Get all tools as ToolDefinitions
   */
  getTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    for (const [name, { mcpTool }] of this.tools.entries()) {
      tools.push({
        name,
        description: mcpTool.description || '',
        inputSchema: mcpTool.inputSchema || { type: 'object', properties: {} },
        runtime: 'mcp',
        handler: async (args: any) => {
          return this.executeTool(name, args);
        },
      });
    }

    return tools;
  }

  /**
   * Execute an MCP tool
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`MCP tool '${name}' not found`);
    }

    const response = await tool.client.callTool({
      name: tool.mcpTool.name,
      arguments: args,
    });

    if (response.isError) {
      const content = response.content as any[];
      throw new Error(content[0]?.text || 'Tool execution failed');
    }

    const content = response.content as any[];
    return content[0]?.text || response.content;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    
    if (client) {
      await client.close();
      this.clients.delete(serverId);

      // Remove tools from this server
      for (const [name] of this.tools.entries()) {
        if (name.startsWith(`${serverId}:`)) {
          this.tools.delete(name);
        }
      }
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((id) =>
      this.disconnect(id)
    );
    await Promise.all(promises);
  }
}


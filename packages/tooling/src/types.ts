/**
 * Common tooling types
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  runtime?: 'mcp' | 'toolbox' | 'builtin' | 'http';
  handler?: (args: any) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}


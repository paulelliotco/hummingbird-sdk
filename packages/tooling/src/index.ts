/**
 * @hummingbird/tooling - Toolboxes, MCP, and built-in tools
 */

// Toolbox
export { discoverToolboxes } from './toolbox/discovery.js';
export type { ToolboxDiscoveryOptions } from './toolbox/discovery.js';

export { executeToolbox } from './toolbox/runtime.js';

// MCP
export { MCPClient } from './mcp/client.js';

// Built-in tools
export { BashTool } from './builtins/bash.js';
export { FileReadTool, FileWriteTool, FileListTool } from './builtins/file.js';
export { FetchTool } from './builtins/fetch.js';

// Errors
export * from './toolbox/errors.js';


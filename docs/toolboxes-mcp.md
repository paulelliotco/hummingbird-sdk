# Toolboxes & MCP

## Toolboxes

Toolboxes are local executables discovered from directories.

### Discovery

Toolboxes are discovered from paths specified in `HB_TOOLBOX` environment variable or default paths:

- `.hummingbird/tools`
- `~/.config/hummingbird/tools`

### Creating a Toolbox

A toolbox is any executable prefixed with `tb__` that responds to two actions:

1. **describe**: Returns tool definition as JSON
2. **run**: Executes the tool with arguments

#### Example: `tb__greet`

```bash
#!/usr/bin/env bash

case "$TOOLBOX_ACTION" in
  describe)
    cat <<EOF
{
  "name": "greet",
  "description": "Greet a person",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    },
    "required": ["name"]
  }
}
EOF
    ;;
    
  run)
    ARGS=$(echo "$TOOLBOX_ARGS" | jq -r .)
    NAME=$(echo "$ARGS" | jq -r '.name')
    echo "{ \"greeting\": \"Hello, $NAME!\" }"
    ;;
esac
```

Make it executable:

```bash
chmod +x tb__greet
```

### Using Toolboxes

```typescript
import { discoverToolboxes } from '@hummingbird/tooling';

const tools = await discoverToolboxes({
  paths: ['.hummingbird/tools'],
  prefix: 'tb__',
  timeout: 5000,
});

const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  tools,
});
```

## MCP (Model Context Protocol)

First-class support for MCP servers.

### Connecting to MCP Servers

```typescript
import { MCPClient } from '@hummingbird/tooling';

const client = new MCPClient();

await client.connect('myserver', {
  command: 'node',
  args: ['./mcp-server.js'],
  transport: 'stdio',
});

// Get tools from MCP server
const tools = client.getTools();

const agent = createAgent({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  tools,
});
```

### MCP Server Config

```typescript
interface MCPServerConfig {
  command: string;        // Command to run
  args?: string[];        // Command arguments
  env?: Record<string, string>; // Environment variables
  transport?: 'stdio' | 'sse';  // Transport type
}
```

### Using MCP in AgentOptions

```typescript
const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  mcpServers: [
    {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },
  ],
});
```

## Built-in Tools

### Bash

Execute shell commands:

```typescript
import { createBashTool } from '@hummingbird/tooling';

const bash = createBashTool({
  cwd: process.cwd(),
  timeout: 30000,
});
```

### File I/O

Read, write, list, and delete files:

```typescript
import { createFileTools } from '@hummingbird/tooling';

const fileTools = createFileTools({
  baseDir: process.cwd(),
  allowedPaths: ['./src', './tests'],
});

// Provides: File.read, File.write, File.list, File.stat, File.delete
```

### HTTP Fetch

Make HTTP requests:

```typescript
import { createFetchTool } from '@hummingbird/tooling';

const fetch = createFetchTool({
  timeout: 30000,
  allowedHosts: ['api.github.com'],
});
```

### Editor API

IDE integration (placeholder):

```typescript
import { createEditorTools } from '@hummingbird/tooling';

const editorTools = createEditorTools({
  enabled: true,
});

// Provides: Editor.openFile, Editor.getSelection
```

## Custom Tools

### Defining a Custom Tool

```typescript
import type { ToolDefinition } from '@hummingbird/tooling';

const myTool: ToolDefinition = {
  name: 'myCustomTool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  runtime: 'builtin',
  handler: async (args) => {
    // Your implementation
    return { result: `Processed: ${args.input}` };
  },
};

const agent = createAgent({
  provider: 'openai',
  model: 'gpt-4',
  tools: [myTool],
});
```

## Tool Runtime

Execute tools with permission checks:

```typescript
import { ToolboxRuntime, createToolboxRuntime } from '@hummingbird/tooling';

const runtime = createToolboxRuntime(tools, {
  cwd: process.cwd(),
  timeout: 30000,
});

const result = await runtime.execute('myTool', { input: 'test' });
```


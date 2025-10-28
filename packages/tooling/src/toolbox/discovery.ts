/**
 * Toolbox discovery for Hummingbird
 * Discovers tools from directories specified in HB_TOOLBOX env var
 */

import { readdir, access, constants } from 'fs/promises';
import { resolve, join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition } from '../types.js';
import { ToolboxDiscoveryError } from './errors.js';

const execFileAsync = promisify(execFile);

export interface ToolboxDiscoveryOptions {
  paths?: string[];
  prefix?: string;
  timeout?: number;
  filter?: (name: string) => boolean;
}

export { ToolboxDiscoveryError };

/**
 * Discover toolbox executables from specified paths
 */
export async function discoverToolboxes(
  options: ToolboxDiscoveryOptions = {}
): Promise<ToolDefinition[]> {
  const {
    paths = getToolboxPaths(),
    prefix = '',
    timeout = 5000,
    filter,
  } = options;

  const tools: ToolDefinition[] = [];

  for (const path of paths) {
    try {
      const pathTools = await discoverToolsInPath(path, prefix, timeout, filter);
      tools.push(...pathTools);
    } catch (error: any) {
      // If it's a discovery error, rethrow it
      if (error instanceof ToolboxDiscoveryError) {
        throw error;
      }
      // Skip paths that don't exist or can't be read
      console.warn(`Failed to discover tools in ${path}:`, error.message);
    }
  }

  return tools;
}

/**
 * Get toolbox paths from environment or defaults
 */
function getToolboxPaths(): string[] {
  const envPaths = process.env.HB_TOOLBOX;
  
  if (envPaths) {
    return envPaths.split(':').map((p) => resolve(p));
  }

  // Default paths
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return [
    resolve('.hummingbird/tools'),
    resolve(home, '.config/hummingbird/tools'),
  ];
}

/**
 * Discover tools in a single directory
 */
async function discoverToolsInPath(
  path: string,
  prefix: string,
  timeout: number,
  filter?: (name: string) => boolean
): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [];

  try {
    await access(path, constants.R_OK | constants.X_OK);
  } catch {
    return tools; // Path doesn't exist or not accessible
  }

  const entries = await readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() && !entry.isSymbolicLink()) {
      continue;
    }

    // Check if it starts with tb__ prefix (toolbox convention)
    if (!entry.name.startsWith('tb__')) {
      continue;
    }

    const toolPath = join(path, entry.name);

    const tool = await describeToolbox(toolPath, timeout);
    if (tool) {
      // Add prefix to tool name if specified
      if (prefix) {
        tool.name = prefix + tool.name;
      }
      
      // Apply filter if specified
      if (filter && !filter(tool.name)) {
        continue;
      }
      
      tools.push(tool);
    }
  }

  return tools;
}

/**
 * Call toolbox with TOOLBOX_ACTION=describe to get its definition
 */
async function describeToolbox(
  toolPath: string,
  timeout: number
): Promise<ToolDefinition | null> {
  try {
    const { stdout } = await execFileAsync(toolPath, [], {
      env: {
        ...process.env,
        TOOLBOX_ACTION: 'describe',
      },
      timeout,
    });

    let description;
    try {
      description = JSON.parse(stdout.trim());
    } catch (parseError: any) {
      throw new ToolboxDiscoveryError(
        `Toolbox ${toolPath} returned invalid JSON: ${parseError.message}`
      );
    }
    
    return {
      name: description.name,
      description: description.description || '',
      inputSchema: description.inputSchema || { type: 'object', properties: {} },
      runtime: 'toolbox',
      handler: async (args: any) => {
        return executeToolbox(toolPath, args, timeout);
      },
    };
  } catch (error: any) {
    if (error instanceof ToolboxDiscoveryError) {
      throw error;
    }
    console.error(`Failed to describe toolbox ${toolPath}:`, error.message);
    return null;
  }
}

/**
 * Execute a toolbox with TOOLBOX_ACTION=run
 */
async function executeToolbox(
  toolPath: string,
  args: any,
  timeout: number
): Promise<any> {
  const { stdout, stderr } = await execFileAsync(toolPath, [], {
    env: {
      ...process.env,
      TOOLBOX_ACTION: 'run',
      TOOLBOX_ARGS: JSON.stringify(args),
    },
    timeout,
  });

  if (stderr) {
    console.warn(`Toolbox stderr: ${stderr}`);
  }

  try {
    return JSON.parse(stdout.trim());
  } catch {
    return stdout.trim();
  }
}


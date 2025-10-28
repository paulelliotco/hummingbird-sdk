/**
 * Toolbox runtime execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ToolboxExecutionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ToolboxExecutionError';
  }
}

export interface ExecuteOptions {
  timeout?: number;
  env?: Record<string, string>;
}

export async function executeToolbox(
  toolPath: string,
  args: any,
  options: ExecuteOptions = {}
): Promise<any> {
  try {
    const env = {
      ...process.env,
      TOOLBOX_ACTION: 'run',
      TOOLBOX_ARGS: JSON.stringify(args),
      ...options.env,
    };
    
    const { stdout, stderr } = await execAsync(toolPath, {
      env,
      timeout: options.timeout || 30000,
    });
    
    if (stderr) {
      throw new ToolboxExecutionError(`Toolbox stderr: ${stderr}`);
    }
    
    return JSON.parse(stdout.trim());
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new ToolboxExecutionError(`Toolbox not found: ${toolPath}`);
    }
    
    if (error.killed) {
      throw new ToolboxExecutionError(`Toolbox timeout: ${toolPath}`);
    }
    
    throw new ToolboxExecutionError(
      `Toolbox execution failed: ${error.message}`,
      error.code
    );
  }
}

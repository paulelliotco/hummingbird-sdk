/**
 * Bash tool - execute shell commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition } from '../types.js';

const execAsync = promisify(exec);

export const BashTool: ToolDefinition = {
  name: 'Bash',
  description: 'Execute bash commands',
  inputSchema: {
    type: 'object',
    properties: {
      cmd: { type: 'string', description: 'The bash command to execute' },
      cwd: { type: 'string', description: 'Working directory' },
      timeout: { type: 'number', description: 'Timeout in milliseconds' },
      env: { type: 'object', description: 'Environment variables' },
    },
    required: ['cmd'],
  },
  runtime: 'builtin',
  handler: async (args: any) => {
    try {
      const { stdout, stderr } = await execAsync(args.cmd, {
        cwd: args.cwd,
        timeout: args.timeout || 30000,
        env: { ...process.env, ...args.env },
      });
      
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        error: error.message,
      };
    }
  },
};

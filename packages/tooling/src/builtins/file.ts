/**
 * File tools - read, write, list files
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { ToolDefinition } from '../types.js';

export const FileReadTool: ToolDefinition = {
  name: 'File.read',
  description: 'Read file contents',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      encoding: { type: 'string', description: 'File encoding', default: 'utf8' },
    },
    required: ['path'],
  },
  runtime: 'builtin',
  handler: async (args: any) => {
    try {
      const content = await readFile(args.path, args.encoding || 'utf8');
      return { content };
    } catch (error: any) {
      return { error: error.message };
    }
  },
};

export const FileWriteTool: ToolDefinition = {
  name: 'File.write',
  description: 'Write file contents',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' },
      content: { type: 'string', description: 'Content to write' },
      createDirs: { type: 'boolean', description: 'Create parent directories if needed' },
    },
    required: ['path', 'content'],
  },
  runtime: 'builtin',
  handler: async (args: any) => {
    try {
      if (args.createDirs) {
        await mkdir(dirname(args.path), { recursive: true });
      }
      await writeFile(args.path, args.content);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const FileListTool: ToolDefinition = {
  name: 'File.list',
  description: 'List files in directory',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path' },
    },
    required: ['path'],
  },
  runtime: 'builtin',
  handler: async (args: any) => {
    try {
      const files = await readdir(args.path);
      return { files };
    } catch (error: any) {
      return { error: error.message };
    }
  },
};

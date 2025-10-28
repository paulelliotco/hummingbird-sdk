import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeToolbox, ToolboxExecutionError } from '../../toolbox/runtime.js';
import { createTempDir, createTestToolbox } from '../../../../../tests/utils/helpers.js';
import { rm } from 'fs/promises';

describe('executeToolbox', () => {
  let tempDir: string;
  let toolPath: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    toolPath = await createTestToolbox(tempDir, 'calc', 'Calculator', {
      type: 'object',
      properties: {
        operation: { type: 'string' },
      },
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should execute toolbox with arguments', async () => {
    const result = await executeToolbox(toolPath, { operation: 'add' });
    
    expect(result).toBeDefined();
    expect(result.result).toBe('success');
  });

  it('should handle empty arguments', async () => {
    const result = await executeToolbox(toolPath, {});
    expect(result).toBeDefined();
  });

  it('should throw on non-existent toolbox', async () => {
    await expect(
      executeToolbox('/nonexistent/toolbox', {})
    ).rejects.toThrow(ToolboxExecutionError);
  });

  it('should handle timeout', async () => {
    // Create a long-running toolbox
    const slowPath = `${tempDir}/tb__slow`;
    await require('fs/promises').writeFile(
      slowPath,
      '#!/bin/sh\nsleep 10',
      { mode: 0o755 }
    );

    await expect(
      executeToolbox(slowPath, {}, { timeout: 100 })
    ).rejects.toThrow(ToolboxExecutionError);
  });

  it('should handle toolbox stderr', async () => {
    const errorPath = `${tempDir}/tb__error`;
    await require('fs/promises').writeFile(
      errorPath,
      '#!/bin/sh\necho "error" >&2\nexit 1',
      { mode: 0o755 }
    );

    await expect(
      executeToolbox(errorPath, {})
    ).rejects.toThrow(ToolboxExecutionError);
  });

  it('should parse JSON result', async () => {
    const result = await executeToolbox(toolPath, { test: 'value' });
    expect(typeof result).toBe('object');
  });
});


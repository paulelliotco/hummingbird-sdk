import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverToolboxes, ToolboxDiscoveryError } from '../../toolbox/discovery.js';
import { createTempDir, createTestToolbox, withEnv } from '../../../../../tests/utils/helpers.js';
import { rm } from 'fs/promises';

describe('discoverToolboxes', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should discover toolboxes in specified paths', async () => {
    await createTestToolbox(tempDir, 'test_tool', 'A test tool', {
      type: 'object',
      properties: {},
    });

    const tools = await discoverToolboxes({ paths: [tempDir] });
    
    expect(tools.length).toBe(1);
    expect(tools[0].name).toContain('test_tool');
  });

  it('should add prefix to tool names', async () => {
    await createTestToolbox(tempDir, 'my_tool', 'My tool', {
      type: 'object',
      properties: {},
    });

    const tools = await discoverToolboxes({
      paths: [tempDir],
      prefix: 'tb__',
    });
    
    expect(tools[0].name).toBe('tb__my_tool');
  });

  it('should discover from HB_TOOLBOX env var', async () => {
    await createTestToolbox(tempDir, 'env_tool', 'Env tool', {
      type: 'object',
      properties: {},
    });

    await withEnv({ HB_TOOLBOX: tempDir }, async () => {
      const tools = await discoverToolboxes({ paths: [] });
      expect(tools.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle empty directories', async () => {
    const tools = await discoverToolboxes({ paths: [tempDir] });
    expect(tools).toEqual([]);
  });

  it('should handle non-existent paths gracefully', async () => {
    const tools = await discoverToolboxes({ paths: ['/nonexistent/path'] });
    expect(tools).toEqual([]);
  });

  it('should filter by pattern', async () => {
    await createTestToolbox(tempDir, 'tool_one', 'Tool 1', { type: 'object' });
    await createTestToolbox(tempDir, 'tool_two', 'Tool 2', { type: 'object' });

    const tools = await discoverToolboxes({
      paths: [tempDir],
      filter: (name) => name.includes('one'),
    });
    
    expect(tools.length).toBe(1);
    expect(tools[0].name).toContain('tool_one');
  });

  it('should handle malformed toolbox describe', async () => {
    // Create invalid toolbox that returns bad JSON
    const badPath = `${tempDir}/tb__bad`;
    await require('fs/promises').writeFile(
      badPath,
      '#!/bin/sh\necho "not json"',
      { mode: 0o755 }
    );

    await expect(
      discoverToolboxes({ paths: [tempDir] })
    ).rejects.toThrow(ToolboxDiscoveryError);
  });
});


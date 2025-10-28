import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileReadTool, FileWriteTool, FileListTool } from '../../builtins/file.js';
import { createTempDir } from '../../../../../tests/utils/helpers.js';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

describe('FileReadTool', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should read file contents', async () => {
    const filePath = join(tempDir, 'test.txt');
    await writeFile(filePath, 'Hello, World!');

    const result = await FileReadTool.handler({ path: filePath });
    expect(result.content).toBe('Hello, World!');
  });

  it('should handle non-existent files', async () => {
    const result = await FileReadTool.handler({ path: '/nonexistent/file.txt' });
    expect(result.error).toBeDefined();
  });

  it('should support encoding option', async () => {
    const filePath = join(tempDir, 'test.txt');
    await writeFile(filePath, 'Test content');

    const result = await FileReadTool.handler({ path: filePath, encoding: 'utf8' });
    expect(result.content).toBeDefined();
  });
});

describe('FileWriteTool', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should write file contents', async () => {
    const filePath = join(tempDir, 'write.txt');

    const result = await FileWriteTool.handler({
      path: filePath,
      content: 'New content',
    });
    
    expect(result.success).toBe(true);
  });

  it('should create directories if needed', async () => {
    const filePath = join(tempDir, 'subdir', 'file.txt');

    const result = await FileWriteTool.handler({
      path: filePath,
      content: 'Content',
      createDirs: true,
    });
    
    expect(result.success).toBe(true);
  });

  it('should handle write errors gracefully', async () => {
    const result = await FileWriteTool.handler({
      path: '/root/protected.txt',
      content: 'Test',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('FileListTool', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should list files in directory', async () => {
    await writeFile(join(tempDir, 'file1.txt'), 'content1');
    await writeFile(join(tempDir, 'file2.txt'), 'content2');

    const result = await FileListTool.handler({ path: tempDir });
    
    expect(result.files).toHaveLength(2);
    expect(result.files).toContain('file1.txt');
    expect(result.files).toContain('file2.txt');
  });

  it('should handle empty directories', async () => {
    const result = await FileListTool.handler({ path: tempDir });
    expect(result.files).toEqual([]);
  });

  it('should handle non-existent directories', async () => {
    const result = await FileListTool.handler({ path: '/nonexistent/dir' });
    expect(result.error).toBeDefined();
  });
});


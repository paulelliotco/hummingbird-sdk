import { describe, it, expect } from 'vitest';
import { BashTool } from '../../builtins/bash.js';

describe('BashTool', () => {
  it('should have correct metadata', () => {
    expect(BashTool.name).toBe('Bash');
    expect(BashTool.description).toBeDefined();
    expect(BashTool.inputSchema).toBeDefined();
  });

  it('should execute simple commands', async () => {
    const result = await BashTool.handler({ cmd: 'echo "hello"' });
    expect(result.stdout).toContain('hello');
    expect(result.exitCode).toBe(0);
  });

  it('should capture stderr', async () => {
    const result = await BashTool.handler({ cmd: 'echo "error" >&2' });
    expect(result.stderr).toContain('error');
  });

  it('should handle command errors', async () => {
    const result = await BashTool.handler({ cmd: 'exit 1' });
    expect(result.exitCode).toBe(1);
  });

  it('should handle working directory', async () => {
    const result = await BashTool.handler({ cmd: 'pwd', cwd: '/tmp' });
    expect(result.stdout).toContain('/tmp');
  });

  it('should handle timeout', async () => {
    const result = await BashTool.handler({ cmd: 'sleep 10', timeout: 100 });
    expect(result.error).toBeDefined();
  });

  it('should set environment variables', async () => {
    const result = await BashTool.handler({
      cmd: 'echo $TEST_VAR',
      env: { TEST_VAR: 'test_value' },
    });
    expect(result.stdout).toContain('test_value');
  });
});


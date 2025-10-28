import { describe, it, expect } from 'vitest';
import { FetchTool } from '../../builtins/fetch.js';

describe('FetchTool', () => {
  it('should have correct metadata', () => {
    expect(FetchTool.name).toBe('Fetch');
    expect(FetchTool.description).toBeDefined();
    expect(FetchTool.inputSchema).toBeDefined();
  });

  it('should fetch URL content', async () => {
    // Mock fetch for testing
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => 'Test content',
      json: async () => ({ test: 'data' }),
    } as any);

    const result = await FetchTool.handler({ url: 'https://example.com' });
    
    expect(result.content).toBe('Test content');
    expect(result.status).toBe(200);

    global.fetch = originalFetch;
  });

  it('should handle fetch errors', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error('Network error');
    };

    const result = await FetchTool.handler({ url: 'https://example.com' });
    expect(result.error).toBeDefined();

    global.fetch = originalFetch;
  });

  it('should support custom headers', async () => {
    const originalFetch = global.fetch;
    let capturedHeaders: any;
    
    global.fetch = async (_url, options: any) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        text: async () => 'Content',
      } as any;
    };

    await FetchTool.handler({
      url: 'https://example.com',
      headers: { Authorization: 'Bearer token' },
    });
    
    expect(capturedHeaders.Authorization).toBe('Bearer token');

    global.fetch = originalFetch;
  });

  it('should support POST requests', async () => {
    const originalFetch = global.fetch;
    let capturedMethod: string | undefined;
    let capturedBody: any;
    
    global.fetch = async (_url, options: any) => {
      capturedMethod = options.method;
      capturedBody = options.body;
      return {
        ok: true,
        status: 200,
        text: async () => 'Response',
      } as any;
    };

    await FetchTool.handler({
      url: 'https://example.com',
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
    
    expect(capturedMethod).toBe('POST');
    expect(capturedBody).toBeDefined();

    global.fetch = originalFetch;
  });
});


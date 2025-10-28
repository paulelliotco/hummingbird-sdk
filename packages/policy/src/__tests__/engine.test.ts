import { describe, it, expect } from 'vitest';
import { PermissionEngine, InteractivePermissionEngine } from '../engine.js';

describe('PermissionEngine', () => {
  describe('evaluate', () => {
    it('should allow tools with allow action', () => {
      const engine = new PermissionEngine([
        { tool: 'File.read', action: 'allow' },
      ]);
      
      const decision = engine.evaluate({ tool: 'File.read', args: {} });
      expect(decision.action).toBe('allow');
    });

    it('should reject tools with reject action', () => {
      const engine = new PermissionEngine([
        { tool: 'File.delete', action: 'reject' },
      ]);
      
      const decision = engine.evaluate({ tool: 'File.delete', args: {} });
      expect(decision.action).toBe('reject');
    });

    it('should ask for tools with ask action', () => {
      const engine = new PermissionEngine([
        { tool: 'File.write', action: 'ask' },
      ]);
      
      const decision = engine.evaluate({ tool: 'File.write', args: {} });
      expect(decision.action).toBe('ask');
    });

    it('should delegate tools with delegate action', () => {
      const engine = new PermissionEngine([
        { tool: 'Bash', action: 'delegate', to: 'admin' },
      ]);
      
      const decision = engine.evaluate({ tool: 'Bash', args: { cmd: 'ls' } });
      expect(decision.action).toBe('delegate');
      expect(decision.delegateTo).toBe('admin');
    });

    it('should match tool patterns with glob', () => {
      const engine = new PermissionEngine([
        { tool: 'File.*', action: 'allow' },
      ]);
      
      expect(engine.evaluate({ tool: 'File.read', args: {} }).action).toBe('allow');
      expect(engine.evaluate({ tool: 'File.write', args: {} }).action).toBe('allow');
      expect(engine.evaluate({ tool: 'Bash', args: {} }).action).toBe('ask');
    });

    it('should match argument patterns', () => {
      const engine = new PermissionEngine([
        { tool: 'Bash', matches: { cmd: '*rm -rf*' }, action: 'reject' },
        { tool: 'Bash', action: 'ask' },
      ]);
      
      expect(engine.evaluate({ tool: 'Bash', args: { cmd: 'rm -rf /' } }).action).toBe('reject');
      expect(engine.evaluate({ tool: 'Bash', args: { cmd: 'ls' } }).action).toBe('ask');
    });

    it('should use first matching rule', () => {
      const engine = new PermissionEngine([
        { tool: 'File.read', action: 'allow' },
        { tool: 'File.read', action: 'reject' },
      ]);
      
      expect(engine.evaluate({ tool: 'File.read', args: {} }).action).toBe('allow');
    });

    it('should default to ask when no rules match', () => {
      const engine = new PermissionEngine([]);
      expect(engine.evaluate({ tool: 'UnknownTool', args: {} }).action).toBe('ask');
    });
  });

  describe('rule management', () => {
    it('should add rules', () => {
      const engine = new PermissionEngine();
      engine.addRules([{ tool: 'Test', action: 'allow' }]);
      
      expect(engine.getRules()).toHaveLength(1);
    });

    it('should set rules', () => {
      const engine = new PermissionEngine([{ tool: 'Old', action: 'allow' }]);
      engine.setRules([{ tool: 'New', action: 'reject' }]);
      
      const rules = engine.getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].tool).toBe('New');
    });

    it('should clear rules', () => {
      const engine = new PermissionEngine([{ tool: 'Test', action: 'allow' }]);
      engine.clearRules();
      
      expect(engine.getRules()).toHaveLength(0);
    });
  });
});

describe('InteractivePermissionEngine', () => {
  it('should call askCallback for ask action', async () => {
    let called = false;
    const callback = async () => {
      called = true;
      return true;
    };
    
    const engine = new InteractivePermissionEngine(
      [{ tool: 'Test', action: 'ask' }],
      callback
    );
    
    const result = await engine.evaluateInteractive({ tool: 'Test', args: {} });
    expect(called).toBe(true);
    expect(result).toBe(true);
  });

  it('should not call askCallback for allow action', async () => {
    let called = false;
    const callback = async () => {
      called = true;
      return false;
    };
    
    const engine = new InteractivePermissionEngine(
      [{ tool: 'Test', action: 'allow' }],
      callback
    );
    
    const result = await engine.evaluateInteractive({ tool: 'Test', args: {} });
    expect(called).toBe(false);
    expect(result).toBe(true);
  });

  it('should reject when no callback provided for ask', async () => {
    const engine = new InteractivePermissionEngine([
      { tool: 'Test', action: 'ask' },
    ]);
    
    const result = await engine.evaluateInteractive({ tool: 'Test', args: {} });
    expect(result).toBe(false);
  });
});


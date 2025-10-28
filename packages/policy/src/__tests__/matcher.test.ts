import { describe, it, expect } from 'vitest';
import { matchGlob, matchArgs, isMoreSpecific } from '../matcher.js';

describe('matchGlob', () => {
  it('should match exact strings', () => {
    expect(matchGlob('test', 'test')).toBe(true);
    expect(matchGlob('test', 'other')).toBe(false);
  });

  it('should match with * wildcard', () => {
    expect(matchGlob('File.read', 'File.*')).toBe(true);
    expect(matchGlob('File.write', 'File.*')).toBe(true);
    expect(matchGlob('anything', '*')).toBe(true);
    expect(matchGlob('prefix_test', 'prefix_*')).toBe(true);
  });

  it('should match with ? wildcard', () => {
    expect(matchGlob('test1', 'test?')).toBe(true);
    expect(matchGlob('test', 'test?')).toBe(false);
    expect(matchGlob('test12', 'test?')).toBe(false);
  });

  it('should handle multiple wildcards', () => {
    expect(matchGlob('a.b.c', '*.b.*')).toBe(true);
    expect(matchGlob('test_1_end', 'test_?_*')).toBe(true);
  });
});

describe('matchArgs', () => {
  it('should match exact argument values', () => {
    expect(matchArgs({ cmd: 'ls' }, { cmd: 'ls' })).toBe(true);
    expect(matchArgs({ cmd: 'rm' }, { cmd: 'ls' })).toBe(false);
  });

  it('should match arguments with glob patterns', () => {
    expect(matchArgs({ cmd: 'rm -rf /' }, { cmd: '*rm -rf*' })).toBe(true);
    expect(matchArgs({ cmd: 'git commit' }, { cmd: 'git *' })).toBe(true);
    expect(matchArgs({ cmd: 'ls -la' }, { cmd: 'rm *' })).toBe(false);
  });

  it('should match arguments with regex patterns', () => {
    expect(matchArgs({ cmd: 'test123' }, { cmd: '/test\\d+/' })).toBe(true);
    expect(matchArgs({ cmd: 'testabc' }, { cmd: '/test\\d+/' })).toBe(false);
  });

  it('should match multiple arguments', () => {
    expect(
      matchArgs(
        { cmd: 'git commit', path: '/home/user' },
        { cmd: 'git *', path: '/home/*' }
      )
    ).toBe(true);
  });

  it('should return false when argument is missing', () => {
    expect(matchArgs({ cmd: 'ls' }, { cmd: 'ls', missing: '*' })).toBe(false);
  });

  it('should handle complex argument types', () => {
    expect(matchArgs({ count: 123 }, { count: '123' })).toBe(true);
    expect(matchArgs({ enabled: true }, { enabled: 'true' })).toBe(true);
  });
});

describe('isMoreSpecific', () => {
  it('should determine specificity by wildcard count', () => {
    expect(isMoreSpecific('File.read', 'File.*')).toBe(true);
    expect(isMoreSpecific('File.*', '*')).toBe(true);
    expect(isMoreSpecific('*', 'File.*')).toBe(false);
  });

  it('should consider length when wildcard count is equal', () => {
    expect(isMoreSpecific('longer_pattern', 'short')).toBe(true);
    expect(isMoreSpecific('a', 'abc')).toBe(false);
  });

  it('should handle patterns with no wildcards', () => {
    expect(isMoreSpecific('exact.match', 'exact.*')).toBe(true);
    expect(isMoreSpecific('short', 'longer')).toBe(false);
  });
});


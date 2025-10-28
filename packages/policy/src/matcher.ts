/**
 * Pattern matching utilities for permissions
 */

/**
 * Match a string against a glob pattern
 * Supports: *, ?, [abc], [a-z]
 */
export function matchGlob(value: string, pattern: string): boolean {
  // Convert glob to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // * matches any characters
    .replace(/\?/g, '.'); // ? matches single character

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(value);
}

/**
 * Match arguments against patterns
 */
export function matchArgs(
  args: Record<string, any>,
  patterns: Record<string, string>
): boolean {
  for (const [key, pattern] of Object.entries(patterns)) {
    const value = args[key];
    
    // Skip if arg not present
    if (value === undefined) {
      return false;
    }

    // Convert value to string for matching
    const valueStr = String(value);

    // Check if it matches the pattern (supports globs and regex)
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      // Regex pattern
      const regexStr = pattern.slice(1, -1);
      const regex = new RegExp(regexStr);
      if (!regex.test(valueStr)) {
        return false;
      }
    } else {
      // Glob pattern
      if (!matchGlob(valueStr, pattern)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a pattern is more specific than another
 * Used for rule ordering/precedence
 */
export function isMoreSpecific(pattern1: string, pattern2: string): boolean {
  // More specific = fewer wildcards
  const wildcards1 = (pattern1.match(/\*/g) || []).length;
  const wildcards2 = (pattern2.match(/\*/g) || []).length;
  
  if (wildcards1 !== wildcards2) {
    return wildcards1 < wildcards2;
  }

  // If same wildcards, longer is more specific
  return pattern1.length > pattern2.length;
}


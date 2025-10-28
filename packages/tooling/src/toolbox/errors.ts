/**
 * Toolbox-related errors
 */

export class ToolboxDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolboxDiscoveryError';
  }
}

export class ToolboxExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolboxExecutionError';
  }
}


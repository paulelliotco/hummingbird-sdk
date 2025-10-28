/**
 * JSON Schema validation and structured output support
 */

import type { JSONSchema, StructuredOutputConfig } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  repaired?: any;
}

export class SchemaValidationError extends Error {
  constructor(message: string, public errors?: string[]) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Compile a JSON Schema for validation
 */
export function compileSchema(schema: JSONSchema): CompiledSchema {
  return new CompiledSchema(schema);
}

export class CompiledSchema {
  constructor(private schema: JSONSchema) {}

  validate(data: any): ValidationResult {
    const errors: string[] = [];
    const valid = this.validateRecursive(data, this.schema, errors, 'root');
    
    return { valid, errors: errors.length > 0 ? errors : undefined };
  }

  private validateRecursive(
    data: any,
    schema: JSONSchema,
    errors: string[],
    path: string
  ): boolean {
    // Type validation
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      const dataType = Array.isArray(data) ? 'array' : typeof data;
      const actualType = data === null ? 'null' : dataType === 'object' && !Array.isArray(data) ? 'object' : dataType;
      
      if (!types.includes(actualType)) {
        errors.push(`${path}: expected type ${types.join('|')}, got ${actualType}`);
        return false;
      }
    }

    // Object validation
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      if (schema.required) {
        for (const key of schema.required) {
          if (!(key in data)) {
            errors.push(`${path}: missing required property '${key}'`);
            return false;
          }
        }
      }

      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            const valid = this.validateRecursive(
              data[key],
              propSchema,
              errors,
              `${path}.${key}`
            );
            if (!valid) return false;
          }
        }
      }
    }

    // Array validation
    if (schema.type === 'array' && Array.isArray(data)) {
      if (schema.items && !Array.isArray(schema.items)) {
        for (let i = 0; i < data.length; i++) {
          const valid = this.validateRecursive(
            data[i],
            schema.items,
            errors,
            `${path}[${i}]`
          );
          if (!valid) return false;
        }
      }
    }

    // Enum validation
    if (schema.enum) {
      if (!schema.enum.includes(data)) {
        errors.push(`${path}: value not in enum ${JSON.stringify(schema.enum)}`);
        return false;
      }
    }

    return true;
  }

  private attemptRepair(data: any, schema: JSONSchema): any {
    // Basic repair: add missing required fields with defaults
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      const repaired = { ...data };
      
      if (schema.required && schema.properties) {
        for (const key of schema.required) {
          if (!(key in repaired)) {
            const propSchema = schema.properties[key];
            repaired[key] = this.getDefaultValue(propSchema);
          }
        }
      }
      
      return repaired;
    }

    return null;
  }

  private getDefaultValue(schema: JSONSchema): any {
    if (schema.const !== undefined) return schema.const;
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    
    switch (schema.type) {
      case 'string': return '';
      case 'number': return 0;
      case 'integer': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      case 'null': return null;
      default: return null;
    }
  }

  getSchema(): JSONSchema {
    return this.schema;
  }
}

/**
 * Convert schema to OpenAI response_format.json_schema
 */
export function toOpenAISchema(config: StructuredOutputConfig): any {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'response',
      strict: config.strict ?? true,
      schema: config.schema,
    },
  };
}

/**
 * Convert schema to Anthropic tool output schema
 */
export function toAnthropicSchema(config: StructuredOutputConfig): JSONSchema {
  return config.schema;
}

/**
 * Convert schema to Gemini function declaration
 */
export function toGeminiSchema(config: StructuredOutputConfig): any {
  return {
    name: 'generate_response',
    description: 'Generate a structured response',
    parameters: config.schema,
  };
}

/**
 * Normalize schema to JSON Schema 2020-12
 */
export function normalizeSchema(schema: JSONSchema): JSONSchema {
  const normalized = { ...schema };
  
  // Add $schema if not present
  if (!normalized.$schema) {
    normalized.$schema = 'https://json-schema.org/draft/2020-12/schema';
  }
  
  return normalized;
}

/**
 * Validate data against schema
 */
export function validateStructured(data: any, schema: JSONSchema): void {
  const compiled = compileSchema(schema);
  const result = compiled.validate(data);
  
  if (!result.valid) {
    throw new SchemaValidationError(
      `Schema validation failed: ${result.errors?.join(', ')}`,
      result.errors
    );
  }
}

/**
 * Repair data to match schema
 */
export function repairStructured(data: any, schema: JSONSchema): any {
  if (schema.type === 'object' && typeof data === 'object' && data !== null) {
    const repaired: any = {};
    
    // Handle properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          repaired[key] = coerceValue(data[key], propSchema);
        } else if (propSchema.default !== undefined) {
          repaired[key] = propSchema.default;
        }
      }
    }
    
    // Add missing required fields
    if (schema.required && schema.properties) {
      for (const key of schema.required) {
        if (!(key in repaired)) {
          const propSchema = schema.properties[key];
          repaired[key] = propSchema.default !== undefined 
            ? propSchema.default 
            : getDefaultForType(propSchema.type);
        }
      }
    }
    
    // Remove extra properties if additionalProperties is false
    if (schema.additionalProperties === false) {
      // Only include defined properties
      return repaired;
    }
    
    // Include additional properties if allowed
    for (const key in data) {
      if (!(key in repaired)) {
        repaired[key] = data[key];
      }
    }
    
    return repaired;
  }
  
  return coerceValue(data, schema);
}

function coerceValue(value: any, schema: JSONSchema): any {
  if (schema.type === 'number' || schema.type === 'integer') {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }
  
  if (schema.type === 'boolean') {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  }
  
  if (schema.type === 'string') {
    return String(value);
  }
  
  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    const repaired: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          repaired[key] = coerceValue(value[key], propSchema);
        }
      }
    }
    return repaired;
  }
  
  return value;
}

function getDefaultForType(type: any): any {
  switch (type) {
    case 'string': return '';
    case 'number': case 'integer': return 0;
    case 'boolean': return false;
    case 'array': return [];
    case 'object': return {};
    case 'null': return null;
    default: return null;
  }
}


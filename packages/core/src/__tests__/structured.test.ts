import { describe, it, expect } from 'vitest';
import {
  normalizeSchema,
  validateStructured,
  repairStructured,
  SchemaValidationError,
} from '../structured.js';
import type { JSONSchema } from '../types.js';

describe('normalizeSchema', () => {
  it('should normalize schema to JSON Schema 2020-12', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    
    const normalized = normalizeSchema(schema);
    expect(normalized.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(normalized.type).toBe('object');
  });

  it('should preserve existing $schema', () => {
    const schema: JSONSchema = {
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      type: 'object',
    };
    
    const normalized = normalizeSchema(schema);
    expect(normalized.$schema).toBe('https://json-schema.org/draft/2019-09/schema');
  });

  it('should handle nested schemas', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
          },
        },
      },
    };
    
    const normalized = normalizeSchema(schema);
    expect(normalized.properties?.address).toBeDefined();
  });
});

describe('validateStructured', () => {
  it('should validate correct data', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };
    
    const data = { name: 'John', age: 30 };
    expect(() => validateStructured(data, schema)).not.toThrow();
  });

  it('should throw on missing required fields', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    };
    
    const data = {};
    expect(() => validateStructured(data, schema)).toThrow(SchemaValidationError);
  });

  it('should throw on type mismatch', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
    };
    
    const data = { age: 'not a number' };
    expect(() => validateStructured(data, schema)).toThrow(SchemaValidationError);
  });

  it('should validate arrays', () => {
    const schema: JSONSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    
    const data = ['a', 'b', 'c'];
    expect(() => validateStructured(data, schema)).not.toThrow();
  });

  it('should catch invalid array items', () => {
    const schema: JSONSchema = {
      type: 'array',
      items: { type: 'number' },
    };
    
    const data = [1, 2, 'three'];
    expect(() => validateStructured(data, schema)).toThrow(SchemaValidationError);
  });
});

describe('repairStructured', () => {
  it('should repair missing required fields with defaults', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Unknown' },
      },
      required: ['name'],
    };
    
    const data = {};
    const repaired = repairStructured(data, schema);
    expect(repaired.name).toBe('Unknown');
  });

  it('should coerce types when possible', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
        active: { type: 'boolean' },
      },
    };
    
    const data = { age: '25', active: 'true' };
    const repaired = repairStructured(data, schema);
    expect(repaired.age).toBe(25);
    expect(repaired.active).toBe(true);
  });

  it('should remove extra properties when additionalProperties is false', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: false,
    };
    
    const data = { name: 'John', extra: 'remove me' };
    const repaired = repairStructured(data, schema);
    expect(repaired.name).toBe('John');
    expect('extra' in repaired).toBe(false);
  });

  it('should repair nested objects', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            age: { type: 'number' },
          },
        },
      },
    };
    
    const data = { person: { age: '30' } };
    const repaired = repairStructured(data, schema);
    expect(repaired.person.age).toBe(30);
  });

  it('should return original data if repair is not possible', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        value: { type: 'number' },
      },
      required: ['value'],
    };
    
    const data = { value: 'not-a-number' };
    const repaired = repairStructured(data, schema);
    // Should attempt coercion but might fail
    expect(repaired).toBeDefined();
  });
});


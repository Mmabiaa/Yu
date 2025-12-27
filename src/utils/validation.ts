// Validation Utilities for API Data

import { ValidationSchema, ValidationResult, ValidationError } from '../types/api';

export class DataValidator {
  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    this.validateValue(data, schema, '', errors);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateValue(
    value: any,
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    // Check required fields for objects
    if (schema.type === 'object' && schema.required) {
      for (const field of schema.required) {
        if (value == null || !(field in value)) {
          errors.push({
            field: path ? `${path}.${field}` : field,
            message: `Field '${field}' is required`,
            value: undefined,
            rule: 'required',
          });
        }
      }
    }

    // Skip validation if value is null/undefined and not required
    if (value == null) {
      return;
    }

    // Type validation
    if (!this.validateType(value, schema.type)) {
      errors.push({
        field: path,
        message: `Expected type '${schema.type}' but got '${typeof value}'`,
        value,
        rule: 'type',
      });
      return;
    }

    // Type-specific validations
    switch (schema.type) {
      case 'string':
        this.validateString(value, schema, path, errors);
        break;
      case 'number':
        this.validateNumber(value, schema, path, errors);
        break;
      case 'array':
        this.validateArray(value, schema, path, errors);
        break;
      case 'object':
        this.validateObject(value, schema, path, errors);
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value,
        rule: 'enum',
      });
    }
  }

  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private static validateString(
    value: string,
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field: path,
        message: `String must be at least ${schema.minLength} characters long`,
        value,
        rule: 'minLength',
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field: path,
        message: `String must be at most ${schema.maxLength} characters long`,
        value,
        rule: 'maxLength',
      });
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: path,
          message: `String does not match required pattern`,
          value,
          rule: 'pattern',
        });
      }
    }
  }

  private static validateNumber(
    value: number,
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field: path,
        message: `Number must be at least ${schema.min}`,
        value,
        rule: 'min',
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field: path,
        message: `Number must be at most ${schema.max}`,
        value,
        rule: 'max',
      });
    }
  }

  private static validateArray(
    value: any[],
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field: path,
        message: `Array must have at least ${schema.minLength} items`,
        value,
        rule: 'minLength',
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field: path,
        message: `Array must have at most ${schema.maxLength} items`,
        value,
        rule: 'maxLength',
      });
    }

    // Validate array items
    if (schema.items) {
      value.forEach((item, index) => {
        this.validateValue(item, schema.items!, `${path}[${index}]`, errors);
      });
    }
  }

  private static validateObject(
    value: Record<string, any>,
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    if (schema.properties) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        const propertyPath = path ? `${path}.${key}` : key;
        this.validateValue(value[key], propertySchema, propertyPath, errors);
      }
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  email: {
    type: 'string' as const,
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    maxLength: 255,
  },
  
  password: {
    type: 'string' as const,
    minLength: 8,
    maxLength: 128,
  },
  
  uuid: {
    type: 'string' as const,
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
  },
  
  url: {
    type: 'string' as const,
    pattern: '^https?:\\/\\/.+',
  },
  
  phoneNumber: {
    type: 'string' as const,
    pattern: '^\\+?[1-9]\\d{1,14}$',
  },
  
  languageCode: {
    type: 'string' as const,
    pattern: '^[a-z]{2}(-[A-Z]{2})?$',
  },
  
  pagination: {
    type: 'object' as const,
    properties: {
      page: { type: 'number' as const, min: 1 },
      limit: { type: 'number' as const, min: 1, max: 100 },
    },
  },
};
// Validation utilities using Zod

import { z } from "zod";
import type { ColumnDefinition, ValidationRules } from "../types";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Build Zod schema from a single column definition
function buildColumnSchema(col: ColumnDefinition): z.ZodType {
  const v: ValidationRules = col.validation || {};

  let schema: z.ZodType;

  switch (col.type) {
    case "string": {
      let strSchema = z.string();

      // Apply string-specific validations
      if (v.minLength !== undefined) {
        strSchema = strSchema.min(
          v.minLength,
          v.message || `Minimum ${v.minLength} characters required`
        );
      }
      if (v.maxLength !== undefined) {
        strSchema = strSchema.max(
          v.maxLength,
          v.message || `Maximum ${v.maxLength} characters allowed`
        );
      }
      if (v.pattern) {
        strSchema = strSchema.regex(
          new RegExp(v.pattern),
          v.message || `Must match pattern: ${v.pattern}`
        );
      }
      if (v.email) {
        strSchema = strSchema.email(v.message || "Invalid email format");
      }
      if (v.url) {
        strSchema = strSchema.url(v.message || "Invalid URL format");
      }

      // Enum validation - use refine for flexibility
      if (v.enum && v.enum.length > 0) {
        const enumValues = v.enum;
        schema = z.string().refine((val) => enumValues.includes(val), {
          message: v.message || `Must be one of: ${enumValues.join(", ")}`,
        });
      } else {
        schema = strSchema;
      }
      break;
    }

    case "integer": {
      let numSchema = z.coerce.number().int("Must be a whole number");

      if (v.min !== undefined) {
        numSchema = numSchema.min(
          v.min,
          v.message || `Minimum value is ${v.min}`
        );
      }
      if (v.max !== undefined) {
        numSchema = numSchema.max(
          v.max,
          v.message || `Maximum value is ${v.max}`
        );
      }
      schema = numSchema;
      break;
    }

    case "boolean":
      schema = z.coerce.boolean();
      break;

    case "datetime":
      // Accept ISO datetime strings or Date objects
      schema = z.string().refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Invalid datetime format" }
      );
      break;

    case "relation":
      // Relations are just string IDs
      schema = z.string();
      break;

    case "storage":
      // Storage references are strings or arrays of strings
      schema = z.string();
      break;

    default:
      schema = z.any();
  }

  // Handle arrays
  if (col.array && col.type !== "relation") {
    schema = z.array(schema);
  }

  // Handle optional fields - allow empty strings, null, undefined
  if (!col.required) {
    schema = z
      .union([schema, z.literal(""), z.null(), z.undefined()])
      .optional();
  }

  return schema;
}

// Build full table schema from column definitions
export function buildTableSchema(
  columns: ColumnDefinition[]
): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};

  for (const col of columns) {
    // Skip system fields
    if (!col.key.startsWith("$")) {
      shape[col.key] = buildColumnSchema(col);
    }
  }

  return z.object(shape).passthrough(); // passthrough allows extra fields
}

// Validate document against table schema
export function validateDocument(
  data: Record<string, unknown>,
  columns: ColumnDefinition[]
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; errors: ValidationError[] } {
  const schema = buildTableSchema(columns);

  // Filter out system fields from validation
  const dataToValidate: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (!key.startsWith("$")) {
      dataToValidate[key] = data[key];
    }
  }

  const result = schema.safeParse(dataToValidate);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod 4 uses 'issues' property
  const issues = result.error.issues || [];

  return {
    success: false,
    errors: issues.map((issue: z.ZodIssue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: String(issue.code),
    })),
  };
}

// Validate a single field value
export function validateField(
  value: unknown,
  column: ColumnDefinition
): { valid: true } | { valid: false; error: string } {
  const schema = buildColumnSchema(column);
  const result = schema.safeParse(value);

  if (result.success) {
    return { valid: true };
  }

  // Zod 4 uses 'issues' property
  const issues = result.error.issues || [];

  return {
    valid: false,
    error: issues[0]?.message || "Invalid value",
  };
}

// Get validation summary for a column (for UI display)
export function getValidationSummary(
  validation: ValidationRules | undefined
): string[] {
  if (!validation) return [];

  const rules: string[] = [];

  if (validation.minLength !== undefined) {
    rules.push(`Min ${validation.minLength} chars`);
  }
  if (validation.maxLength !== undefined) {
    rules.push(`Max ${validation.maxLength} chars`);
  }
  if (validation.pattern) {
    rules.push(`Pattern: ${validation.pattern}`);
  }
  if (validation.email) {
    rules.push("Email format");
  }
  if (validation.url) {
    rules.push("URL format");
  }
  if (validation.min !== undefined) {
    rules.push(`Min: ${validation.min}`);
  }
  if (validation.max !== undefined) {
    rules.push(`Max: ${validation.max}`);
  }
  if (validation.enum && validation.enum.length > 0) {
    rules.push(`Options: ${validation.enum.join(", ")}`);
  }

  return rules;
}

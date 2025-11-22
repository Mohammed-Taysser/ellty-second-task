import { z, ZodType } from 'zod';

/**
 * Creates a Zod schema that parses a comma-separated string into an array of allowed enum values.
 *
 * This is useful for environment variables or query parameters where a CSV string
 * represents multiple enum values.
 *
 * @template T - The allowed string literal values (enum-like array).
 * @param {readonly T[]} allowedValues - Array of allowed values. Each value must be a string literal.
 * @returns {ZodType<T[]>} - A Zod schema that:
 *   - Transforms a string like `"val1,val2"` into `["val1","val2"]`.
 *   - Validates that each item is included in the `allowedValues` array.
 *   - Throws a ZodError with a clear message if validation fails.
 *
 * @example
 * ```ts
 * const colors = ["red", "green", "blue"] as const;
 * const schema = zodParseEnumList(colors);
 *
 * schema.parse("red,green"); // ✅ ["red", "green"]
 * schema.parse("red,orange");
 * // ❌ ZodError: Must be a comma-separated list of valid enum values: red, green, blue
 * ```
 */
function zodParseEnumList<T>(allowedValues: readonly T[]): ZodType<T[]> {
  return z
    .string()
    .trim()
    .transform((val) => val.split(',').map((s) => s.trim()) as T[])
    .refine((arr) => arr.every((v) => allowedValues.includes(v)), {
      message: `Must be a comma-separated list of valid enum values: ${allowedValues.join(', ')}`,
    });
}

export { zodParseEnumList };

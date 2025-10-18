/**
 * Validation utilities for portfolio data using Zod schemas.
 * Provides type-safe validation with detailed error reporting.
 */

import { z } from "zod";
import { PortfolioDataSchema, type PortfolioData } from "../schemas/portfolio";

/**
 * Custom error class for schema validation failures.
 * Wraps Zod errors with additional helper methods for error handling.
 */
export class SchemaValidationError extends Error {
  /**
   * Creates a new SchemaValidationError.
   *
   * @param message - Human-readable error message
   * @param zodError - The underlying Zod validation error
   */
  constructor(message: string, public readonly zodError: z.ZodError) {
    super(message);
    this.name = "SchemaValidationError";
  }

  /**
   * Gets field-level validation errors in a structured format.
   * Useful for displaying validation errors in forms.
   *
   * @returns Object mapping field paths to arrays of error messages
   *
   * @example
   * ```typescript
   * try {
   *   validatePortfolioData(invalidData);
   * } catch (error) {
   *   if (error instanceof SchemaValidationError) {
   *     const fieldErrors = error.getFieldErrors();
   *     // {
   *     //   "personal_info.email": ["Invalid email"],
   *     //   "work_experiences.0.start_date.month": ["Number must be between 1 and 12"]
   *     // }
   *   }
   * }
   * ```
   */
  getFieldErrors(): Record<string, string[]> {
    return this.zodError.flatten().fieldErrors as Record<string, string[]>;
  }
}

/**
 * Validates portfolio data against the PortfolioData schema.
 * Throws SchemaValidationError if validation fails.
 *
 * @param data - Unknown data to validate
 * @returns Validated and typed PortfolioData
 * @throws {SchemaValidationError} If validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const portfolio = validatePortfolioData(apiResponse);
 *   // portfolio is now typed as PortfolioData
 *   console.log(portfolio.personal_info?.full_name);
 * } catch (error) {
 *   if (error instanceof SchemaValidationError) {
 *     console.error("Validation failed:", error.getFieldErrors());
 *   }
 * }
 * ```
 */
export function validatePortfolioData(data: unknown): PortfolioData {
  const result = PortfolioDataSchema.safeParse(data);

  if (!result.success) {
    throw new SchemaValidationError(
      "Portfolio data validation failed",
      result.error
    );
  }

  return result.data;
}

/**
 * Safely validates portfolio data without throwing errors.
 * Returns a result object indicating success or failure.
 *
 * @param data - Unknown data to validate
 * @returns Result object with success flag and either data or error
 *
 * @example
 * ```typescript
 * const result = validatePortfolioDataSafe(apiResponse);
 *
 * if (result.success) {
 *   console.log("Valid data:", result.data.personal_info?.full_name);
 * } else {
 *   console.error("Validation errors:", result.error.issues);
 * }
 * ```
 */
export function validatePortfolioDataSafe(
  data: unknown
):
  | { success: true; data: PortfolioData }
  | { success: false; error: z.ZodError } {
  const result = PortfolioDataSchema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

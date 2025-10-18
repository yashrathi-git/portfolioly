/**
 * @portfolioly/schema
 *
 * Unified portfolio schema package with Zod validation.
 * Provides type-safe schemas aligned with backend Pydantic models.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * This package provides:
 * - **Zod Schemas**: Runtime validation schemas matching backend Pydantic models
 * - **Backend-Aligned Types**: TypeScript types inferred from Zod schemas
 * - **Display Format Types**: Flattened, string-based types for UI components
 * - **Transformation Utilities**: Functions to convert between backend and display formats
 * - **Validation Utilities**: Type-safe validation with detailed error reporting
 *
 * ## Usage
 *
 * ### Validating API Responses
 *
 * ```typescript
 * import { validatePortfolioData, type PortfolioData } from '@portfolioly/schema';
 *
 * const response = await fetch('/api/portfolio');
 * const data = await response.json();
 * const portfolio: PortfolioData = validatePortfolioData(data);
 * ```
 *
 * ### Transforming for Display
 *
 * ```typescript
 * import { mapBackendToDisplay, type DisplayPortfolioData } from '@portfolioly/schema';
 *
 * const displayData: DisplayPortfolioData = mapBackendToDisplay(portfolio);
 * ```
 *
 * ### Safe Validation
 *
 * ```typescript
 * import { validatePortfolioDataSafe } from '@portfolioly/schema';
 *
 * const result = validatePortfolioDataSafe(data);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */

// ============================================================================
// Core Schemas
// ============================================================================

/**
 * Core Zod schemas for basic portfolio data structures.
 * @module schemas/core
 */
export {
  /** Zod schema for date information with optional month and year */
  DateInfoSchema,
  /** Zod schema for profile/social link types */
  ProfileTypeSchema,
  /** Zod schema for a single profile/social link */
  ProfileSchema,
  /** Date information type with optional month and year */
  type DateInfo,
  /** Profile type for social links */
  type ProfileType,
  /** Profile/social link information */
  type Profile,
} from "./schemas/core";

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * Personal information schema.
 * @module schemas/personal
 */
export {
  /** Zod schema for personal information section */
  PersonalInfoSchema,
  /** Personal information type */
  type PersonalInfo,
} from "./schemas/personal";

/**
 * Work experience schema.
 * @module schemas/work
 */
export {
  /** Zod schema for work experience entries */
  WorkExperienceSchema,
  /** Work experience type */
  type WorkExperience,
} from "./schemas/work";

/**
 * Project schemas.
 * @module schemas/project
 */
export {
  /** Zod schema for project images */
  ProjectImageSchema,
  /** Zod schema for project information */
  ProjectSchema,
  /** Project image type */
  type ProjectImage,
  /** Project information type */
  type Project,
} from "./schemas/project";

/**
 * Education schema.
 * @module schemas/education
 */
export {
  /** Zod schema for education entries */
  EducationSchema,
  /** Education information type */
  type Education,
} from "./schemas/education";

/**
 * Certification schema.
 * @module schemas/certification
 */
export {
  /** Zod schema for certifications */
  CertificationSchema,
  /** Certification information type */
  type Certification,
} from "./schemas/certification";

// ============================================================================
// Metadata and Settings Schemas
// ============================================================================

/**
 * Metadata and settings schemas.
 * @module schemas/metadata
 */
export {
  /** Zod schema for unstructured text information */
  TextBlobsSchema,
  /** Zod schema for layout preference settings */
  LayoutSettingsSchema,
  /** Zod schema for portfolio metadata */
  PortfolioMetadataSchema,
  /** Text blobs type */
  type TextBlobs,
  /** Layout settings type */
  type LayoutSettings,
  /** Portfolio metadata type */
  type PortfolioMetadata,
} from "./schemas/metadata";

// ============================================================================
// Root Portfolio Schema
// ============================================================================

/**
 * Root portfolio data schema.
 * @module schemas/portfolio
 */
export {
  /** Zod schema for complete portfolio data structure */
  PortfolioDataSchema,
  /** Complete portfolio data type */
  type PortfolioData,
} from "./schemas/portfolio";

// ============================================================================
// Display Format Types
// ============================================================================

/**
 * Display format types for UI components.
 * These types represent flattened, string-based data optimized for rendering.
 * @module types/display
 */
export type {
  /** Social platform types for UI display */
  SocialType,
  /** Social link for UI display */
  SocialLink,
  /** Display format for profile information */
  DisplayPortfolioProfile,
  /** Display format for project information */
  DisplayProject,
  /** Display format for education information */
  DisplayEducation,
  /** Display format for work experience information */
  DisplayWorkExperience,
  /** Root display format for complete portfolio data */
  DisplayPortfolioData,
} from "./types/display";

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Date formatting utilities.
 * @module transformers/date-formatter
 */
export {
  /** Formats DateInfo to human-readable string */
  formatDateInfo,
} from "./transformers/date-formatter";

/**
 * Profile to social link mapping utilities.
 * @module transformers/profile-mapper
 */
export {
  /** Maps backend ProfileType to UI SocialType */
  PROFILE_TO_SOCIAL_MAP,
  /** Converts Profile array to SocialLink array */
  mapProfilesToSocials,
} from "./transformers/profile-mapper";

/**
 * Entity mapping utilities.
 * @module transformers/entity-mappers
 */
export {
  /** Maps WorkExperience to DisplayWorkExperience */
  mapWorkExperience,
  /** Maps Project to DisplayProject */
  mapProject,
  /** Maps Education to DisplayEducation */
  mapEducation,
} from "./transformers/entity-mappers";

/**
 * Main transformation function.
 * @module transformers/backend-to-display
 */
export {
  /** Transforms backend PortfolioData to DisplayPortfolioData */
  mapBackendToDisplay,
} from "./transformers/backend-to-display";

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validation utilities with detailed error reporting.
 * @module transformers/validators
 */
export {
  /** Custom error class for schema validation failures */
  SchemaValidationError,
  /** Validates portfolio data, throws on error */
  validatePortfolioData,
  /** Safely validates portfolio data, returns result object */
  validatePortfolioDataSafe,
} from "./transformers/validators";

// ============================================================================
// Package Metadata
// ============================================================================

/**
 * Schema package version.
 * Follows semantic versioning.
 */
export const SCHEMA_VERSION = "0.0.0";

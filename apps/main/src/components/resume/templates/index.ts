/**
 * Resume Templates Index
 *
 * Exports all resume templates and the template registry.
 * Import this file to ensure all templates are registered.
 */

// Export types
export type {
  ResumeTemplateProps,
  SectionRenderer,
  SectionRendererMap,
} from "./types";

// Export registry
export {
  TemplateRegistry,
  registerTemplate,
  type TemplateDefinition,
} from "./registry";

// Import templates to trigger registration
import "./ModernTemplate";
import "./JakeTemplate";

// Export template components for direct use if needed
export { ModernTemplate } from "./ModernTemplate";
export { JakeTemplate } from "./JakeTemplate";

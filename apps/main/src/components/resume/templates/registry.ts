/**
 * Template Registry
 *
 * Central registry for resume templates with automatic discovery.
 * Templates self-register for inclusion in the Template Selector.
 *
 * _Requirements: 9.1, 9.3_
 */

import type { ComponentType } from "react";
import type { ResumeTemplateProps } from "./types";

/**
 * Definition of a resume template for the registry.
 */
export interface TemplateDefinition {
  /** Unique identifier for the template */
  id: string;
  /** Display name for the template */
  name: string;
  /** Brief description of the template style */
  description: string;
  /** Path to thumbnail preview image */
  thumbnail: string;
  /** React component that renders the template */
  component: ComponentType<ResumeTemplateProps>;
}

/**
 * Template Registry for managing available resume templates.
 */
class TemplateRegistryClass {
  private _templates: Map<string, TemplateDefinition> = new Map();
  private _defaultTemplateId: string = "jake";

  /**
   * Register a new template in the registry.
   */
  register(template: TemplateDefinition): void {
    this._templates.set(template.id, template);
  }

  /**
   * Get all registered templates.
   */
  get templates(): TemplateDefinition[] {
    return Array.from(this._templates.values());
  }

  /**
   * Get a template by ID.
   */
  getTemplate(id: string): TemplateDefinition | undefined {
    return this._templates.get(id);
  }

  /**
   * Get the default template.
   */
  getDefaultTemplate(): TemplateDefinition {
    const defaultTemplate = this._templates.get(this._defaultTemplateId);
    if (!defaultTemplate) {
      // Fallback to first registered template
      const first = this._templates.values().next().value;
      if (!first) {
        throw new Error("No templates registered in the registry");
      }
      return first;
    }
    return defaultTemplate;
  }

  /**
   * Set the default template ID.
   */
  setDefaultTemplateId(id: string): void {
    this._defaultTemplateId = id;
  }

  /**
   * Check if a template exists.
   */
  hasTemplate(id: string): boolean {
    return this._templates.has(id);
  }

  /**
   * Get template IDs.
   */
  getTemplateIds(): string[] {
    return Array.from(this._templates.keys());
  }
}

/**
 * Singleton instance of the template registry.
 */
export const TemplateRegistry = new TemplateRegistryClass();

/**
 * Helper function to register a template.
 */
export function registerTemplate(template: TemplateDefinition): void {
  TemplateRegistry.register(template);
}

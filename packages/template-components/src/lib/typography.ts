/**
 * Typography System for Portfolio Components
 *
 * Consistent, readable font sizes across all components
 */

export const typography = {
  // Main content text (descriptions, about sections)
  content: {
    base: "text-sm", // Body text in traditional layout
    medium: "text-[15px]", // Slightly larger for emphasis
    responsive: "text-sm md:text-base", // Responsive body text
  },

  // Chat input field
  input: {
    base: "text-sm",
    responsive: "text-sm md:text-[15px]",
  },

  // Headings
  heading: {
    primary: "text-xl sm:text-2xl", // Main titles
    secondary: "text-lg sm:text-xl", // Widget/section headings
    tertiary: "text-base sm:text-lg", // Sub-headings (project names, company names)
  },

  // Labels and metadata
  label: {
    base: "text-sm", // Standard labels (role, location)
    small: "text-xs sm:text-sm", // Smaller metadata
    tiny: "text-[11px]", // Tags, badges
  },
} as const;

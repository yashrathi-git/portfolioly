/**
 * Typography System for Portfolio Chat App
 * 
 * Consistent font sizes across all components
 */

export const typography = {
  // Main content text (chat messages, widget descriptions)
  content: {
    base: "text-[15px]",
    responsive: "text-[15px] md:text-base",
  },
  
  // Chat input field
  input: {
    base: "text-sm",
    responsive: "text-sm md:text-[15px]",
  },
  
  // Headings
  heading: {
    primary: "text-xl sm:text-2xl", // Main titles (AboutWidget name)
    secondary: "text-lg sm:text-xl", // Widget headings
    tertiary: "text-base sm:text-[17px]", // Sub-headings (project names, company names)
  },
  
  // Labels and metadata
  label: {
    base: "text-sm", // Standard labels (role, location)
    small: "text-xs sm:text-[13px]", // Smaller metadata
    tiny: "text-[11px]", // Tags, badges
  },
} as const;

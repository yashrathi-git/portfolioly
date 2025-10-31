/**
 * Animation constants for consistent timing across all widgets and components
 *
 * These values are used with the BlurFade animation component to ensure
 * a cohesive and professional animation experience throughout the portfolio.
 */

/**
 * Base delay between sequential BlurFade animations
 * Used as a multiplier for staggered animations
 */
export const BLUR_FADE_DELAY = 0.04;

/**
 * Animation duration for BlurFade effects
 * Controls how long the fade-in and blur transition takes
 */
export const ANIMATION_DURATION = 0.4;

/**
 * Vertical offset for BlurFade animations
 * Controls how far elements move during the animation
 */
export const Y_OFFSET = 6;

/**
 * Blur amount for BlurFade animations
 * Controls the initial blur intensity
 */
export const BLUR_AMOUNT = "6px";

/**
 * Widget-specific animation constants
 * These provide consistent timing for chat widgets
 */
export const WIDGET_ANIMATION = {
  /** Base delay for widget animations */
  delay: BLUR_FADE_DELAY,
  /** Animation duration */
  duration: ANIMATION_DURATION,
  /** Vertical offset */
  yOffset: Y_OFFSET,
  /** Blur amount */
  blur: BLUR_AMOUNT,
  /** Stagger delay for list items within widgets */
  staggerDelay: 0.02,
} as const;

/**
 * Traditional portfolio section delays
 * These multipliers are used with BLUR_FADE_DELAY to sequence sections
 */
export const SECTION_DELAYS = {
  hero: 0,
  avatar: 1.5,
  socials: 2,
  about: 3,
  aboutContent: 4,
  workExperience: 5,
  education: 7,
  skills: 9,
  skillsItems: 10,
  projects: 11,
} as const;

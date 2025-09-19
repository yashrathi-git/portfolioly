// Theme utilities and constants
export const THEME_STORAGE_KEY = "theme";
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];

// Get the theme initialization script as a string
export function getThemeScript(): string {
  return `
    (function() {
      try {
        const stored = localStorage.getItem('${THEME_STORAGE_KEY}');
        const shouldUseDark = stored === '${THEMES.DARK}';
        
        if (shouldUseDark) {
          document.documentElement.classList.add('${THEMES.DARK}');
        } else {
          document.documentElement.classList.remove('${THEMES.DARK}');
        }
      } catch (e) {
        // Fallback to light mode if localStorage fails
        document.documentElement.classList.remove('${THEMES.DARK}');
      }
    })();
  `;
}

// Client-side theme utilities
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  } catch {
    return THEMES.LIGHT;
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;

  const isDark = theme === THEMES.DARK;
  document.documentElement.classList.toggle(THEMES.DARK, isDark);
}

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return THEMES.LIGHT;

  return document.documentElement.classList.contains(THEMES.DARK)
    ? THEMES.DARK
    : THEMES.LIGHT;
}

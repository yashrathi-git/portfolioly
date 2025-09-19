"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getCurrentTheme,
  setStoredTheme,
  applyTheme,
  THEMES,
  type Theme,
} from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(THEMES.LIGHT);

  // Initialize theme from DOM on mount
  useEffect(() => {
    const current = getCurrentTheme();
    setTheme(current);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
    applyTheme(newTheme);
    setStoredTheme(newTheme);
  }, [theme]);

  const setThemeMode = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setStoredTheme(newTheme);
  }, []);

  return {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setTheme: setThemeMode,
  };
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppThemeId } from "@/lib/theme/constants";
import {
  APP_THEMES,
  MAPBOX_STYLE_BY_THEME,
  ROUTE_LINE_BY_THEME,
} from "@/lib/theme/constants";

const STORAGE_KEY = "smart-route-theme";

type ThemeContextValue = {
  theme: AppThemeId;
  setTheme: (t: AppThemeId) => void;
  mapStyleUrl: string;
  routeLineColor: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): AppThemeId | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw && APP_THEMES.includes(raw as AppThemeId))
    return raw as AppThemeId;
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
      return;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
      .matches;
    setThemeState(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.appTheme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" || theme === "illuminated" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: AppThemeId) => setThemeState(t), []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      mapStyleUrl: MAPBOX_STYLE_BY_THEME[theme],
      routeLineColor: ROUTE_LINE_BY_THEME[theme],
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme debe usarse dentro de ThemeProvider");
  return ctx;
}

export type AppThemeId = "dark" | "light" | "illuminated" | "satellite";

export const APP_THEMES: readonly AppThemeId[] = [
  "dark",
  "light",
  "illuminated",
  "satellite",
];

export const MAPBOX_STYLE_BY_THEME: Record<AppThemeId, string> = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
  illuminated: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

/** Color de la línea de ruta elegida encima del estilo base. */
export const ROUTE_LINE_BY_THEME: Record<AppThemeId, string> = {
  dark: "#38bdf8",
  light: "#0284c7",
  illuminated: "#7c3aed",
  satellite: "#fbbf24",
};

/**
 * Tipos compartidos del motor de rutas (frontend ↔ futuro backend).
 */

export type TransportMode = "bus" | "cycling" | "walking";

export type UserProfile = "PRISA" | "ECO" | "SEGURIDAD";

/** Tramo homogéneo en un solo modo; las APIs suelen devolver legs similares. */
export type RouteLeg = {
  mode: TransportMode;
  durationMinutes: number;
  distanceKm: number;
};

/** Métricas agregadas que pueden venir calculadas del backend o estimarse localmente. */
export type RouteMetrics = {
  /** Gramos CO₂ equivalente aproximados para todo el itinerario. */
  estimatedCo2Grams: number;
  /** 0–1, mayor = más seguro (iluminación, vías tranquilas, datos históricos). */
  safetyIndex: number;
  /** 0–1, mayor = más exposición a tráfico denso / conflictos. */
  trafficExposureIndex: number;
};

export type LineStringGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RouteCandidate = {
  id: string;
  label: string;
  legs: RouteLeg[];
  metrics: RouteMetrics;
  /**
   * Geometría listísima para Mapbox `geojson` source.
   * En backend sería opcional y se podría omitir hasta Directions API.
   */
  geometry: LineStringGeometry;
};

export type RoutePlanningRequest = {
  origin: { lng: number; lat: number };
  destination: { lng: number; lat: number };
  profile: UserProfile;
  departureTime?: string;
};

export type ScoringBreakdown = {
  durationCost: number;
  sustainabilityCost: number;
  calmCost: number;
  weightedTotal: number;
};

export type ScoredRoute = {
  candidate: RouteCandidate;
  breakdown: ScoringBreakdown;
};

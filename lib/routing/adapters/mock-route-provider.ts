import type { IRouteProvider } from "./route-provider.types";
import type {
  LineStringGeometry,
  RouteCandidate,
  RoutePlanningRequest,
} from "../types";

/** Santander — geometrías sintéticas para demo / tests de scoring. */
const G_FAST_TRANSIT: LineStringGeometry = {
  type: "LineString",
  coordinates: [
    [-3.8218, 43.4695],
    [-3.8154, 43.4663],
    [-3.8094, 43.4624],
    [-3.8042, 43.4594],
    [-3.7988, 43.4569],
  ],
};

const G_ACTIVE_MOBILITY: LineStringGeometry = {
  type: "LineString",
  coordinates: [
    [-3.8249, 43.4668],
    [-3.8186, 43.4645],
    [-3.8131, 43.4619],
    [-3.8069, 43.4593],
    [-3.8015, 43.4572],
    [-3.7972, 43.4555],
  ],
};

const G_CALM_MIX: LineStringGeometry = {
  type: "LineString",
  coordinates: [
    [-3.8235, 43.4712],
    [-3.8188, 43.4678],
    [-3.8142, 43.4655],
    [-3.8098, 43.4632],
    [-3.8055, 43.461],
    [-3.8012, 43.4588],
    [-3.7975, 43.457],
  ],
};

const G_HIGHWAY_BUS: LineStringGeometry = {
  type: "LineString",
  coordinates: [
    [-3.8255, 43.468],
    [-3.8175, 43.465],
    [-3.8075, 43.4615],
    [-3.7995, 43.4575],
  ],
};

const MOCK_CANDIDATES: RouteCandidate[] = [
  {
    id: "opt-a-transit-direct",
    label: "Línea directa · bus urbano",
    legs: [
      { mode: "bus", durationMinutes: 17, distanceKm: 6.2 },
      { mode: "walking", durationMinutes: 5, distanceKm: 0.45 },
    ],
    metrics: {
      estimatedCo2Grams: 205,
      safetyIndex: 0.71,
      trafficExposureIndex: 0.52,
    },
    geometry: G_FAST_TRANSIT,
  },
  {
    id: "opt-b-active",
    label: "Ruta activa · bici y caminar",
    legs: [
      { mode: "cycling", durationMinutes: 21, distanceKm: 5.8 },
      { mode: "walking", durationMinutes: 14, distanceKm: 1.05 },
    ],
    metrics: {
      estimatedCo2Grams: 12,
      safetyIndex: 0.84,
      trafficExposureIndex: 0.22,
    },
    geometry: G_ACTIVE_MOBILITY,
  },
  {
    id: "opt-c-calm-mixed",
    label: "Mix tranquilo · prioriza vías calmadas",
    legs: [
      { mode: "walking", durationMinutes: 22, distanceKm: 1.9 },
      { mode: "cycling", durationMinutes: 16, distanceKm: 4.1 },
      { mode: "bus", durationMinutes: 9, distanceKm: 2.8 },
    ],
    metrics: {
      estimatedCo2Grams: 78,
      safetyIndex: 0.92,
      trafficExposureIndex: 0.15,
    },
    geometry: G_CALM_MIX,
  },
  {
    id: "opt-d-express-bus",
    label: "Expreso · máximo bus en vía rápida",
    legs: [
      { mode: "bus", durationMinutes: 14, distanceKm: 7.4 },
      { mode: "walking", durationMinutes: 4, distanceKm: 0.35 },
    ],
    metrics: {
      estimatedCo2Grams: 268,
      safetyIndex: 0.57,
      trafficExposureIndex: 0.74,
    },
    geometry: G_HIGHWAY_BUS,
  },
];

/**
 * Proveedor local para desarrollo.
 * Sustituible por cliente HTTP sin cambiar UI ni motor de scoring.
 */
export class MockRouteProvider implements IRouteProvider {
  async fetchRouteOptions(
    _request: RoutePlanningRequest,
  ): Promise<RouteCandidate[]> {
    await Promise.resolve();
    return MOCK_CANDIDATES.map((c) => ({
      ...c,
      legs: c.legs.map((l) => ({ ...l })),
      metrics: { ...c.metrics },
      geometry: {
        type: "LineString",
        coordinates: [...c.geometry.coordinates],
      },
    }));
  }
}

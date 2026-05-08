import type { RouteCandidate } from "../types";

/** FeatureCollection para `Source type="geojson"` en Mapbox / react-map-gl. */
export type RouteFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      routeId: string;
      label: string;
      selected?: boolean;
    };
    geometry: RouteCandidate["geometry"];
  }>;
};

export function candidateToFeatureCollection(
  candidate: RouteCandidate,
  selected = true,
): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          routeId: candidate.id,
          label: candidate.label,
          selected,
        },
        geometry: candidate.geometry,
      },
    ],
  };
}

/** Puente futuro Mapbox Directions → dominio interno. */
export function stubFromMapboxDirections(
  _directionsResponse: unknown,
): RouteCandidate[] {
  throw new Error(
    "Puente Mapbox Directions sin implementar: usa MockRouteProvider o tu adaptador HTTP.",
  );
}

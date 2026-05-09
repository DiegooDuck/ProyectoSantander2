import type {
  BikeShareRecord,
  BusStopRecord,
  TrafficSegmentRecord,
} from "./types";

/** GeoJSON mínimo consumible por Mapbox `Source type="geojson"`. */
export type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry:
      | { type: "Point"; coordinates: [number, number] }
      | { type: "LineString"; coordinates: [number, number][] };
  }>;
};

export function busStopsToGeoJSON(stops: BusStopRecord[]): GeoFeatureCollection {
  return {
    type: "FeatureCollection",
    features: stops.map((s) => ({
      type: "Feature",
      properties: {
        id: s.id,
        name: s.name,
        lines: s.lines.join(", "),
      },
      geometry: {
        type: "Point",
        coordinates: [s.lng, s.lat],
      },
    })),
  };
}

export function bikeShareToGeoJSON(bikes: BikeShareRecord[]): GeoFeatureCollection {
  return {
    type: "FeatureCollection",
    features: bikes.map((b) => ({
      type: "Feature",
      properties: {
        id: b.id,
        name: b.name,
        availableBikes: b.availableBikes,
        availableDocks: b.availableDocks,
      },
      geometry: {
        type: "Point",
        coordinates: [b.lng, b.lat],
      },
    })),
  };
}

export function trafficToGeoJSON(segments: TrafficSegmentRecord[]): GeoFeatureCollection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features: any[] = [];
  segments.forEach((t) => {
    t.coordinates.forEach((coord) => {
      features.push({
        type: "Feature",
        properties: {
          id: t.id,
          severity: t.severity,
        },
        geometry: {
          type: "Point",
          coordinates: coord,
        },
      });
    });
  });
  return {
    type: "FeatureCollection",
    features,
  };
}

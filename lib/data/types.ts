import type { RouteCandidate } from "@/lib/routing";

/** Contratos JSON mock ↔ futura API (misma forma que expondría el backend). */

export type DatasetMeta = {
  updatedAt: string;
  region: string;
  source: string;
};

export type RoutesDatasetFile = {
  version: string;
  meta: DatasetMeta;
  items: RouteCandidate[];
};

export type BusStopRecord = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  lines: string[];
};

export type BusStopsDatasetFile = {
  version: string;
  meta: DatasetMeta;
  items: BusStopRecord[];
};

export type BikeShareRecord = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  availableDocks: number;
  availableBikes: number;
};

export type BikeShareDatasetFile = {
  version: string;
  meta: DatasetMeta;
  items: BikeShareRecord[];
};

export type TrafficSeverity = "low" | "moderate" | "heavy";

export type TrafficSegmentRecord = {
  id: string;
  severity: TrafficSeverity;
  coordinates: [number, number][];
};

export type TrafficDatasetFile = {
  version: string;
  meta: DatasetMeta;
  items: TrafficSegmentRecord[];
};

/** Respuesta agregada tipo “bundle” que podría servir `GET /v1/map-data`. */
export type MapDataBundle = {
  routes: RoutesDatasetFile;
  busStops: BusStopsDatasetFile;
  bikeShare: BikeShareDatasetFile;
  traffic: TrafficDatasetFile;
  bikeLanes?: any | null;
};

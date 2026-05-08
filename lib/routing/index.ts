import type { IRouteProvider } from "./adapters/route-provider.types";
import { MockRouteProvider } from "./adapters/mock-route-provider";

let singleton: IRouteProvider | null = null;

/** Punto único para inyectar proveedor (tests, flags, cliente HTTP). */
export function getRouteProvider(): IRouteProvider {
  if (!singleton) singleton = new MockRouteProvider();
  return singleton;
}

export function setRouteProvider(provider: IRouteProvider): void {
  singleton = provider;
}

export type {
  IRouteProvider,
} from "./adapters/route-provider.types";

export type {
  RouteCandidate,
  RouteLeg,
  RouteMetrics,
  RoutePlanningRequest,
  ScoredRoute,
  TransportMode,
  UserProfile,
} from "./types";

export {
  PROFILE_COPY,
  PROFILE_WEIGHTS,
  ALL_PROFILES,
} from "./profiles";

export {
  scoreAllCandidates,
  scoreRoute,
  selectBestRoute,
} from "./scoring";

export {
  candidateToFeatureCollection,
  stubFromMapboxDirections,
  type RouteFeatureCollection,
} from "./mapbox/route-to-geojson";

import type {
  RouteCandidate,
  RoutePlanningRequest,
} from "../types";

/**
 * Contrato estable para backend / Mapbox Directions / APIs OT.
 * El servidor puede devolver `RouteCandidate[]` ya normalizado oDTO crudo + normalizador.
 */
export interface IRouteProvider {
  fetchRouteOptions(request: RoutePlanningRequest): Promise<RouteCandidate[]>;
}

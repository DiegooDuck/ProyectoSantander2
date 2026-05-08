import type { IRouteProvider } from "./route-provider.types";
import type { RouteCandidate, RoutePlanningRequest } from "../types";

/**
 * Esqueleto para cliente HTTP (Edge/BFF). Implementar `fetch` + normalización DTO → `RouteCandidate`.
 */
export class HttpRouteProvider implements IRouteProvider {
  constructor(private readonly baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async fetchRouteOptions(
    _request: RoutePlanningRequest,
  ): Promise<RouteCandidate[]> {
    void _request;
    throw new Error(
      `HttpRouteProvider no implementado. POST ${this.baseUrl}/v1/routes`,
    );
  }
}

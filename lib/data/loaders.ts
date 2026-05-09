import type { MapDataBundle } from "./types";
import { loadSantanderBikeData, fetchSantanderBusStops } from "./santander-api";

import routesMock from "../../data/routes.mock.json";
import busStopsMock from "../../data/bus-stops.mock.json";
import bikeShareMock from "../../data/bike-share.mock.json";
import trafficMock from "../../data/traffic.mock.json";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simula latencia de red (retíralo cuando exista API real). */
const MOCK_LATENCY_MS = 45;

/**
 * Carga desde JSON locales (equivalente a respuesta API versionada).
 * En producción: `fetch(`${baseUrl}/map-data`)` y validación de esquema.
 */
export async function loadMapDataBundleFromFiles(): Promise<MapDataBundle> {
  await sleep(MOCK_LATENCY_MS);
  return {
    routes: routesMock as MapDataBundle["routes"],
    busStops: busStopsMock as MapDataBundle["busStops"],
    bikeShare: bikeShareMock as MapDataBundle["bikeShare"],
    traffic: trafficMock as MapDataBundle["traffic"],
  };
}

/**
 * Carga datos desde la API de Santander (GitHub) y mocks locales para otros datos.
 */
export async function loadMapDataBundleFromSantanderApi(): Promise<MapDataBundle> {
  await sleep(MOCK_LATENCY_MS);
  
  try {
    // Cargar datos de bicicletas y bus desde la API de Santander
    const [bikeShare, busStopsApi] = await Promise.all([
      loadSantanderBikeData(),
      fetchSantanderBusStops()
    ]);
    
    return {
      routes: routesMock as MapDataBundle["routes"],
      busStops: busStopsApi || (busStopsMock as MapDataBundle["busStops"]),
      bikeShare,
      traffic: trafficMock as MapDataBundle["traffic"],
    };
  } catch (error) {
    console.error("Error loading Santander API data, falling back to mocks:", error);
    // Fallback a datos locales si falla la API
    return loadMapDataBundleFromFiles();
  }
}

/**
 * Punto de extensión HTTP: mismo contrato que los mocks.
 * Implementar cuando el BFF exponga `/v1/map-data` o recursos separados.
 */
export async function loadMapDataBundleFromApi(
  baseUrl: string,
): Promise<MapDataBundle> {
  const root = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${root}/v1/map-data`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`map-data ${res.status}`);
  return res.json() as Promise<MapDataBundle>;
}

export async function resolveMapDataBundle(): Promise<MapDataBundle> {
  const apiBase = process.env.NEXT_PUBLIC_SMART_ROUTE_DATA_API;
  if (apiBase && apiBase.length > 0) {
    return loadMapDataBundleFromApi(apiBase);
  }
  
  // Usar API de Santander por defecto para datos en tiempo real
  const useSantanderApi = process.env.NEXT_PUBLIC_USE_SANTANDER_API !== "false";
  if (useSantanderApi) {
    return loadMapDataBundleFromSantanderApi();
  }
  
  return loadMapDataBundleFromFiles();
}

import type { BikeShareRecord, BikeShareDatasetFile, DatasetMeta, BusStopRecord, BusStopsDatasetFile } from "./types";
import type { GeoFeatureCollection } from "./geojson-builders";

// Tipos para los datos del GitHub de Santander
interface SantanderBikeStation {
  id: string;
  type: "BikeHireDockingStation";
  availableBikeNumber: Array<{
    type: "Property";
    value: number;
    instanceId: string;
    observedAt: string;
  }>;
  location?: {
    type: "GeoProperty";
    value: {
      type: "Point";
      coordinates: [number, number]; // [lon, lat]
    };
  };
  name?: Array<{
    type: "Property";
    value: string;
  }>;
  totalSlotNumber?: Array<{
    type: "Property";
    value: number;
  }>;
}

interface SantanderBikeRoute {
  // Estructura de rutas si la necesitamos más adelante
}

// Base URL para los datasets de Santander
const SANTANDER_DATA_BASE = "https://raw.githubusercontent.com/Sedimark/hackathon-santander-datasets/main";

/**
 * Obtiene los datos más recientes de estaciones de bicicletas de Santander
 */
export async function fetchSantanderBikeStations(): Promise<SantanderBikeStation[]> {
  try {
    // Intentar con el archivo más reciente (Febrero 2025)
    const response = await fetch(`${SANTANDER_DATA_BASE}/Santander_E-BikesStationsStatus_Feb25.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as SantanderBikeStation[];
  } catch (error) {
    console.error("Error fetching Santander bike stations:", error);
    // Fallback a un dataset más antiguo si falla
    try {
      const fallbackResponse = await fetch(`${SANTANDER_DATA_BASE}/Santander_E-BikesStationsStatus_Jan25.json`);
      if (fallbackResponse.ok) {
        return await fallbackResponse.json();
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    throw new Error("No se pudieron cargar los datos de estaciones de bicicletas");
  }
}

/**
 * Transforma los datos del formato de Santander al formato esperado por la app
 */
export function transformSantanderToAppFormat(stations: SantanderBikeStation[]): BikeShareDatasetFile {
  const meta: DatasetMeta = {
    updatedAt: new Date().toISOString(),
    region: "Santander",
    source: "Sedimark GitHub API"
  };

  const items: BikeShareRecord[] = stations
    .filter(station => station.location && station.location.value && station.location.value.coordinates)
    .map(station => {
      const [lng, lat] = station.location!.value.coordinates;
      const latestStatus = station.availableBikeNumber?.[0]; // El más reciente está primero
      
      // Obtener nombre si está disponible
      const name = station.name?.[0]?.value || `Estación ${station.id.split(':').pop()}`;
      
      // Calcular docks disponibles (total - disponibles)
      const totalSlots = station.totalSlotNumber?.[0]?.value || 20; // Valor por defecto si no está disponible
      const availableBikes = latestStatus?.value || 0;
      const availableDocks = Math.max(0, totalSlots - availableBikes);

      return {
        id: station.id,
        name,
        lng,
        lat,
        availableDocks,
        availableBikes
      };
    })
    .filter(station => !isNaN(station.lng) && !isNaN(station.lat)); // Filtrar coordenadas inválidas

  return {
    version: "1",
    meta,
    items
  };
}

/**
 * Carga y transforma los datos de bicicletas de Santander
 */
export async function loadSantanderBikeData(): Promise<BikeShareDatasetFile> {
  const stations = await fetchSantanderBikeStations();
  return transformSantanderToAppFormat(stations);
}

/**
 * Obtiene datos de rutas de bicicletas de Santander (opcional para futuras funcionalidades)
 */
export async function fetchSantanderBikeRoutes(): Promise<any[]> {
  try {
    // Obtener la semana más reciente disponible
    const response = await fetch(`${SANTANDER_DATA_BASE}/Santander_E-bikesRoutes_2025_W08.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching Santander bike routes:", error);
    return [];
  }
}

export async function fetchSantanderBusStops(): Promise<BusStopsDatasetFile | null> {
  try {
    const res = await fetch("/api/santander/bus-stops");
    if (!res.ok) throw new Error("Fallo al obtener paradas de bus desde el proxy");
    const data = await res.json();
    if (!data.resources) return null;

    const items: BusStopRecord[] = data.resources.map((r: any) => ({
      id: r["dc:identifier"] || r["ayto:numero"],
      name: r["ayto:parada"] || r["vivo:address1"],
      lng: parseFloat(r["wgs84_pos:long"]),
      lat: parseFloat(r["wgs84_pos:lat"]),
      lines: [] // Líneas no siempre están disponibles directamente en este endpoint
    })).filter((s: BusStopRecord) => !isNaN(s.lng) && !isNaN(s.lat));

    return {
      version: "1",
      meta: {
        updatedAt: new Date().toISOString(),
        region: "Santander",
        source: "datos.santander.es"
      },
      items
    };
  } catch (err) {
    console.error("Error en fetchSantanderBusStops:", err);
    return null;
  }
}

/**
 * Carga carriles bici desde el proxy de Santander y los transforma a GeoJSON.
 */
export async function fetchSantanderBikeLanes(): Promise<GeoFeatureCollection | null> {
  try {
    const res = await fetch("/api/santander/bike-lanes");
    if (!res.ok) throw new Error("Error fetching bike lanes");
    const data = await res.json();
    const resources = data.resources || [];

    const features = resources.map((r: any) => {
      const wkt = r["ayto:WKT"];
      if (!wkt || !wkt.startsWith("LINESTRING")) return null;

      // Parsear LINESTRING ( X Y, X Y, ... )
      const coordsMatch = wkt.match(/\((.*)\)/);
      if (!coordsMatch) return null;

      const coordinates = coordsMatch[1].split(",").map((pair: string) => {
        const [lng, lat] = pair.trim().split(" ").map(Number);
        return [lng, lat];
      });

      return {
        type: "Feature",
        properties: {
          id: r["dc:identifier"],
          estado: r["ayto:Estado"],
          modified: r["dc:modified"],
        },
        geometry: {
          type: "LineString",
          coordinates,
        },
      };
    }).filter((f: any) => f !== null);

    return {
      type: "FeatureCollection",
      features,
    };
  } catch (error) {
    console.error("fetchSantanderBikeLanes error:", error);
    return null;
  }
}

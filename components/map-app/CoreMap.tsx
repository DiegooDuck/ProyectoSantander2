"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Layer, Source, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User } from "lucide-react";
import type { RouteFeatureCollection } from "@/lib/routing";
import type { GeoFeatureCollection } from "@/lib/data";

const INITIAL_VIEW = {
  longitude: -3.80998,
  latitude: 43.46231,
  zoom: 12.35,
  pitch: 0,
  bearing: 0,
} as const;

const SRC_ROUTE = "sr-route";
const SRC_BUS = "sr-bus";
const SRC_BIKE = "sr-bike";
const SRC_TRAFFIC = "sr-traffic";

export type MapLayerVisibility = {
  buses: boolean;
  bikes: boolean;
  traffic: boolean;
};

export type CoreMapProps = {
  className?: string;
  mapStyleUrl: string;
  routeLineColor: string;
  routeGeoJSON: RouteFeatureCollection | null;
  busGeoJSON: GeoFeatureCollection | null;
  bikeGeoJSON: GeoFeatureCollection | null;
  trafficGeoJSON: GeoFeatureCollection | null;
  layers: MapLayerVisibility;
  onSelectStop?: (lng: number, lat: number, name: string) => void;
  userLocation: { lng: number; lat: number } | null;
};

export function CoreMap({
  className,
  mapStyleUrl,
  routeLineColor,
  routeGeoJSON,
  busGeoJSON,
  bikeGeoJSON,
  trafficGeoJSON,
  layers,
  onSelectStop,
  userLocation,
}: CoreMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  useEffect(() => {
    if (!mapReady || !userLocation || hasCenteredOnUser) return;
    
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        duration: 2000
      });
      setHasCenteredOnUser(true);
    }
  }, [mapReady, userLocation, hasCenteredOnUser]);

  const fitRoute = useCallback((data: RouteFeatureCollection) => {
    const map = mapRef.current?.getMap();
    if (!map || data.features.length === 0) return;
    const coords = data.features[0]?.geometry.coordinates;
    if (!coords?.length) return;

    const bounds = coords.reduce(
      (b, coord) => b.extend(coord as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );

    map.fitBounds(bounds, {
      padding: { top: 96, bottom: 200, left: 48, right: 48 },
      duration: 850,
      maxZoom: 13.9,
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !routeGeoJSON?.features.length) return;
    fitRoute(routeGeoJSON);
  }, [routeGeoJSON, mapReady, fitRoute]);

  const onLoad = useCallback(() => setMapReady(true), []);

  const onMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    if (!onSelectStop) return;

    // Verificar si se hizo clic en una parada de bus
    const features = event.features;
    if (features && features.length > 0) {
      const stop = features[0];
      const layerId = stop.layer?.id;
      if (layerId === "sr-bus-core" || layerId === "sr-bus-halo") {
        const coordinates = (stop.geometry as any).coordinates;
        const name = stop.properties?.["ayto:NombreParada"] || "Parada de autobús";
        onSelectStop(coordinates[0], coordinates[1], name);
      }
    }
  }, [onSelectStop]);

  if (!token) {
    return (
      <div
        className={`flex h-full min-h-[12rem] w-full flex-col items-center justify-center gap-2 bg-zinc-900 px-4 text-center ${className ?? ""}`}
      >
        <p className="text-sm font-medium text-zinc-300">Mapa no disponible</p>
        <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
          Configura{" "}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-[0.65rem] text-emerald-400/90">
            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </code>
          .
        </p>
      </div>
    );
  }

  const showRoute = Boolean(routeGeoJSON?.features.length);
  const showBus =
    layers.buses && Boolean(busGeoJSON?.features.length);
  const showBike =
    layers.bikes && Boolean(bikeGeoJSON?.features.length);
  const showTraffic =
    layers.traffic && Boolean(trafficGeoJSON?.features.length);

  return (
    <div className={`relative h-full w-full min-h-0 overflow-hidden ${className ?? ""}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle={mapStyleUrl}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        reuseMaps={false}
        cooperativeGestures
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        maxPitch={0}
        antialias={false}
        projection={{ name: "mercator" }}
        onLoad={onLoad}
        onClick={onMapClick}
        interactiveLayerIds={["sr-bus-core", "sr-bus-halo"]}
        cursor="pointer"
      >
        {showTraffic ? (
          <Source id={SRC_TRAFFIC} type="geojson" data={trafficGeoJSON!}>
            <Layer
              id="sr-traffic-heatmap"
              type="heatmap"
              paint={{
                "heatmap-weight": [
                  "match",
                  ["get", "severity"],
                  "heavy", 1,
                  "moderate", 0.5,
                  0.2
                ],
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 1,
                  15, 3
                ],
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(0, 0, 0, 0)",
                  0.2, "rgba(107, 33, 168, 0.4)",
                  0.4, "rgba(192, 38, 211, 0.6)",
                  0.6, "rgba(225, 29, 72, 0.8)",
                  0.8, "rgba(239, 68, 68, 0.9)",
                  1, "rgba(252, 211, 77, 1)"
                ],
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10, 20,
                  15, 50,
                  20, 100
                ],
                "heatmap-opacity": 0.85
              }}
            />
          </Source>
        ) : null}

        {showBus ? (
          <Source id={SRC_BUS} type="geojson" data={busGeoJSON!}>
            <Layer
              id="sr-bus-halo"
              type="circle"
              paint={{
                "circle-radius": [
                  "interpolate", ["linear"], ["zoom"],
                  10, 8,
                  15, 20
                ],
                "circle-color": "#0ea5e9", // cyan-500
                "circle-blur": 0.8,
                "circle-opacity": 0.7,
              }}
            />
            <Layer
              id="sr-bus-core"
              type="circle"
              paint={{
                "circle-radius": [
                  "interpolate", ["linear"], ["zoom"],
                  10, 4,
                  15, 12
                ],
                "circle-color": "#f0f9ff", // sky-50
                "circle-stroke-width": 2,
                "circle-stroke-color": "#0284c7", // sky-600
                "circle-opacity": 0.9,
              }}
            />
            <Layer
              id="sr-bus-icon"
              type="symbol"
              layout={{
                "icon-image": "bus-15",
                "icon-size": [
                  "interpolate", ["linear"], ["zoom"],
                  10, 0.5,
                  15, 1.2
                ],
                "icon-allow-overlap": true,
              }}
            />
          </Source>
        ) : null}

        {showBike ? (
          <Source id={SRC_BIKE} type="geojson" data={bikeGeoJSON!}>
            <Layer
              id="sr-bike-circles"
              type="circle"
              paint={{
                "circle-radius": 5,
                "circle-color": "#34d399",
                "circle-opacity": 0.92,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#064e3b",
              }}
            />
          </Source>
        ) : null}

        {showRoute ? (
          <Source id={SRC_ROUTE} type="geojson" data={routeGeoJSON!}>
            <Layer
              id="sr-route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": routeLineColor,
                "line-width": 6,
                "line-opacity": 0.95,
              }}
            />
          </Source>
        ) : null}

        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="bottom"
          >
            <div className="relative flex items-center justify-center">
              {/* Efecto de pulso/onda expansiva */}
              <div className="absolute h-12 w-12 animate-ping rounded-full bg-indigo-500/30"></div>
              <div className="absolute h-8 w-8 animate-pulse rounded-full bg-indigo-500/50"></div>
              
              {/* Personaje / Icono */}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-xl transition-transform hover:scale-110">
                <User className="h-6 w-6" />
                
                {/* Indicador de dirección sutil */}
                <div className="absolute -top-1 right-0 h-3 w-3 rounded-full border border-white bg-emerald-400"></div>
              </div>
              
              {/* Sombra proyectada */}
              <div className="absolute -bottom-1 h-2 w-6 rounded-[100%] bg-black/20 blur-[2px]"></div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}

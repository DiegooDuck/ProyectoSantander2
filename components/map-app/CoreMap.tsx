"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Layer, Source } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
}: CoreMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);

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
      >
        {showTraffic ? (
          <Source id={SRC_TRAFFIC} type="geojson" data={trafficGeoJSON!}>
            <Layer
              id="sr-traffic-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-width": 5,
                "line-opacity": 0.72,
                "line-color": [
                  "match",
                  ["get", "severity"],
                  "heavy",
                  "#dc2626",
                  "moderate",
                  "#ea580c",
                  "#ca8a04",
                ],
              }}
            />
          </Source>
        ) : null}

        {showBus ? (
          <Source id={SRC_BUS} type="geojson" data={busGeoJSON!}>
            <Layer
              id="sr-bus-circles"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#fbbf24",
                "circle-opacity": 0.92,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#1c1917",
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
      </Map>
    </div>
  );
}

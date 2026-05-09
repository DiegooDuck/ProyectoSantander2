"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Layer, Source, Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User } from "lucide-react";
import type { RouteFeatureCollection } from "@/lib/routing";
import type { GeoFeatureCollection } from "@/lib/data/geojson-builders";
import { TueBiciLayer } from "./TueBiciLayer";
import { ParkingLayer } from "./ParkingLayer";
import { AirQualityLayer } from "./AirQualityLayer";
import { IncidentsLayer } from "./IncidentsLayer";

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
  parking: boolean;
  airQuality: boolean;
  incidents: boolean;
};

export type CoreMapProps = {
  className?: string;
  mapStyleUrl: string;
  routeLineColor: string;
  routeGeoJSON: RouteFeatureCollection | null;
  busGeoJSON: GeoFeatureCollection | null;
  bikeGeoJSON: GeoFeatureCollection | null;
  bikeLanesGeoJSON: GeoFeatureCollection | null;
  trafficGeoJSON: GeoFeatureCollection | null;
  layers: MapLayerVisibility;
  onSelectStop?: (lng: number, lat: number, name: string, id?: string) => void;
  onSelectBikeStation?: (station: {
    id: string;
    name: string;
    lng: number;
    lat: number;
    availableBikes: number;
    availableDocks: number;
  }) => void;
  userLocation: { lng: number; lat: number } | null;
};

export function CoreMap({
  className,
  mapStyleUrl,
  routeLineColor,
  routeGeoJSON,
  busGeoJSON,
  bikeGeoJSON,
  bikeLanesGeoJSON,
  trafficGeoJSON,
  layers,
  onSelectStop,
  onSelectBikeStation,
  userLocation,
}: CoreMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);
  const [selectedBusPopup, setSelectedBusPopup] = useState<{lng: number, lat: number, name: string, lines?: string} | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dashOffsetRef = useRef(0);

  const showRoute = Boolean(routeGeoJSON?.features.length);
  const showBus =
    layers.buses && Boolean(busGeoJSON?.features.length);
  const showBike =
    layers.bikes && Boolean(bikeGeoJSON?.features.length);
  const showBikeLanes =
    layers.bikes && Boolean(bikeLanesGeoJSON?.features.length);
  const showTraffic =
    layers.traffic && Boolean(trafficGeoJSON?.features.length);

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

  useEffect(() => {
    if (!mapReady || !showRoute) return;
    
    const map = mapRef.current?.getMap();
    if (!map) return;

    const animate = () => {
      dashOffsetRef.current = (dashOffsetRef.current + 0.3) % 8;
      try {
        (map as any).setPaintProperty('sr-route-animated', 'line-dashoffset', dashOffsetRef.current);
      } catch (e) {
        // Layer might not exist yet
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [mapReady, showRoute]);

  const onMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const features = event.features;
    if (!features || features.length === 0) {
      setSelectedBusPopup(null);
      return;
    }

    const first = features[0];
    const layerId = first.layer?.id;

    if ((layerId === "sr-bike-core" || layerId === "sr-bike-halo") && onSelectBikeStation) {
      const coordinates = ((first.geometry as GeoJSON.Point).coordinates ?? []) as [number, number];
      const id = String(first.properties?.["id"] ?? "");
      const name = String(first.properties?.["name"] ?? "Estación de bicis");
      const availableBikes = Number(first.properties?.["availableBikes"] ?? 0);
      const availableDocks = Number(first.properties?.["availableDocks"] ?? 0);
      onSelectBikeStation({
        id,
        name,
        lng: coordinates[0],
        lat: coordinates[1],
        availableBikes: Number.isFinite(availableBikes) ? availableBikes : 0,
        availableDocks: Number.isFinite(availableDocks) ? availableDocks : 0,
      });
      return;
    }

    if ((layerId === "sr-bus-core" || layerId === "sr-bus-halo") && onSelectStop) {
      const coordinates = ((first.geometry as GeoJSON.Point).coordinates ?? []) as [number, number];
      const name = first.properties?.name || first.properties?.["ayto:NombreParada"] || "Parada de autobús";
      const id = first.properties?.id;
      const lines = first.properties?.lines;
      
      setSelectedBusPopup({ lng: coordinates[0], lat: coordinates[1], name, lines });
      onSelectStop(coordinates[0], coordinates[1], name, id);
    } else {
      setSelectedBusPopup(null);
    }
  }, [onSelectBikeStation, onSelectStop]);

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
        interactiveLayerIds={["sr-bus-core", "sr-bus-halo", "sr-bike-core", "sr-bike-halo"]}
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
                "circle-color": "#0ea5e9",
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
                "circle-color": "#f0f9ff",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#0284c7",
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
              id="sr-bike-halo"
              type="circle"
              paint={{
                "circle-color": "#10b981",
                "circle-radius": 8,
                "circle-opacity": 0.2,
              }}
            />
            <Layer
              id="sr-bike-core"
              type="circle"
              paint={{
                "circle-color": "#10b981",
                "circle-radius": 5,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        ) : null}

        {showBikeLanes ? (
          <Source id="sr-bike-lanes" type="geojson" data={bikeLanesGeoJSON!}>
            <Layer
              id="sr-bike-lanes-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#10b981",
                "line-width": 4,
                "line-opacity": 0.6,
                "line-dasharray": [2, 1],
              }}
            />
          </Source>
        ) : null}

        {showRoute ? (
          <Source id={SRC_ROUTE} type="geojson" data={routeGeoJSON!}>
            <Layer
              id="sr-route-bg"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": routeLineColor,
                "line-width": 8,
                "line-opacity": 0.3,
              }}
            />
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
            <Layer
              id="sr-route-animated"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#ffffff",
                "line-width": 4,
                "line-opacity": 0.8,
                "line-dasharray": [0, 4, 4, 0],
                // line-dashoffset is set dynamically via setPaintProperty
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
              <div className="absolute h-12 w-12 animate-ping rounded-full bg-indigo-500/30"></div>
              <div className="absolute h-8 w-8 animate-pulse rounded-full bg-indigo-500/50"></div>
              
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-xl transition-transform hover:scale-110">
                <User className="h-6 w-6" />
                
                <div className="absolute -top-1 right-0 h-3 w-3 rounded-full border border-white bg-emerald-400"></div>
              </div>
              
              <div className="absolute -bottom-1 h-2 w-6 rounded-[100%] bg-black/20 blur-[2px]"></div>
            </div>
          </Marker>
        )}
        {selectedBusPopup && (
          <Popup
            longitude={selectedBusPopup.lng}
            latitude={selectedBusPopup.lat}
            anchor="bottom"
            onClose={() => setSelectedBusPopup(null)}
            closeOnClick={false}
            className="z-20"
            offset={15}
          >
            <div className="p-2 min-w-[200px] font-sans">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-sky-100 p-1.5 rounded-full">
                  <span className="text-sky-600 font-bold text-[10px] tracking-wide">BUS</span>
                </div>
                <h3 className="font-bold text-gray-900 leading-tight">
                  {selectedBusPopup.name}
                </h3>
              </div>
              {selectedBusPopup.lines && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Líneas</span>
                  <span className="text-xs font-bold text-gray-900">{selectedBusPopup.lines}</span>
                </div>
              )}
            </div>
          </Popup>
        )}

        <TueBiciLayer visible={layers.bikes} />
        <ParkingLayer visible={layers.parking} />
        <AirQualityLayer visible={layers.airQuality} />
        <IncidentsLayer visible={layers.incidents} />
      </Map>
    </div>
  );
}

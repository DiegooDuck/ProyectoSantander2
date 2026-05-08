"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  bikeShareToGeoJSON,
  busStopsToGeoJSON,
  resolveMapDataBundle,
  trafficToGeoJSON,
  type MapDataBundle,
} from "@/lib/data";
import {
  candidateToFeatureCollection,
  scoreAllCandidates,
  selectBestRoute,
  type UserProfile,
  type RouteCandidate,
  type TransportMode,
} from "@/lib/routing";
import { CoreMap, type MapLayerVisibility } from "@/components/map-app/CoreMap";
import { LayerToggleBar } from "@/components/map-app/LayerToggleBar";
import { RouteOptionStrip } from "@/components/map-app/RouteOptionStrip";
import { ThemeSwitcher } from "@/components/map-app/ThemeSwitcher";
import { ProfileSelector } from "@/components/routing/ProfileSelector";
import { DestinationInput, type Destination } from "@/components/routing/DestinationInput";
import { ThemeProvider, useAppTheme } from "@/components/theme/ThemeProvider";

function MapExperience() {
  const { theme, setTheme, mapStyleUrl, routeLineColor } = useAppTheme();
  const [bundle, setBundle] = useState<MapDataBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>("PRISA");
  const [manualRouteId, setManualRouteId] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [generatedCandidates, setGeneratedCandidates] = useState<RouteCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    buses: true,
    bikes: true,
    traffic: true,
  });

  useEffect(() => {
    let cancelled = false;
    resolveMapDataBundle()
      .then((d) => {
        if (!cancelled) setBundle(d);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Error de datos");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setManualRouteId(null);
  }, [profile]);

  const handleGenerateRoute = async () => {
    if (!destination) return;
    setIsGenerating(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) throw new Error("Falta el token de Mapbox");

      const getUserLocation = (): Promise<{ lng: number; lat: number }> => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        });
      };

      let originLng = -3.80998;
      let originLat = 43.46231;

      try {
        const loc = await getUserLocation();
        originLng = loc.lng;
        originLat = loc.lat;
      } catch (err) {
        console.warn("No se pudo obtener la ubicación, usando origen por defecto", err);
      }

      const destLng = destination.coordinates[0];
      const destLat = destination.coordinates[1];

      const modes = [
        { mapboxMode: "walking", ourMode: "walking" as TransportMode, label: "Ruta a pie" },
        { mapboxMode: "cycling", ourMode: "cycling" as TransportMode, label: "Ruta en bicicleta" },
        { mapboxMode: "driving", ourMode: "bus" as TransportMode, label: "Ruta rápida (estimación en coche/bus)" },
      ];

      const fetches = modes.map(async (m) => {
        try {
          const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/${m.mapboxMode}/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&access_token=${token}`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const candidate: RouteCandidate = {
              id: `api-${m.ourMode}-${Date.now()}`,
              label: m.label,
              legs: [
                {
                  mode: m.ourMode,
                  durationMinutes: Math.round(route.duration / 60),
                  distanceKm: route.distance / 1000,
                }
              ],
              metrics: {
                estimatedCo2Grams: m.ourMode === "bus" ? route.distance * 0.12 : 0,
                safetyIndex: m.ourMode === "walking" ? 0.9 : (m.ourMode === "cycling" ? 0.8 : 0.6),
                trafficExposureIndex: m.ourMode === "bus" ? 0.8 : (m.ourMode === "cycling" ? 0.3 : 0.1),
              },
              geometry: route.geometry,
            };
            return candidate;
          }
        } catch (e) {
          console.error(`Error fetching ${m.mapboxMode} route:`, e);
        }
        return null;
      });

      const results = await Promise.all(fetches);
      const validCandidates = results.filter((c): c is RouteCandidate => c !== null);
      
      if (validCandidates.length > 0) {
        setGeneratedCandidates(validCandidates);
        setManualRouteId(null);
      } else {
        alert("No se pudo generar una ruta a este destino.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con la API de rutas.");
    } finally {
      setIsGenerating(false);
    }
  };

  const candidates = generatedCandidates.length > 0 
    ? generatedCandidates 
    : (bundle?.routes.items ?? []);

  const ranked = useMemo(
    () => scoreAllCandidates(candidates, profile),
    [candidates, profile],
  );

  const recommended = useMemo(
    () => selectBestRoute(candidates, profile),
    [candidates, profile],
  );

  const selectedId =
    manualRouteId ??
    recommended?.candidate.id ??
    candidates[0]?.id ??
    null;

  const selectedCandidate =
    candidates.find((c) => c.id === selectedId) ?? candidates[0] ?? null;

  const routeGeoJSON = selectedCandidate
    ? candidateToFeatureCollection(selectedCandidate)
    : null;

  const busGeoJSON = useMemo(
    () => (bundle ? busStopsToGeoJSON(bundle.busStops.items) : null),
    [bundle],
  );
  const bikeGeoJSON = useMemo(
    () => (bundle ? bikeShareToGeoJSON(bundle.bikeShare.items) : null),
    [bundle],
  );
  const trafficGeoJSON = useMemo(
    () => (bundle ? trafficToGeoJSON(bundle.traffic.items) : null),
    [bundle],
  );

  const activeScore = ranked.find((s) => s.candidate.id === selectedId);

  return (
    <div className="relative h-dvh min-h-0 w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <CoreMap
          className="h-full w-full"
          mapStyleUrl={mapStyleUrl}
          routeLineColor={routeLineColor}
          routeGeoJSON={routeGeoJSON}
          busGeoJSON={busGeoJSON}
          bikeGeoJSON={bikeGeoJSON}
          trafficGeoJSON={trafficGeoJSON}
          layers={layers}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex min-h-0 min-w-0 flex-col">
        <header className="pointer-events-auto flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-5">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href="/landing"
              className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--overlay-text-muted)] underline-offset-4 hover:underline"
            >
              Info producto
            </Link>
            <h1 className="truncate text-lg font-bold tracking-tight text-[var(--overlay-text)] drop-shadow-sm sm:text-xl">
              Smart Route
            </h1>
          </div>
          <ThemeSwitcher value={theme} onChange={setTheme} />
        </header>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="pointer-events-auto mt-auto w-full min-w-0 max-w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 md:absolute md:bottom-4 md:left-4 md:mt-0 md:max-w-md md:px-0 md:pb-0 lg:max-w-lg">
          <div className="max-h-[min(52dvh,28rem)] overflow-y-auto rounded-3xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:max-h-none md:rounded-2xl md:shadow-2xl">
            <div className="mx-auto flex max-h-[inherit] flex-col gap-4 p-4 sm:p-5">
              {loadError ? (
                <p className="text-sm text-red-400">{loadError}</p>
              ) : null}
              {!bundle && !loadError ? (
                <p className="text-sm text-[var(--overlay-text-muted)]">
                  Cargando datos del mapa…
                </p>
              ) : null}

              {bundle ? (
                <>
                  <DestinationInput
                    currentDestination={destination}
                    onDestinationSelect={(dest) => {
                      setDestination(dest);
                      setGeneratedCandidates([]); // Clear previous generated routes when destination changes
                    }}
                    onClear={() => {
                      setDestination(null);
                      setGeneratedCandidates([]); // Clear routes
                    }}
                    onConfirm={handleGenerateRoute}
                    isConfirming={isGenerating}
                    disabled={isGenerating}
                  />

                  <RouteOptionStrip
                    ranked={ranked}
                    selectedId={selectedId}
                    onSelect={(id) => setManualRouteId(id)}
                  />

                  <ProfileSelector
                    layout="compact"
                    value={profile}
                    onChange={setProfile}
                    disabled={!candidates.length}
                  />

                  <LayerToggleBar layers={layers} onChange={setLayers} />

                  {activeScore ? (
                    <div className="rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] px-3 py-2.5">
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[var(--overlay-text-muted)]">
                        Detalle · perfil {profile}
                      </p>
                      <p className="mt-1 text-[0.8125rem] text-[var(--overlay-text-muted)]">
                        Puntuación normalizada (menor es mejor):{" "}
                        <span className="font-mono tabular-nums text-[var(--overlay-text)]">
                          {activeScore.breakdown.weightedTotal.toFixed(3)}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SmartRouteMapPage() {
  return (
    <ThemeProvider>
      <MapExperience />
    </ThemeProvider>
  );
}

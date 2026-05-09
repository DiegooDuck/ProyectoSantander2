"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Leaf, ChevronUp, ChevronDown } from "lucide-react";
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
import { FleetGuideAgent } from "@/components/map-app/FleetGuideAgent";

function MapExperience() {
  const { theme, setTheme, mapStyleUrl, routeLineColor } = useAppTheme();
  const [bundle, setBundle] = useState<MapDataBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>("PRISA");
  const [manualRouteId, setManualRouteId] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [generatedCandidates, setGeneratedCandidates] = useState<RouteCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    buses: true,
    bikes: true,
    traffic: true,
  });

  useEffect(() => {
    let cancelled = false;
    let watchId: number | null = null;
    
    // Obtener ubicación inicial y rastrear
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!cancelled) {
          setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        }
      });
      
      watchId = navigator.geolocation.watchPosition((pos) => {
        if (!cancelled) {
          setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        }
      });
    }

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
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    setManualRouteId(null);
  }, [profile]);

  const handleStopSelect = (lng: number, lat: number, name: string) => {
    const newDest: Destination = {
      name: name,
      coordinates: [lng, lat],
    };
    setDestination(newDest);
    
    // Disparar la generación de ruta
    setIsGenerating(true);
    // Usamos un pequeño delay para que la UI refleje el cambio de destino antes de empezar la carga pesada
    setTimeout(() => {
      generateRouteWithDestination(newDest);
    }, 50);
  };

  const generateRouteWithDestination = async (targetDest: Destination) => {
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

      const destLng = targetDest.coordinates[0];
      const destLat = targetDest.coordinates[1];

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
                  durationMinutes: Math.max(1, Math.round(route.duration / 60)),
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

  const handleGenerateRoute = async () => {
    if (!destination) return;
    generateRouteWithDestination(destination);
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
    null;

  const selectedCandidate =
    candidates.find((c) => c.id === selectedId) ?? null;

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

  const isEcoProfile = profile === "ECO";
  const isEcoFriendly = activeScore?.candidate.legs.every((l) => l.mode === "walking" || l.mode === "cycling");
  const earnedPoints = isEcoProfile && isEcoFriendly ? 50 : 0;

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
          onSelectStop={handleStopSelect}
          userLocation={userLocation}
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

        <FleetGuideAgent />

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="pointer-events-auto mt-auto w-full min-w-0 max-w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 md:absolute md:bottom-4 md:left-4 md:mt-0 md:max-w-md md:px-0 md:pb-0 lg:max-w-lg transition-all duration-300">
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              className="bg-[var(--overlay-surface)] border border-[var(--overlay-border)] text-[var(--overlay-text)] p-2 rounded-full shadow-lg backdrop-blur hover:bg-[var(--overlay-card)] transition"
              aria-label={isPanelExpanded ? "Minimizar panel" : "Expandir panel"}
            >
              {isPanelExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
          
          <div className={`overflow-y-auto rounded-3xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:rounded-2xl md:shadow-2xl transition-all duration-300 origin-bottom ${isPanelExpanded ? 'max-h-[min(52dvh,28rem)] md:max-h-none opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 overflow-hidden border-none shadow-none py-0'}`}>
            <div className="mx-auto flex flex-col gap-4 p-4 sm:p-5">
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
                    profile={profile}
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
                        Detalle · {profile ? `perfil ${profile}` : 'sin perfil aplicado'}
                      </p>
                      <p className="mt-1 text-[0.8125rem] text-[var(--overlay-text-muted)]">
                        Puntuación normalizada (menor es mejor):{" "}
                        <span className="font-mono tabular-nums text-[var(--overlay-text)]">
                          {activeScore.breakdown.weightedTotal.toFixed(3)}
                        </span>
                      </p>
                      
                      {earnedPoints > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-emerald-500 border border-emerald-500/20 w-max">
                          <Leaf className="h-4 w-4" />
                          <span className="text-[0.75rem] font-bold">
                            + {earnedPoints} Puntos Eco ganados
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <FleetGuideAgent />
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

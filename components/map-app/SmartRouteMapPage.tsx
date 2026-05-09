"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SustainabilityDashboard } from "@/components/map-app/SustainabilityDashboard";
import { logTrip, type TripMode } from "@/lib/sustainability/tracker";
import {
  findNearestStationWithDocks,
  haversineMeters,
  type BikeStationLite,
} from "@/lib/bike-share/availability";

type ToastKind = "info" | "warning" | "success";
type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  cta?: { label: string; destination: { lng: number; lat: number; name: string } };
};

function formatMeters(meters: number): string {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function ToastStack({
  items,
  onDismiss,
  onNavigate,
}: {
  items: Toast[];
  onDismiss: (id: string) => void;
  onNavigate: (dest: { lng: number; lat: number; name: string }) => void;
}) {
  if (!items.length) return null;

  const kindClasses: Record<ToastKind, string> = {
    info: "border-white/10 bg-[var(--overlay-surface)]/90 text-[var(--overlay-text)]",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  };

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-[max(3.75rem,env(safe-area-inset-top))] z-30 mx-auto flex max-w-[min(42rem,calc(100vw-1.5rem))] flex-col gap-2 px-3">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-2xl border px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl ${kindClasses[t.kind]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] font-semibold">{t.title}</p>
              {t.detail ? (
                <p className="mt-0.5 text-[0.75rem] opacity-90">{t.detail}</p>
              ) : null}
              {t.cta ? (
                <button
                  type="button"
                  onClick={() => onNavigate(t.cta!.destination)}
                  className="mt-2 inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold hover:bg-white/10"
                >
                  {t.cta.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => onDismiss(t.id)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.6875rem] font-semibold hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [sustainKey, setSustainKey] = useState(0); // bump to refresh dashboard
  const [selectedBikeStation, setSelectedBikeStation] = useState<BikeStationLite | null>(null);
  const [selectedBusStopForAgent, setSelectedBusStopForAgent] = useState<{id: string, name: string} | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeRide, setActiveRide] = useState<{
    fromStationId: string;
    batteryPct: number;
    startedAt: number;
  } | null>(null);
  const lowBatteryNotifiedRef = useRef(false);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    buses: true,
    bikes: true,
    traffic: true,
    parking: true,
    airQuality: true,
    incidents: true,
  });
  
  const [incidentsData, setIncidentsData] = useState<any>(null);
  const [airQualityData, setAirQualityData] = useState<any>(null);

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

    // Fetch dynamic context data for routing
    fetch('/api/santander/incidents').then(r => r.json()).then(d => {
      if (!cancelled) setIncidentsData(d);
    }).catch(console.error);

    fetch('/api/santander/air-quality').then(r => r.json()).then(d => {
      if (!cancelled) setAirQualityData(d);
    }).catch(console.error);

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

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next: Toast = { id, ...t };
    setToasts((prev) => [next, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 8000);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!activeRide) return;

    const interval = window.setInterval(() => {
      setActiveRide((prev) => {
        if (!prev) return prev;
        const nextBattery = Math.max(0, prev.batteryPct - 3);
        return { ...prev, batteryPct: nextBattery };
      });
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [activeRide]);

  useEffect(() => {
    if (!activeRide) {
      lowBatteryNotifiedRef.current = false;
      return;
    }
    if (activeRide.batteryPct <= 25 && !lowBatteryNotifiedRef.current) {
      lowBatteryNotifiedRef.current = true;
      pushToast({
        kind: "warning",
        title: "Batería baja",
        detail: `Tu e-bike está al ${activeRide.batteryPct}%. Te conviene ir hacia una estación con docks libres.`,
      });
    }
  }, [activeRide, pushToast]);



  const handleStopSelect = (lng: number, lat: number, name: string, id?: string) => {
    if (id) {
      setSelectedBusStopForAgent({ id, name });
    }

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

      // Usar la ubicación ya rastreada si está disponible, si no, fallback al origen por defecto
      let originLng = userLocation?.lng ?? -3.80998;
      let originLat = userLocation?.lat ?? 43.46231;

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
            
            // Calculate obstacle penalties
            let pollutionExposure = 0;
            let incidentHits = 0;
            
            if (route.geometry?.coordinates) {
              const coords: [number, number][] = route.geometry.coordinates;
              
              // Simplistic intersection checking for each coordinate point
              coords.forEach((coord) => {
                 if (airQualityData?.features) {
                    airQualityData.features.forEach((f: any) => {
                       const dist = haversineMeters({lng: coord[0], lat: coord[1]}, {lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1]});
                       if (dist < 200) { // within 200 meters of sensor
                          pollutionExposure += ((f.properties?.aqi || 0) / 100); 
                       }
                    });
                 }
                 if (incidentsData?.features) {
                    incidentsData.features.forEach((f: any) => {
                       const dist = haversineMeters({lng: coord[0], lat: coord[1]}, {lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1]});
                       if (dist < 100) { // Route passes very close to an incident
                          incidentHits += 1;
                       }
                    });
                 }
              });
            }

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
                safetyIndex: (m.ourMode === "walking" ? 0.9 : (m.ourMode === "cycling" ? 0.8 : 0.6)) - (incidentHits > 0 ? 0.3 : 0),
                trafficExposureIndex: (m.ourMode === "bus" ? 0.8 : (m.ourMode === "cycling" ? 0.3 : 0.1)) + Math.min(pollutionExposure * 0.05, 0.5),
                incidentHits,
                pollutionExposure,
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

  /** Registra un viaje en el tracker de sostenibilidad al seleccionar ruta. */
  const handleSelectAndLog = useCallback((id: string) => {
    setManualRouteId(id);
    const c = candidates.find((r) => r.id === id);
    if (!c) return;
    const leg = c.legs[0];
    if (!leg) return;
    logTrip({
      mode: leg.mode as TripMode,
      distanceKm: leg.distanceKm,
      durationMinutes: leg.durationMinutes,
      co2Grams: c.metrics.estimatedCo2Grams,
      destination: destination?.name ?? "Destino",
    });
    setSustainKey((k) => k + 1);
  }, [candidates, destination]);

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
  const bikeLanesGeoJSON = bundle?.bikeLanes ?? null;

  const activeScore = ranked.find((s) => s.candidate.id === selectedId);

  const isEcoProfile = profile === "ECO";
  const isEcoFriendly = activeScore?.candidate.legs.every((l) => l.mode === "walking" || l.mode === "cycling");
  const earnedPoints = isEcoProfile && isEcoFriendly ? 50 : 0;

  const busStopsForInput = useMemo(() => {
    if (!bundle) return [];
    return bundle.busStops.items.map(s => ({
      name: s.name,
      coordinates: [s.lng, s.lat] as [number, number]
    }));
  }, [bundle]);

  const bikeStationsLite = useMemo((): BikeStationLite[] => {
    if (!bundle) return [];
    return bundle.bikeShare.items.map((s) => ({
      id: s.id,
      name: s.name,
      lng: s.lng,
      lat: s.lat,
      availableBikes: s.availableBikes,
      availableDocks: s.availableDocks,
    }));
  }, [bundle]);

  const handlePickup = useCallback(() => {
    if (!selectedBikeStation) return;
    if (selectedBikeStation.availableBikes <= 0) {
      pushToast({
        kind: "warning",
        title: "No hay bicis disponibles",
        detail: `La estación “${selectedBikeStation.name}” no tiene e-bikes ahora mismo.`,
      });
      return;
    }

    const seed =
      Array.from(selectedBikeStation.id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) +
      new Date().getMinutes();
    const battery = 15 + (seed % 86); // 15..100
    setActiveRide({
      fromStationId: selectedBikeStation.id,
      batteryPct: battery,
      startedAt: Date.now(),
    });
    pushToast({
      kind: battery <= 25 ? "warning" : "success",
      title: `E-bike desbloqueada (${battery}%)`,
      detail: battery <= 25 ? "Ojo: batería baja. Te avisaremos si necesitas cambiar de estación." : "Listo. Buen viaje.",
    });
  }, [pushToast, selectedBikeStation]);

  const handleReturn = useCallback(() => {
    if (!selectedBikeStation) return;

    if (selectedBikeStation.availableDocks > 0) {
      setActiveRide(null);
      pushToast({
        kind: "success",
        title: "Bici devuelta",
        detail: `Devolución OK en “${selectedBikeStation.name}”.`,
      });
      return;
    }

    const nearest = findNearestStationWithDocks(
      { lng: selectedBikeStation.lng, lat: selectedBikeStation.lat },
      bikeStationsLite,
      { excludeId: selectedBikeStation.id },
    );

    if (!nearest) {
      pushToast({
        kind: "warning",
        title: "Estación llena",
        detail: `No hay docks libres cerca de “${selectedBikeStation.name}”. Prueba otra zona.`,
      });
      return;
    }

    pushToast({
      kind: "warning",
      title: "Estación llena",
      detail: `“${selectedBikeStation.name}” está completa. Alternativa: “${nearest.station.name}” (${formatMeters(nearest.distanceMeters)}).`,
      cta: {
        label: "Ir a la alternativa",
        destination: { lng: nearest.station.lng, lat: nearest.station.lat, name: nearest.station.name },
      },
    });
  }, [bikeStationsLite, pushToast, selectedBikeStation]);

  return (
    <div className="relative h-dvh min-h-0 w-full overflow-hidden bg-black">
      <ToastStack
        items={toasts}
        onDismiss={dismissToast}
        onNavigate={(dest) => handleStopSelect(dest.lng, dest.lat, dest.name)}
      />
      <div className="absolute inset-0 z-0">
        <CoreMap
          className="h-full w-full"
          mapStyleUrl={mapStyleUrl}
          routeLineColor={routeLineColor}
          routeGeoJSON={routeGeoJSON}
          busGeoJSON={busGeoJSON}
          bikeGeoJSON={bikeGeoJSON}
          bikeLanesGeoJSON={bikeLanesGeoJSON}
          trafficGeoJSON={trafficGeoJSON}
          layers={layers}
          onSelectStop={handleStopSelect}
          onSelectBikeStation={(s) => {
            setSelectedBikeStation(s);
            const from = userLocation ? { lng: userLocation.lng, lat: userLocation.lat } : null;
            const d = from ? haversineMeters(from, s) : null;
            pushToast({
              kind: "info",
              title: `Estación: ${s.name}`,
              detail: `${s.availableBikes} bicis · ${s.availableDocks} docks` + (d ? ` · a ${formatMeters(d)}` : ""),
            });
          }}
          userLocation={userLocation}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex min-h-0 min-w-0 flex-col">
        <header className="pointer-events-none flex shrink-0 items-center justify-center px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          {/* Título a la izquierda */}
          <div className="pointer-events-auto absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] flex min-w-0 flex-col gap-1 sm:left-5">
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

          {/* Selector de temas centrado */}
          <div className="pointer-events-auto flex items-center justify-center">
            <ThemeSwitcher value={theme} onChange={setTheme} />
          </div>
        </header>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="pointer-events-auto mt-auto w-full min-w-0 max-w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 md:absolute md:bottom-4 md:left-4 md:mt-0 md:max-w-md md:px-0 md:pb-0 lg:max-w-lg transition-all duration-500 ease-in-out">
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              className="bg-[var(--overlay-surface)] border border-[var(--overlay-border)] text-[var(--overlay-text)] p-2.5 rounded-full shadow-lg backdrop-blur hover:bg-[var(--overlay-card)] hover:scale-110 active:scale-95 transition-all duration-300"
              aria-label={isPanelExpanded ? "Minimizar panel" : "Expandir panel"}
            >
              {isPanelExpanded ? <ChevronDown className="h-5 w-5 animate-in slide-in-from-top-1" /> : <ChevronUp className="h-5 w-5 animate-in slide-in-from-bottom-1" />}
            </button>
          </div>
          
          <div className={`overflow-y-auto rounded-3xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)]/90 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:rounded-2xl md:shadow-2xl transition-all duration-500 origin-bottom ease-in-out ${isPanelExpanded ? 'max-h-[min(52dvh,28rem)] md:max-h-none opacity-100 scale-100 translate-y-0' : 'max-h-0 opacity-0 scale-95 translate-y-4 overflow-hidden border-none shadow-none py-0'}`}>
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
                  {selectedBikeStation ? (
                    <div className="rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[var(--overlay-text-muted)]">
                            E-Bikes · disponibilidad
                          </p>
                          <p className="mt-1 truncate text-[0.875rem] font-bold text-[var(--overlay-text)]">
                            {selectedBikeStation.name}
                          </p>
                          <p className="mt-0.5 text-[0.75rem] text-[var(--overlay-text-muted)]">
                            🚲 {selectedBikeStation.availableBikes} bicis · 🅿️ {selectedBikeStation.availableDocks} docks
                            {activeRide ? <> · 🔋 {activeRide.batteryPct}%</> : null}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedBikeStation(null)}
                          className="rounded-lg border border-[var(--overlay-border)] bg-[var(--overlay-surface)]/70 px-2 py-1 text-[0.6875rem] font-semibold text-[var(--overlay-text)] hover:bg-[var(--overlay-card)]"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleStopSelect(
                              selectedBikeStation.lng,
                              selectedBikeStation.lat,
                              selectedBikeStation.name,
                            )
                          }
                          className="rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)]/70 px-3 py-2 text-[0.75rem] font-semibold text-[var(--overlay-text)] hover:bg-[var(--overlay-card)]"
                        >
                          Ir a esta estación
                        </button>
                        <button
                          type="button"
                          onClick={handlePickup}
                          className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[0.75rem] font-semibold text-emerald-200 hover:bg-emerald-500/15"
                        >
                          Recoger e-bike
                        </button>
                        <button
                          type="button"
                          onClick={handleReturn}
                          className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[0.75rem] font-semibold text-amber-200 hover:bg-amber-500/15"
                        >
                          Devolver aquí
                        </button>
                      </div>
                    </div>
                  ) : null}

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
                    busStops={busStopsForInput}
                  />

                  <RouteOptionStrip
                    ranked={ranked}
                    selectedId={selectedId}
                    onSelect={handleSelectAndLog}
                    profile={profile}
                    onOpenAgent={() => setIsAgentOpen(true)}
                  />

                  <ProfileSelector
                    layout="compact"
                    value={profile}
                    onChange={setProfile}
                    disabled={!candidates.length}
                  />

                  <LayerToggleBar layers={layers} onChange={setLayers} />

                  {/* Smart Agent embebido */}
                  <FleetGuideAgent
                    variant="inline"
                    userLocation={userLocation}
                    onAutoRoute={handleStopSelect}
                    onUpdateProfile={setProfile}
                    isOpen={isAgentOpen}
                    onToggle={setIsAgentOpen}
                    selectedBusStop={selectedBusStopForAgent}
                  />

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

                  {/* Dashboard de Sostenibilidad */}
                  <SustainabilityDashboard key={sustainKey} />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <FleetGuideAgent 
         userLocation={userLocation}
         onAutoRoute={handleStopSelect}
         onUpdateProfile={setProfile}
         hideFab={isPanelExpanded}
         isOpen={isAgentOpen}
         onToggle={setIsAgentOpen}
         selectedBusStop={selectedBusStopForAgent}
       />
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

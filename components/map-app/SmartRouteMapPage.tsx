"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leaf, ChevronUp, ChevronDown, Bell, BellOff, X } from "lucide-react";
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
import { ROUTE_LINE_BY_PROFILE, ROUTE_LINE_BY_THEME } from "@/lib/theme/constants";
import { FleetGuideAgent } from "@/components/map-app/FleetGuideAgent";
import { SustainabilityDashboard } from "@/components/map-app/SustainabilityDashboard";
import { getStats, logTrip, type TripMode } from "@/lib/sustainability/tracker";
import {
  findNearestStationWithDocks,
  haversineMeters,
  type BikeStationLite,
} from "@/lib/bike-share/availability";

type ToastKind = "info" | "warning" | "success" | "critical";
type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  cta?: { label: string; destination: { lng: number; lat: number; name: string } };
};

type NotifPrefs = {
  bikes: boolean;
  parking: boolean;
  incidents: boolean;
  airQuality: boolean;
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

  const kindMeta: Record<ToastKind, { bar: string; badge: string; icon: string; glow: string }> = {
    info:     { bar: "bg-sky-400",     badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",             icon: "ℹ️", glow: "" },
    success:  { bar: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: "✅", glow: "" },
    warning:  { bar: "bg-amber-400",   badge: "bg-amber-500/20 text-amber-200 border-amber-500/40",      icon: "⚠️", glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]" },
    critical: { bar: "bg-red-500",     badge: "bg-red-500/25 text-red-200 border-red-500/50",            icon: "🚨", glow: "shadow-[0_0_28px_rgba(220,38,38,0.55)] ring-1 ring-red-500/40 animate-pulse" },
  };

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-[max(3.75rem,env(safe-area-inset-top))] z-30 mx-auto flex max-w-[min(44rem,calc(100vw-1rem))] flex-col gap-3 px-3">
      {items.map((t) => {
        const meta = kindMeta[t.kind];
        return (
          <div
            key={t.id}
            style={{ animation: "slideNotif 0.35s cubic-bezier(0.16,1,0.3,1)" }}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/80 backdrop-blur-2xl ${meta.glow}`}
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${meta.bar} opacity-90`} />
            <div className="flex items-start gap-3 py-3 pl-5 pr-3">
              <span className="mt-0.5 shrink-0 text-lg leading-none">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest mb-1 ${meta.badge}`}>{t.kind}</p>
                <p className="text-[0.8125rem] font-semibold text-white leading-snug">{t.title}</p>
                {t.detail && <p className="mt-0.5 text-[0.75rem] text-gray-300 leading-relaxed">{t.detail}</p>}
                {t.cta && (
                  <button type="button" onClick={() => onNavigate(t.cta!.destination)}
                    className="mt-2 inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-white hover:bg-white/10 transition-colors">
                    {t.cta.label} →
                  </button>
                )}
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => onDismiss(t.id)}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.6875rem] font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>
        );
      })}
      <style>{`@keyframes slideNotif { from { opacity:0; transform:translateY(-16px) scale(0.97);} to { opacity:1; transform:translateY(0) scale(1);} }`}</style>
    </div>
  );
}

function NotificationCenter({ prefs, onChange, unseenCount }: {
  prefs: NotifPrefs;
  onChange: (p: NotifPrefs) => void;
  unseenCount: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const allOn = Object.values(prefs).every(Boolean);
  const rows: { key: keyof NotifPrefs; label: string; icon: string }[] = [
    { key: "bikes",      label: "Bicis TUeBICI",       icon: "🚲" },
    { key: "parking",    label: "Parkings públicos",   icon: "🅿️" },
    { key: "incidents",  label: "Incidencias y obras", icon: "🚧" },
    { key: "airQuality", label: "Calidad del aire",    icon: "💨" },
  ];
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-label="Centro de notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-gray-950/70 backdrop-blur-xl shadow-lg transition-all hover:scale-110 hover:bg-gray-800/80 active:scale-95">
        {allOn ? <Bell className="h-5 w-5 text-white" /> : <BellOff className="h-5 w-5 text-gray-400" />}
        {unseenCount > 0 && Object.values(prefs).some(Boolean) && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.55rem] font-bold text-white shadow-md animate-bounce">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>
      {open && (
        <div style={{ animation: "slideNotif 0.25s cubic-bezier(0.16,1,0.3,1)" }}
          className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-white/10 bg-gray-950/90 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">Notificaciones</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-500 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <button type="button"
            onClick={() => { const n = !allOn; onChange({ bikes: n, parking: n, incidents: n, airQuality: n }); }}
            className={`mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${allOn ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-gray-400"}`}>
            <span>{allOn ? "Todo activado" : "Todo desactivado"}</span>
            <span className={`h-5 w-9 rounded-full relative transition-colors ${allOn ? "bg-emerald-500" : "bg-gray-700"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${allOn ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
          <div className="flex flex-col gap-1.5">
            {rows.map(({ key, label, icon }) => {
              const on = prefs[key];
              return (
                <button key={String(key)} type="button" onClick={() => onChange({ ...prefs, [key]: !on })}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all ${on ? "border-sky-500/25 bg-sky-500/10 text-sky-200" : "border-white/10 bg-white/5 text-gray-500"}`}>
                  <span className="flex items-center gap-2"><span>{icon}</span><span>{label}</span></span>
                  <span className={`h-4 w-8 rounded-full relative transition-colors ${on ? "bg-sky-500" : "bg-gray-700"}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[0.6rem] text-gray-600 text-center">Las alertas desactivadas no interrumpirán tu experiencia.</p>
        </div>
      )}
    </div>
  );
}

function MapExperience() {
  const { theme, setTheme, mapStyleUrl } = useAppTheme();
  const [bundle, setBundle] = useState<MapDataBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const routeLineColor = profile 
    ? ROUTE_LINE_BY_PROFILE[profile] 
    : ROUTE_LINE_BY_THEME[theme];
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
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({ bikes: true, parking: true, incidents: true, airQuality: true });
  const notifPrefsRef = useRef<NotifPrefs>(notifPrefs);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [incidentsData, setIncidentsData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<{
    fromStationId: string;
    batteryPct: number;
    startedAt: number;
  } | null>(null);
  const [selectedEcoBusType, setSelectedEcoBusType] = useState<"ELECTRICO" | "HIBRIDO" | null>(null);
  const [ecoRewardMessage, setEcoRewardMessage] = useState<string | null>(null);
  const [ecoRewardTotalPoints, setEcoRewardTotalPoints] = useState<number | null>(null);
  const lowBatteryNotifiedRef = useRef(false);

  const pushToast = useCallback((t: Omit<Toast, "id">, gate: keyof NotifPrefs) => {
    if (!notifPrefsRef.current[gate]) return "";
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 4));
    setUnseenCount((c) => c + 1);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 10000);
    return id;
  }, []);

  useEffect(() => {
    notifPrefsRef.current = notifPrefs;
    if (!Object.values(notifPrefs).some(Boolean)) {
      setToasts([]);
      setUnseenCount(0);
    }
  }, [notifPrefs]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    buses: true,
    bikes: true,
    traffic: true,
    parking: true,
    airQuality: true,
    incidents: true,
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

    // Fetch dynamic context data for routing
    fetch('/api/santander/incidents').then(r => r.json()).then(d => {
      if (!cancelled) setIncidentsData(d);
    }).catch(console.error);

    fetch('/api/santander/air-quality').then(r => r.json()).then(d => {
      if (!cancelled) setAirQualityData(d);
    }).catch(console.error);

    fetch('/api/santander/incidents').then(r => r.json()).then(d => { if (!cancelled) setIncidentsData(d); }).catch(console.error);
    fetch('/api/santander/air-quality').then(r => r.json()).then(d => { if (!cancelled) setAirQualityData(d); }).catch(console.error);

    type SmartScheduledAlert = Omit<Toast, "id"> & { gate: keyof NotifPrefs };
    const smartAlerts: SmartScheduledAlert[] = [
      {
        gate: "bikes",
        kind: "critical",
        title: "🚨 Estación TUeBICI casi vacía",
        detail: "'Intercambiador Sardinero' solo le quedan 2 bicis. ¡Cógela antes de que se acaben!",
      },
      {
        gate: "parking",
        kind: "warning",
        title: "🅿️ Parking Alfonso XIII: 8 plazas",
        detail: "Ocupación al 97%. Dirígete a Numancia, todavía tiene espacio.",
      },
      {
        gate: "incidents",
        kind: "info",
        title: "🚧 Incidencia en vía pública",
        detail: "Corte en Calle Burgos por evento deportivo hasta las 20:30 h.",
      },
      {
        gate: "bikes",
        kind: "success",
        title: "✅ Estación Sardinero repuesta",
        detail: "Un operario ha recargado 14 bicis. ¡Ya están disponibles!",
      },
      {
        gate: "airQuality",
        kind: "warning",
        title: "💨 Pico de NO2 en Cuatro Caminos",
        detail: "AQI 98. Activa el perfil ECO para rutas más limpias.",
      },
    ];
    let alertIdx = 0;
    const fireNextAlert = () => {
      if (cancelled) return;
      const al = smartAlerts[alertIdx % smartAlerts.length];
      const { gate, ...toast } = al;
      pushToast(toast, gate);
      alertIdx++;
      window.setTimeout(fireNextAlert, 22000);
    };
    const alertTimer = window.setTimeout(fireNextAlert, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(alertTimer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualRouteId(null);
  }, [profile]);

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
      pushToast(
        {
          kind: "warning",
          title: "Batería baja",
          detail: `Tu e-bike está al ${activeRide.batteryPct}%. Te conviene ir hacia una estación con docks libres.`,
        },
        "bikes",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRide]);



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
      const originLng = userLocation?.lng ?? -3.80998;
      const originLat = userLocation?.lat ?? 43.46231;

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    airQualityData.features.forEach((f: any) => {
                       const dist = haversineMeters({lng: coord[0], lat: coord[1]}, {lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1]});
                       if (dist < 200) { // within 200 meters of sensor
                          pollutionExposure += ((f.properties?.aqi || 0) / 100); 
                       }
                    });
                 }
                 if (incidentsData?.features) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const candidates = useMemo(() => generatedCandidates.length > 0 
    ? generatedCandidates 
    : (bundle?.routes.items ?? []), [generatedCandidates, bundle]);

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
    const isEcoTrip =
      (profile === "ECO" && leg.mode !== "bus") ||
      (leg.mode === "bus" && selectedEcoBusType !== null);
    const bonusEcoPoints = isEcoTrip ? 50 : 0;
    logTrip({
      mode: leg.mode as TripMode,
      distanceKm: leg.distanceKm,
      durationMinutes: leg.durationMinutes,
      co2Grams: c.metrics.estimatedCo2Grams,
      bonusEcoPoints,
      destination: destination?.name ?? "Destino",
    });
    if (bonusEcoPoints > 0) {
      const updatedStats = getStats();
      setEcoRewardTotalPoints(updatedStats.totalEcoPoints);
      const busInfo = leg.mode === "bus" && selectedEcoBusType ? ` (${selectedEcoBusType})` : "";
      setEcoRewardMessage(`Viaje ECO confirmado${busInfo}. ¡Has ganado +50 puntos!`);
      pushToast(
        {
          kind: "success",
          title: "Viaje ECO confirmado",
          detail: `+50 puntos eco añadidos. Tus puntos acumulados (${updatedStats.totalEcoPoints}) podrán canjearse próximamente por minutos gratis en TUeBICI.`,
        },
        "airQuality",
      );
    } else {
      setEcoRewardMessage(null);
      setEcoRewardTotalPoints(null);
    }
    setSustainKey((k) => k + 1);
  }, [candidates, destination, profile, pushToast, selectedEcoBusType]);

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
      pushToast(
        {
          kind: "warning",
          title: "No hay bicis disponibles",
          detail: `La estación “${selectedBikeStation.name}” no tiene e-bikes ahora mismo.`,
        },
        "bikes",
      );
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
    pushToast(
      {
        kind: battery <= 25 ? "warning" : "success",
        title: `E-bike desbloqueada (${battery}%)`,
        detail: battery <= 25 ? "Ojo: batería baja. Te avisaremos si necesitas cambiar de estación." : "Listo. Buen viaje.",
      },
      "bikes",
    );
  }, [pushToast, selectedBikeStation]);

  const handleReturn = useCallback(() => {
    if (!selectedBikeStation) return;

    if (selectedBikeStation.availableDocks > 0) {
      setActiveRide(null);
      pushToast(
        {
          kind: "success",
          title: "Bici devuelta",
          detail: `Devolución OK en “${selectedBikeStation.name}”.`,
        },
        "bikes",
      );
      return;
    }

    const nearest = findNearestStationWithDocks(
      { lng: selectedBikeStation.lng, lat: selectedBikeStation.lat },
      bikeStationsLite,
      { excludeId: selectedBikeStation.id },
    );

    if (!nearest) {
      pushToast(
        {
          kind: "warning",
          title: "Estación llena",
          detail: `No hay docks libres cerca de “${selectedBikeStation.name}”. Prueba otra zona.`,
        },
        "bikes",
      );
      return;
    }

    pushToast(
      {
        kind: "warning",
        title: "Estación llena",
        detail: `“${selectedBikeStation.name}” está completa. Alternativa: “${nearest.station.name}” (${formatMeters(nearest.distanceMeters)}).`,
        cta: {
          label: "Ir a la alternativa",
          destination: { lng: nearest.station.lng, lat: nearest.station.lat, name: nearest.station.name },
        },
      },
      "bikes",
    );
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
            pushToast(
              {
                kind: "info",
                title: `Estación: ${s.name}`,
                detail: `${s.availableBikes} bicis · ${s.availableDocks} docks` + (d ? ` · a ${formatMeters(d)}` : ""),
              },
              "bikes",
            );
          }}
          userLocation={userLocation}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex min-h-0 min-w-0 flex-col">
        <header className="pointer-events-none flex shrink-0 items-center justify-center px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          {/* Título a la izquierda */}
          <div className="pointer-events-auto absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] flex min-w-0 flex-col gap-1 sm:left-5">
            <Link
              href="/recompensas"
              className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--overlay-text-muted)] underline-offset-4 hover:underline"
            >
              Recompensas
            </Link>
            <h1 className="truncate text-lg font-bold tracking-tight text-[var(--overlay-text)] drop-shadow-sm sm:text-xl">
              Smart Route
            </h1>
          </div>

          {/* Notification Centre + Theme Switcher (top right) */}
          <div className="pointer-events-auto absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 sm:right-5">
            <NotificationCenter
              prefs={notifPrefs}
              onChange={(p: NotifPrefs) => { setNotifPrefs(p); setUnseenCount(0); }}
              unseenCount={unseenCount}
            />
            <ThemeSwitcher value={theme} onChange={setTheme} />
          </div>
        </header>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="pointer-events-auto mt-auto w-full min-w-0 max-w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 md:absolute md:bottom-4 md:left-4 md:mt-0 md:max-w-lg md:px-0 md:pb-0 lg:max-w-2xl transition-all duration-500 ease-in-out">
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              className="bg-[var(--overlay-surface)] border border-[var(--overlay-border)] text-[var(--overlay-text)] p-2.5 rounded-full shadow-lg backdrop-blur hover:bg-[var(--overlay-card)] hover:scale-110 active:scale-95 transition-all duration-300"
              aria-label={isPanelExpanded ? "Minimizar panel" : "Expandir panel"}
            >
              {isPanelExpanded ? <ChevronDown className="h-5 w-5 animate-in slide-in-from-top-1" /> : <ChevronUp className="h-5 w-5 animate-in slide-in-from-bottom-1" />}
            </button>
          </div>
          
          <div className={`overflow-y-auto rounded-3xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)]/90 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:rounded-2xl md:shadow-2xl transition-all duration-500 origin-bottom ease-in-out ${isPanelExpanded ? 'max-h-[min(44dvh,22rem)] md:max-h-[min(65dvh,36rem)] opacity-100 scale-100 translate-y-0' : 'max-h-0 opacity-0 scale-95 translate-y-4 overflow-hidden border-none shadow-none py-0'}`}>
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
                    onSelectEcoBusType={setSelectedEcoBusType}
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
                      
                      {ecoRewardMessage && ecoRewardTotalPoints !== null && (
                        <div className="mt-2 flex max-w-full flex-col gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-500">
                          <Leaf className="h-4 w-4" />
                          <span className="text-[0.75rem] font-bold">
                            {ecoRewardMessage}
                          </span>
                          <span className="text-[0.6875rem] text-emerald-600/90">
                            Tus puntos acumulados ({ecoRewardTotalPoints}) podr&aacute;n canjearse pr&oacute;ximamente por minutos gratis en TUeBICI.
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
         onSelectEcoBusType={setSelectedEcoBusType}
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

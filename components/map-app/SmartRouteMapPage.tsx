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
} from "@/lib/routing";
import { CoreMap, type MapLayerVisibility } from "@/components/map-app/CoreMap";
import { LayerToggleBar } from "@/components/map-app/LayerToggleBar";
import { RouteOptionStrip } from "@/components/map-app/RouteOptionStrip";
import { ThemeSwitcher } from "@/components/map-app/ThemeSwitcher";
import { ProfileSelector } from "@/components/routing/ProfileSelector";
import { ThemeProvider, useAppTheme } from "@/components/theme/ThemeProvider";

function MapExperience() {
  const { theme, setTheme, mapStyleUrl, routeLineColor } = useAppTheme();
  const [bundle, setBundle] = useState<MapDataBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>("PRISA");
  const [manualRouteId, setManualRouteId] = useState<string | null>(null);
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

  const candidates = bundle?.routes.items ?? [];

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

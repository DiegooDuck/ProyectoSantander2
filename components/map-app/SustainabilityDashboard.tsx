"use client";

import { useEffect, useState } from "react";
import { Leaf, Flame, TrendingUp, Award } from "lucide-react";
import { getStats, type SustainabilityStats } from "@/lib/sustainability/tracker";

export function SustainabilityDashboard() {
  const [stats, setStats] = useState<SustainabilityStats | null>(null);

  useEffect(() => {
    setStats(getStats());

    // Refrescar si otro tab logea un viaje
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("smartroute:sustainability")) {
        setStats(getStats());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Llamar externamente para refrescar tras registrar un viaje */
  const refresh = () => setStats(getStats());

  if (!stats) return null;

  const co2Kg = (stats.totalCo2SavedGrams / 1000).toFixed(1);
  const distKm = stats.totalDistanceKm.toFixed(1);
  const maxBarCo2 = Math.max(...stats.weeklyHistory.map((d) => d.co2Saved), 1);

  // Progress ring for level
  const circumference = 2 * Math.PI * 28; // r=28
  const dashOffset = circumference * (1 - stats.level.progress);

  return (
    <div className="flex flex-col gap-3">
      {/* Level + Progress */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] p-3">
        {/* Ring */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="currentColor"
              className="text-black/5 dark:text-white/5"
              strokeWidth="4"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="url(#ecoGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-xl">{stats.level.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-bold text-[var(--overlay-text)]">
            Nivel {stats.level.name}
          </p>
          <p className="text-[0.625rem] text-[var(--overlay-text-muted)]">
            {stats.totalEcoPoints.toLocaleString()} puntos eco
            {stats.level.nextLevel && (
              <> · {stats.level.nextLevelMinPoints! - stats.totalEcoPoints} para {stats.level.nextLevel}</>
            )}
          </p>
          {/* Mini progress bar */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
              style={{ width: `${stats.level.progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-2.5">
          <Leaf className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{co2Kg} kg</p>
          <p className="text-[8px] font-medium uppercase text-[var(--overlay-text-muted)]">CO₂ ahorrado</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-orange-500/10 bg-orange-500/5 p-2.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}</p>
          <p className="text-[8px] font-medium uppercase text-[var(--overlay-text-muted)]">Racha días</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-2.5">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{distKm} km</p>
          <p className="text-[8px] font-medium uppercase text-[var(--overlay-text-muted)]">Recorridos</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--overlay-text-muted)]">
            CO₂ ahorrado · 7 días
          </p>
          <p className="text-[0.625rem] text-[var(--overlay-text-muted)]">
            {stats.totalTrips} viajes totales
          </p>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {stats.weeklyHistory.map((day) => {
            const heightPct = maxBarCo2 > 0 ? (day.co2Saved / maxBarCo2) * 100 : 0;
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full flex items-end justify-center" style={{ height: "48px" }}>
                  <div
                    className={`w-full max-w-[20px] rounded-t-md transition-all duration-700 ease-out ${
                      isToday
                        ? "bg-gradient-to-t from-emerald-600 to-cyan-400"
                        : day.co2Saved > 0
                          ? "bg-emerald-500/40"
                          : "bg-black/5 dark:bg-white/5"
                    }`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    title={`${(day.co2Saved / 1000).toFixed(2)} kg CO₂ · ${day.trips} viajes`}
                  />
                </div>
                <span className={`text-[8px] font-medium ${isToday ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-[var(--overlay-text-muted)]"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode breakdown */}
      {stats.totalTrips > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] px-3 py-2">
          <Award className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex flex-1 gap-2 text-[0.6875rem]">
            <span className="text-[var(--overlay-text-muted)]">
              🚶 {stats.modeBreakdown.walking}
            </span>
            <span className="text-[var(--overlay-text-muted)]">
              🚲 {stats.modeBreakdown.cycling}
            </span>
            <span className="text-[var(--overlay-text-muted)]">
              🚌 {stats.modeBreakdown.bus}
            </span>
          </div>
          {stats.bestStreak > 0 && (
            <span className="text-[0.625rem] font-semibold text-amber-600 dark:text-amber-400">
              Récord: {stats.bestStreak}d 🔥
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export refresh helper
export { getStats } from "@/lib/sustainability/tracker";

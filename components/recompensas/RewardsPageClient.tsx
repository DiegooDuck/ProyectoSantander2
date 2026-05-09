"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState, useEffect } from "react";
import {
  Trophy,
  Leaf,
  Sparkles,
  Bus,
  Medal,
  Bike,
  Landmark,
  ArrowRight,
} from "lucide-react";
import type { SustainabilityStats } from "@/lib/sustainability/tracker";
import {
  calculateEcoPoints,
  getStats,
  ECO_POINT_LEVELS,
  type TripMode,
} from "@/lib/sustainability/tracker";
import {
  REDEEMABLE_REWARDS,
  buildWeeklyLeaderboard,
  CATEGORY_LABELS,
  type RewardCategory,
} from "@/lib/sustainability/rewards-data";
import { RewardsMapBackdrop, RewardsMapPreview } from "@/components/recompensas/RewardsMapDecor";

const MODE_LABELS: Record<TripMode, string> = {
  walking: "A pie",
  cycling: "Bicicleta",
  bus: "Autobús",
};

const MARQUEE_CHIPS = [
  "TUeBICI",
  "Bus urbano",
  "Museo Marítimo",
  "Pase Monte",
  "Puntos eco en vivo",
  "Perfil ECO",
  "Santander",
  "Cupones · demo",
] as const;

function formatCo2Kg(g: number): string {
  if (g < 1000) return `${Math.round(g)} g`;
  return `${(g / 1000).toFixed(1)} kg`;
}

function riseDelay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

function categoryAccentLight(cat: RewardCategory): string {
  switch (cat) {
    case "bus":
      return "from-sky-50 to-blue-50/95 border-sky-200/90 text-sky-950 shadow-[0_8px_32px_-8px_rgba(14,165,233,0.35)]";
    case "bike":
      return "from-emerald-50 to-teal-50/90 border-emerald-200/90 text-emerald-950 shadow-[0_8px_32px_-8px_rgba(52,211,153,0.35)]";
    case "culture":
      return "from-violet-50 to-fuchsia-50/80 border-violet-200/90 text-violet-950 shadow-[0_8px_32px_-8px_rgba(167,139,250,0.38)]";
    case "wellness":
      return "from-cyan-50 to-teal-50/80 border-cyan-200/90 text-teal-950 shadow-[0_8px_32px_-8px_rgba(6,182,212,0.32)]";
    case "locals":
      return "from-amber-50 to-orange-50/75 border-amber-200/90 text-amber-950 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.32)]";
    default:
      return "from-white to-zinc-50 border-zinc-200 text-zinc-900";
  }
}

function podiumLight(rank: number): string {
  if (rank === 1)
    return "bg-gradient-to-br from-amber-200 via-amber-100 to-yellow-50 border-amber-300 text-amber-950 ring-2 ring-amber-300/70 shadow-lg shadow-amber-300/30";
  if (rank === 2)
    return "bg-gradient-to-br from-zinc-200 via-zinc-100 to-white border-zinc-300 text-zinc-800 ring-2 ring-zinc-200";
  if (rank === 3)
    return "bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50 border-orange-300 text-orange-950 ring-2 ring-orange-200/70";
  return "border-slate-200 bg-white text-slate-800 shadow-sm";
}

export function RewardsPageClient() {
  const [stats, setStats] = useState<SustainabilityStats | null>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const leaderboard = useMemo(() => buildWeeklyLeaderboard(stats?.totalEcoPoints ?? 0), [stats]);

  const totalPoints = stats?.totalEcoPoints ?? 0;

  const earnRows = useMemo(() => {
    const sampleKm = 2;
    const modes: TripMode[] = ["walking", "cycling", "bus"];
    return modes.map((mode) => ({
      mode,
      label: MODE_LABELS[mode],
      per2km: calculateEcoPoints(mode, sampleKm),
    }));
  }, []);

  return (
    <div className="relative isolate min-h-[50vh] text-slate-800">
      <div className="-z-10 pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <RewardsMapBackdrop className="z-0 opacity-95" />
        <div className="rewards-bg-blob-a absolute z-[2] -left-28 top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-cyan-200/65 blur-[80px]" />
        <div className="rewards-bg-blob-b absolute z-[2] -right-20 top-[18%] h-[26rem] w-[26rem] rounded-full bg-emerald-300/55 blur-[90px]" />
        <div className="rewards-bg-blob-c absolute z-[2] bottom-[-14%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-sky-200/60 blur-[100px]" />
        <div className="absolute inset-0 z-[3] bg-gradient-to-b from-emerald-50/75 via-transparent to-white/92" />
        <div className="motion-safe:absolute motion-safe:inset-0 motion-safe:z-[3] motion-safe:bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.5)_42%,transparent_88%)] motion-safe:bg-[length:400%_200%] motion-safe:bg-[position:40%_-30%]" />
      </div>

      {/* Hero */}
      <section className="relative z-[1] overflow-hidden pb-14 pt-[calc(2rem+env(safe-area-inset-top))] sm:pb-20 sm:pt-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_min(420px,100%)] lg:items-start lg:gap-x-14">
            <div className="flex min-w-0 flex-col gap-8">
              <p
                className="animate-rewards-rise inline-flex max-w-fit items-center gap-2 rounded-full border border-emerald-400/55 bg-emerald-50/95 px-3.5 py-2 text-[0.8125rem] font-semibold tracking-wide text-emerald-900 shadow-md shadow-emerald-500/15 backdrop-blur-sm sm:text-sm"
                style={riseDelay(80)}
              >
                <Sparkles className="h-4 w-4 text-emerald-600 motion-safe:animate-pulse sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
                <span>Puntos eco · canje vivo</span>
              </p>

              <div className="animate-rewards-rise space-y-6" style={riseDelay(160)}>
                <div className="max-w-2xl space-y-4">
                  <h1 className="text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[3.25rem]">
                    Recompensas que{" "}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                      se mueven contigo
                    </span>
                  </h1>
                  <p className="text-[0.9375rem] leading-relaxed text-slate-600 sm:text-lg">
                    Cada trayecto sostenible en{" "}
                    <span className="font-semibold text-slate-800">Smart Route</span> suma puntos eco.
                    Canjea urbano, bicis, museos y experiencias locales — ciudad en movimiento, reales
                    recompensas (vista demo). El fondo recuerda al mapa donde ganas tus puntos.
                  </p>
                </div>
                <Link
                  href="/"
                  className="group inline-flex w-fit min-h-[3.25rem] shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-9 text-[0.9375rem] font-bold text-white shadow-[0_12px_40px_-12px_rgba(20,184,166,0.65)] ring-4 ring-teal-500/25 transition-[transform,filter] hover:brightness-110 motion-safe:active:scale-[0.98] lg:rounded-xl"
                  style={riseDelay(220)}
                >
                  Ir al mapa
                  <ArrowRight className="h-[1.125rem] w-[1.125rem] transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>

            <div
              className="animate-rewards-rise min-w-0 lg:sticky lg:top-[calc(5.5rem+env(safe-area-inset-top))] lg:self-start"
              style={riseDelay(280)}
            >
              <RewardsMapPreview />
              <p className="mt-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.12em] text-slate-500">
                Centro Bahía Santander · zoom demostrador
              </p>
            </div>
          </div>

          <div
            className="motion-safe:bg-white/65 motion-safe:border motion-safe:border-slate-200/80 animate-rewards-rise relative mt-6 overflow-hidden rounded-2xl py-3 shadow-inner shadow-emerald-100/40 backdrop-blur-md"
            style={riseDelay(320)}
          >
            <div className="rewards-marquee-track flex gap-x-14 sm:gap-x-20 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-6 motion-reduce:py-1">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex gap-x-14 sm:gap-x-20 motion-reduce:contents">
                  {MARQUEE_CHIPS.map((label) => (
                    <span
                      key={`${dup}-${label}`}
                      className="inline-flex items-center gap-2 whitespace-nowrap text-[0.75rem] font-bold uppercase tracking-[0.2em] text-slate-500 motion-reduce:px-3"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                      {label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Saldo destacado */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="motion-safe:border motion-safe:border-emerald-400/55 animate-rewards-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-[1px] shadow-[0_28px_60px_-32px_rgba(16,185,129,0.75)] motion-reduce:shadow-lg sm:col-span-2 lg:col-span-1 lg:row-span-2"
              style={riseDelay(400)}
            >
              <div className="motion-safe:to-white/92 relative flex h-full flex-col justify-center rounded-[0.935rem] bg-gradient-to-b from-emerald-50 via-white to-cyan-50/90 p-5">
                <div className="-z-0 pointer-events-none absolute -right-4 -top-4 h-36 w-36 rounded-full bg-emerald-300/40 blur-2xl motion-safe:animate-[rewards-twinkle_7s_ease-in-out_infinite]" aria-hidden />
                <Leaf className="relative mb-2 h-9 w-9 text-emerald-600 motion-safe:drop-shadow-[0_0_12px_rgba(16,185,129,0.45)] motion-safe:animate-[rewards-soft-pulse_4s_ease-in-out_infinite]" />
                <p className="relative text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-emerald-800/85">
                  Tu saldo eco
                </p>
                <p className="relative mt-2 text-5xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  {stats === null ? "—" : totalPoints.toLocaleString("es-ES")}
                </p>
                <p className="relative mt-3 text-[0.8125rem] text-slate-600">
                  {stats === null
                    ? "Cargando…"
                    : "Se actualiza al confirmar rutas en el mapa Smart Route."}
                </p>
              </div>
            </div>
            {[
              {
                key: "level",
                label: "Nivel actual",
                body: `${stats?.level.icon ?? "🌱"} ${stats?.level.name ?? "—"}`,
                extra: stats?.level.nextLevel ? (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[0.6875rem] text-slate-500">
                      <span>Hacia {stats!.level.nextLevel}</span>
                      <span>{Math.round(stats!.level.progress * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-[width] duration-700 ease-out"
                        style={{ width: `${Math.round((stats?.level.progress ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null,
              },
              {
                key: "co2",
                label: "CO₂ evitado",
                body: stats === null ? "—" : formatCo2Kg(stats.totalCo2SavedGrams),
                extra: (
                  <p className="mt-2 text-[0.75rem] text-slate-500">
                    Respecto al mismo trayecto en coche privado (est.).
                  </p>
                ),
              },
              {
                key: "streak",
                label: "Racha activa",
                body: stats === null ? "—" : `${stats.currentStreak} d`,
                extra: (
                  <p className="mt-2 text-[0.75rem] text-slate-500">
                    Mejor racha: {stats?.bestStreak ?? 0} días
                  </p>
                ),
              },
            ].map((card, i) => (
              <div
                key={card.key}
                className="motion-safe:border motion-safe:border-slate-200/90 animate-rewards-rise rounded-2xl bg-white/80 px-5 py-4 shadow-[0_12px_40px_-28px_rgba(15,118,110,0.35)] backdrop-blur-md motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform"
                style={riseDelay(440 + i * 90)}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">{card.body}</p>
                {card.extra}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo ganar */}
      <section id="como-ganar" className="border-y border-slate-200/80 bg-white/40 py-14 backdrop-blur-sm sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Cómo acumulas puntos eco
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
              Menos impacto que el coche, más puntos por kilómetro. Activa{" "}
              <span className="font-semibold text-emerald-700">perfil ECO</span> y confirma el viaje.
              Los bonus (+50) suman en trayectos ECO con bus eléctrico/híbrido cuando lo marques.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)]">
            <table className="w-full border-collapse text-left text-[0.875rem]">
              <thead className="border-b border-slate-200 bg-slate-50/90">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700 sm:px-6">Modo</th>
                  <th className="px-4 py-3 font-bold text-slate-700 sm:px-6">
                    Ejemplo (~2 km)
                  </th>
                  <th className="hidden px-6 py-3 font-bold text-slate-700 sm:table-cell">
                    Idea
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {earnRows.map((row, i) => (
                  <tr
                    key={row.mode}
                    className={
                      i < earnRows.length - 1
                        ? "border-b border-slate-100 transition-colors motion-safe:hover:bg-emerald-50/50"
                        : "transition-colors motion-safe:hover:bg-emerald-50/50"
                    }
                  >
                    <td className="px-4 py-4 font-semibold text-slate-800 sm:px-6">{row.label}</td>
                    <td className="px-4 py-4 tabular-nums font-semibold text-emerald-700 sm:px-6">
                      +{row.per2km} pts (aprox.)
                    </td>
                    <td className="hidden px-6 py-4 text-[0.8125rem] text-slate-500 sm:table-cell">
                      {row.mode === "walking" && "Sin emisiones · máximo rendimiento punto/km"}
                      {row.mode === "cycling" && "Combinación física · movilidad eléctrica ligera"}
                      {row.mode === "bus" && "Uso eficiente de plazas + bonus líneas limpias"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="motion-safe:border motion-safe:border-teal-200/80 animate-rewards-rise mt-8 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/60 p-6 shadow-inner shadow-teal-100/50 backdrop-blur-sm sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800/85">
              Escalones de nivel
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ECO_POINT_LEVELS.map((lvl, idx) => (
                <li
                  key={lvl.name}
                  className={`motion-safe:inline-flex motion-safe:animate-rewards-rise inline-flex transform items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-semibold motion-safe:hover:scale-105 motion-safe:transition-transform ${
                    stats && totalPoints >= lvl.minPoints
                      ? "border-emerald-400/65 bg-emerald-100 text-emerald-950 shadow-md shadow-emerald-200/45"
                      : "border-slate-200 bg-white/80 text-slate-400"
                  }`}
                  style={riseDelay(idx * 50)}
                >
                  <span aria-hidden>{lvl.icon}</span>
                  {lvl.name}
                  <span className="tabular-nums opacity-75">≥{lvl.minPoints}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo-canje" className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-200/70">
              <Medal className="h-4 w-4" aria-hidden />
              <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em]">
                Ranking de canjes
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Productos canjeables (orden por coste)
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
              Del más accesible al más exclusivo — bus, bicis, museos, bienestar y comercio local.
              Hover en tarjetas en desktop para un impulso sutil de profundidad.
            </p>
          </div>

          <ol className="flex flex-col gap-4">
            {REDEEMABLE_REWARDS.map((reward, ri) => {
              const canAfford = stats !== null && totalPoints >= reward.ecoPointsCost;
              const shortfall = stats !== null ? Math.max(0, reward.ecoPointsCost - totalPoints) : 0;
              return (
                <li
                  key={reward.id}
                  style={riseDelay(ri * 55)}
                  className={`motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl relative flex flex-col gap-4 rounded-2xl border bg-gradient-to-r p-5 motion-safe:animate-rewards-rise motion-safe:border motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out sm:flex-row sm:items-center sm:justify-between sm:p-6 ${categoryAccentLight(
                    reward.category,
                  )}`}
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`motion-safe:flex motion-safe:h-14 motion-safe:w-14 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black tabular-nums ring-white/70 ${
                        reward.rank <= 3 ? podiumLight(reward.rank) : podiumLight(0)
                      }`}
                    >
                      #{reward.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {CATEGORY_LABELS[reward.category]}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-2xl motion-safe:animate-[rewards-twinkle_5s_ease-in-out_infinite]" aria-hidden>
                          {reward.emoji}
                        </span>
                        <p className="text-lg font-bold text-slate-900">{reward.title}</p>
                      </div>
                      <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-slate-600">
                        {reward.subtitle}
                      </p>
                      {reward.partnerHint ? (
                        <p className="mt-3 text-[0.6875rem] text-slate-500">{reward.partnerHint}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Coste
                    </p>
                    <p className="text-2xl font-black tabular-nums text-slate-900">
                      {reward.ecoPointsCost.toLocaleString("es-ES")}{" "}
                      <span className="text-base font-bold text-slate-500">pts</span>
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-[0.6875rem] font-bold ${
                        stats === null
                          ? "border-slate-200 bg-slate-50 text-slate-500"
                          : canAfford
                            ? "border-emerald-400/65 bg-emerald-100 text-emerald-950"
                            : "border-amber-300/75 bg-amber-50 text-amber-950"
                      }`}
                    >
                      {stats === null ? "Calculando saldo…" : canAfford ? "¡Listo para canjear (demo)" : `Te faltan ${shortfall.toLocaleString("es-ES")} pts`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-4 text-[0.8125rem] leading-relaxed text-slate-500 backdrop-blur-sm">
            Este catálogo es demostración. Los cupones reales dependen de acuerdos con operadores; la
            app solo refleja tu saldo y progreso local.
          </p>
        </div>
      </section>

      {/* Ranking comunidad */}
      <section className="border-t border-slate-200/80 bg-gradient-to-b from-white/50 via-sky-50/40 to-emerald-50/50 py-14 backdrop-blur-md sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-lg motion-safe:animate-[rewards-soft-pulse_5s_ease-in-out_infinite]">
              <Trophy className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Ranking ejemplo · comunidad en movimiento
              </h2>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600">
                Perfiles inspirados en Santander y entorno. Tu fila aparece con puntos reales (ajustados
                al ranking de demo) cuando ya has viajado con la app.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:gap-4">
            {leaderboard.map((row, li) => (
              <li
                key={`${row.rank}-${row.displayName}`}
                style={riseDelay(li * 40)}
                className={`motion-safe:animate-rewards-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 transition-transform motion-safe:hover:scale-[1.01] sm:flex-nowrap sm:gap-6 ${
                  row.highlight
                    ? "border-emerald-400 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 shadow-[0_16px_40px_-24px_rgba(16,185,129,0.55)] ring-2 ring-emerald-300/50"
                    : "border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-sm motion-safe:hover:bg-white motion-safe:hover:shadow-lg"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[0.9375rem] font-black tabular-nums ${
                      row.rank <= 3 ? podiumLight(row.rank) : podiumLight(0)
                    }`}
                  >
                    {row.rank}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{row.displayName}</p>
                    <p className="text-[0.8125rem] text-slate-500">{row.subtitle}</p>
                  </div>
                </div>
                <p className="text-[0.9375rem] font-black tabular-nums text-teal-700 drop-shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                  {row.ecoPoints.toLocaleString("es-ES")} pts
                </p>
              </li>
            ))}
          </ul>

          <div className="motion-safe:border motion-safe:border-slate-200/90 animate-rewards-rise relative mx-auto mt-14 max-w-3xl overflow-hidden rounded-[1.75rem] bg-white/90 px-8 py-10 text-center shadow-[0_36px_80px_-52px_rgba(14,165,233,0.65)] backdrop-blur-md">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(56,189,248,0.18),transparent_65%)]" aria-hidden />
            <Bus className="relative mx-auto mb-5 h-10 w-10 text-sky-500 motion-safe:animate-[rewards-float_8s_ease-in-out_infinite]" aria-hidden />
            <h3 className="relative text-xl font-bold text-slate-900">Sube posiciones desde el mapa</h3>
            <p className="relative mt-4 text-[0.875rem] leading-relaxed text-slate-600">
              Planea con ECO, combina TUeBICI y líneas más limpias: cada confirmación mueve tus puntos
              y tus recompensas en esta experiencia guiada.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 min-w-[11rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-8 text-[0.9375rem] font-bold text-white shadow-lg shadow-teal-500/35 transition-[transform,filter] hover:brightness-110 motion-safe:active:scale-[0.98]"
              >
                Volver al mapa
                <ArrowRight className="h-[1.125rem] w-[1.125rem]" />
              </Link>
              <a
                href="#catalogo-canje"
                className="inline-flex min-h-12 min-w-[11rem] items-center justify-center rounded-xl border-2 border-slate-300 bg-white/80 px-8 text-[0.9375rem] font-bold text-slate-800 transition-colors hover:border-slate-400 hover:bg-white"
              >
                Ver catálogo
              </a>
            </div>
            <div className="relative mx-auto mt-9 flex justify-center gap-10 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span className="flex items-center gap-2 text-sky-600">
                <Bus className="h-5 w-5" aria-hidden /> Bus
              </span>
              <span className="flex items-center gap-2 text-emerald-600">
                <Bike className="h-5 w-5" aria-hidden /> Bici
              </span>
              <span className="flex items-center gap-2 text-violet-600">
                <Landmark className="h-5 w-5" aria-hidden /> Museos
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

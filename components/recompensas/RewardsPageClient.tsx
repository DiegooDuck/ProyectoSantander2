"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Trophy, Leaf, Sparkles, Bus, Medal, Bike, Landmark } from "lucide-react";
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

const MODE_LABELS: Record<TripMode, string> = {
  walking: "A pie",
  cycling: "Bicicleta",
  bus: "Autobús",
};

function formatCo2Kg(g: number): string {
  if (g < 1000) return `${Math.round(g)} g`;
  return `${(g / 1000).toFixed(1)} kg`;
}

function categoryAccent(cat: RewardCategory): string {
  switch (cat) {
    case "bus":
      return "from-sky-500/20 to-blue-600/10 border-sky-500/25 text-sky-200";
    case "bike":
      return "from-emerald-500/20 to-teal-600/10 border-emerald-500/25 text-emerald-100";
    case "culture":
      return "from-violet-500/20 to-purple-700/10 border-violet-500/25 text-violet-100";
    case "wellness":
      return "from-cyan-500/15 to-teal-500/10 border-cyan-500/30 text-cyan-100";
    case "locals":
      return "from-amber-500/15 to-orange-700/10 border-amber-500/25 text-amber-100";
    default:
      return "from-white/10 to-transparent border-white/10 text-zinc-200";
  }
}

function podiumStyle(rank: number): string {
  if (rank === 1)
    return "bg-gradient-to-br from-amber-500/35 via-yellow-600/25 to-transparent border-amber-400/50 ring-1 ring-amber-400/35";
  if (rank === 2)
    return "bg-gradient-to-br from-zinc-300/25 via-zinc-400/15 to-transparent border-zinc-300/35";
  if (rank === 3)
    return "bg-gradient-to-br from-orange-700/35 to-amber-900/25 border-orange-600/35";
  return "border-white/[0.08] bg-white/[0.03]";
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
    <>
      <section className="relative isolate overflow-hidden border-b border-white/[0.06] pb-14 pt-[calc(2.75rem+env(safe-area-inset-top))] sm:pb-18 sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_100%_70%_at_50%_-30%,rgba(52,211,153,0.22),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_40%,rgba(56,189,248,0.14),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_90%,rgba(167,139,250,0.12),transparent_48%)]"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 sm:px-6 lg:px-8">
          <p className="inline-flex max-w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[0.8125rem] font-medium tracking-wide text-emerald-100/95 shadow-sm backdrop-blur-sm sm:text-sm">
            <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden />
            <span>Puntos eco · ciudad movible</span>
          </p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-[2rem] font-bold leading-[1.06] tracking-[-0.02em] text-white sm:text-5xl lg:text-[3.25rem]">
                Recompensas por moverte mejor
              </h1>
              <p className="text-[0.9375rem] leading-relaxed text-zinc-400 sm:text-lg">
                Cada trayecto sostenible en{" "}
                <span className="font-semibold text-zinc-200">Smart Route</span> suma puntos eco.
                Canjéalos por experiencias locales, transporte y cultura — una economía ligada al
                aire que respiras en Santander y alrededores.
              </p>
            </div>
            <Link
              href="/"
              className="flex min-h-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-8 text-[0.9375rem] font-semibold text-zinc-950 shadow-lg shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.98] lg:rounded-xl"
            >
              Ir al mapa y ganar puntos
            </Link>
          </div>

          {/* Saldo destacado */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 to-zinc-950/90 p-5 shadow-xl shadow-emerald-900/20 sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:flex lg:flex-col lg:justify-center">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" aria-hidden />
              <Leaf className="mb-2 h-9 w-9 text-emerald-400" />
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-emerald-200/85">
                Tu saldo eco
              </p>
              <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-white">
                {stats === null ? "—" : totalPoints.toLocaleString("es-ES")}
              </p>
              <p className="mt-3 text-[0.8125rem] text-emerald-100/75">
                {stats === null
                  ? "Cargando…"
                  : "Se actualiza cuando confirmas rutas desde el panel del mapa."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
                Nivel actual
              </p>
              <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-white">
                <span>{stats?.level.icon ?? "🌱"}</span>
                {stats?.level.name ?? "—"}
              </p>
              {stats?.level.nextLevel && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[0.6875rem] text-zinc-500">
                    <span>Hacia {stats.level.nextLevel}</span>
                    <span>{Math.round(stats.level.progress * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                      style={{ width: `${Math.round(stats.level.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
                CO₂ evitado
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {stats === null ? "—" : formatCo2Kg(stats.totalCo2SavedGrams)}
              </p>
              <p className="mt-2 text-[0.75rem] text-zinc-500">Vs. ir todo el mismo trazado en coche.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
                Racha activa
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {stats === null ? "—" : `${stats.currentStreak} d`}
              </p>
              <p className="mt-2 text-[0.75rem] text-zinc-500">
                Mejor racha histórica: {stats?.bestStreak ?? 0} días
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo ganar puntos */}
      <section id="como-ganar" className="border-b border-white/[0.06] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Cómo acumulas puntos eco
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-zinc-400">
              Cuanto menos impacto tiene tu modo frente al coche, más puntos obtienes por kilómetro.
              Activa perfil{" "}
              <span className="font-medium text-emerald-300">ECO</span> en el mapa y confirma el
              viaje para registrar el trayecto. Bonificaciones puntuales (por ejemplo +50 en viajes
              ECO de autobús eléctrico/híbrido) se suman al total.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/40">
            <table className="w-full border-collapse text-left text-[0.875rem]">
              <thead className="border-b border-white/[0.08] bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-300 sm:px-6">Modo</th>
                  <th className="px-4 py-3 font-semibold text-zinc-300 sm:px-6">
                    Ejemplo (2 km de ruta elegida)
                  </th>
                  <th className="hidden px-6 py-3 font-semibold text-zinc-300 sm:table-cell">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {earnRows.map((row, i) => (
                  <tr
                    key={row.mode}
                    className={
                      i < earnRows.length - 1 ? "border-b border-white/[0.05]" : undefined
                    }
                  >
                    <td className="px-4 py-4 font-medium text-zinc-200 sm:px-6">{row.label}</td>
                    <td className="px-4 py-4 tabular-nums text-emerald-200 sm:px-6">
                      +{row.per2km} pts eco (aprox.)
                    </td>
                    <td className="hidden px-6 py-4 text-[0.8125rem] text-zinc-500 sm:table-cell">
                      {row.mode === "walking" && "Mayor coeficiente: sin emisiones directas"}
                      {row.mode === "cycling" && "Balance energía física vs. motor"}
                      {row.mode === "bus" && "Líneas con vehículos limpios pueden sumar bonus"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Escalón de nivel
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ECO_POINT_LEVELS.map((lvl) => (
                <li
                  key={lvl.name}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-medium ${
                    stats && totalPoints >= lvl.minPoints
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
                      : "border-white/[0.08] bg-transparent text-zinc-500"
                  }`}
                >
                  <span>{lvl.icon}</span>
                  {lvl.name}
                  <span className="tabular-nums text-zinc-500">≥{lvl.minPoints}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ranking canjes */}
      <section id="catalogo-canje" className="border-b border-white/[0.06] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 text-amber-200/90">
                <Medal className="h-5 w-5" />
                <span className="text-[0.75rem] font-bold uppercase tracking-[0.2em]">
                  Ranking de recompensas
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Catálogo canjeable (demostración)
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-zinc-400">
                Orden ascendente por coste en puntos: los primeros lugares son canjes rápidos; al
                bajar ves experiencias más exclusivas (bus, bicis, museos y más).
              </p>
            </div>
          </div>

          <ol className="flex flex-col gap-4">
            {REDEEMABLE_REWARDS.map((reward) => {
              const canAfford = stats !== null && totalPoints >= reward.ecoPointsCost;
              const shortfall = stats !== null ? Math.max(0, reward.ecoPointsCost - totalPoints) : 0;
              return (
                <li
                  key={reward.id}
                  className={`relative flex flex-col gap-4 rounded-2xl border bg-gradient-to-r p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${categoryAccent(
                    reward.category,
                  )}`}
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold tabular-nums text-white ring-2 ring-white/10 ${
                        reward.rank <= 3 ? podiumStyle(reward.rank) : "border border-white/[0.08] bg-white/[0.03]"
                      }`}
                    >
                      #{reward.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-zinc-500">
                        {CATEGORY_LABELS[reward.category]}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {reward.emoji}
                        </span>
                        <p className="text-lg font-semibold text-white">{reward.title}</p>
                      </div>
                      <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-zinc-400">
                        {reward.subtitle}
                      </p>
                      {reward.partnerHint && (
                        <p className="mt-3 text-[0.6875rem] text-zinc-600">{reward.partnerHint}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
                      Coste
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-white">
                      {reward.ecoPointsCost.toLocaleString("es-ES")}{" "}
                      <span className="text-base font-semibold text-zinc-400">pts</span>
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[0.6875rem] font-semibold ${
                        stats === null
                          ? "border-white/[0.1] text-zinc-500"
                          : canAfford
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {stats === null ? "Calculando saldo…" : canAfford ? "Saldo suficiente" : `Te faltan ${shortfall.toLocaleString("es-ES")} pts`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 text-[0.8125rem] leading-relaxed text-zinc-500">
            Este catálogo es una vista previa conceptual. La activación real de cupones depende de
            acuerdos con operadores locales; desde la app solo vemos tus puntos y tu progreso.
          </p>
        </div>
      </section>

      {/* Ranking semanal */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-start gap-3">
            <Trophy className="mt-0.5 h-8 w-8 shrink-0 text-amber-400" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Ranking ejemplo · comunidad
              </h2>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-400">
                Comparamos puntos anonimizados con perfiles imaginarios típicos de una ciudad compacta como
                Santander. Tus puntos reales aparecen cuando ya has registrado trayectos.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:gap-4">
            {leaderboard.map((row) => (
              <li
                key={`${row.rank}-${row.displayName}`}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4 sm:flex-nowrap sm:gap-6 ${
                  row.highlight
                    ? "border-emerald-400/35 bg-emerald-500/[0.08] shadow-[inset_0_0_0_1px_rgba(52,211,153,0.12)]"
                    : "border-white/[0.08] bg-zinc-950/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[0.9375rem] font-bold tabular-nums text-white ring-2 ring-black/40 ${
                      row.rank <= 3
                        ? podiumStyle(row.rank)
                        : "bg-white/[0.06]"
                    }`}
                  >
                    {row.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{row.displayName}</p>
                    <p className="text-[0.8125rem] text-zinc-500">{row.subtitle}</p>
                  </div>
                </div>
                <p className="text-[0.9375rem] font-bold tabular-nums text-emerald-200">
                  {row.ecoPoints.toLocaleString("es-ES")} pts
                </p>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_60%)] px-8 py-10 text-center">
            <Bus className="mx-auto mb-4 h-9 w-9 text-sky-400" aria-hidden />
            <h3 className="text-lg font-semibold text-white">¿Listo para subir posiciones?</h3>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-zinc-400">
              Planea rutas con perfil ECO, usa autobús híbrido/eléctrico cuando marques la opción y
              mezcla bici TUeBICI: tus puntos crecen y desbloquean mejores recompensas en este ranking.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-xl bg-emerald-500 px-8 text-[0.9375rem] font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Volver al mapa
              </Link>
              <a
                href="#catalogo-canje"
                className="inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-xl border border-white/15 px-8 text-[0.9375rem] font-semibold text-zinc-100 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                Ver canjes otra vez
              </a>
            </div>
            <div className="mx-auto mt-8 flex justify-center gap-8 text-zinc-500">
              <span className="flex items-center gap-2">
                <Bus className="h-4 w-4" aria-hidden /> Bus
              </span>
              <span className="flex items-center gap-2">
                <Bike className="h-4 w-4" aria-hidden /> Bici
              </span>
              <span className="flex items-center gap-2">
                <Landmark className="h-4 w-4" aria-hidden /> Museos
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

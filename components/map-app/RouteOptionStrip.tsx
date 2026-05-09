"use client";

import type { ScoredRoute, UserProfile } from "@/lib/routing";

function totalMinutes(scored: ScoredRoute): number {
  return scored.candidate.legs.reduce((s, l) => s + l.durationMinutes, 0);
}

export function RouteOptionStrip({
  ranked,
  selectedId,
  onSelect,
  profile,
}: {
  ranked: ScoredRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  profile: UserProfile | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
          Rutas
        </p>
        <span className="text-[0.625rem] text-[var(--overlay-text-muted)]">
          {profile ? "Ordenadas por tu perfil" : "Ordenadas por balance neutral"}
        </span>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {[...ranked]
          .sort(
            (a, b) =>
              a.breakdown.weightedTotal - b.breakdown.weightedTotal,
          )
          .map((s, idx) => {
            const id = s.candidate.id;
            const selected = selectedId === id;
            const badge =
              idx === 0 ? (
                <span className={`rounded px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide ${profile ? 'bg-[var(--overlay-accent-soft)] text-[var(--overlay-accent)]' : 'bg-zinc-500/10 text-zinc-400'}`}>
                  {profile ? "Top" : "Balanceada"}
                </span>
              ) : null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex min-w-[11.5rem] shrink-0 snap-start flex-col gap-1 rounded-2xl border px-3 py-2.5 text-left transition sm:min-w-[13rem] ${
                  selected
                    ? "border-[var(--overlay-accent)] bg-[var(--overlay-accent-soft)] shadow-[0_0_0_1px_var(--overlay-accent-glow)]"
                    : "border-[var(--overlay-border)] bg-[var(--overlay-card)] hover:border-[var(--overlay-border-strong)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {badge}
                  <span className="text-[0.6875rem] font-semibold text-[var(--overlay-text-muted)]">
                    {totalMinutes(s)} min
                  </span>
                </div>
                <span className="line-clamp-2 text-[0.8125rem] font-medium leading-snug text-[var(--overlay-text)]">
                  {s.candidate.label}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

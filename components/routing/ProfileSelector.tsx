"use client";

import type { UserProfile } from "@/lib/routing";
import { ALL_PROFILES, PROFILE_COPY } from "@/lib/routing";

type ProfileSelectorProps = {
  value: UserProfile | null;
  onChange: (profile: UserProfile | null) => void;
  disabled?: boolean;
  layout?: "default" | "compact";
};

export function ProfileSelector({
  value,
  onChange,
  disabled = false,
  layout = "default",
}: ProfileSelectorProps) {
  const handleToggle = (id: UserProfile) => {
    if (value === id) {
      onChange(null);
    } else {
      onChange(id);
    }
  };
  if (layout === "compact") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
          Perfil
        </p>
        <div
          role="radiogroup"
          aria-label="Perfil de ruta"
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {ALL_PROFILES.map((id) => {
            const selected = value === id;
            const copy = PROFILE_COPY[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => handleToggle(id)}
                className={`flex min-w-[9.25rem] shrink-0 snap-start flex-col rounded-2xl border px-3 py-2 text-left transition sm:min-w-[10rem] ${
                  selected
                    ? "border-[var(--overlay-accent)] bg-[var(--overlay-accent-soft)] shadow-[0_0_0_1px_var(--overlay-accent-glow)]"
                    : "border-[var(--overlay-border)] bg-[var(--overlay-card)] hover:border-[var(--overlay-border-strong)]"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
                  {id}
                </span>
                <span className="text-sm font-semibold text-[var(--overlay-text)]">
                  {copy.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Perfil de ruta"
      className="flex w-full flex-col gap-2 md:flex-row md:gap-3"
    >
      {ALL_PROFILES.map((id) => {
        const selected = value === id;
        const copy = PROFILE_COPY[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => handleToggle(id)}
            className={`flex min-h-[3.25rem] w-full flex-col items-start rounded-2xl border px-4 py-3 text-left transition md:min-h-0 md:flex-1 md:rounded-xl ${
              selected
                ? "border-[var(--overlay-accent)] bg-[var(--overlay-accent-soft)] shadow-[0_0_0_1px_var(--overlay-accent-glow)]"
                : "border-[var(--overlay-border)] bg-[var(--overlay-card)] hover:border-[var(--overlay-border-strong)]"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
              {id}
            </span>
            <span className="text-base font-semibold text-[var(--overlay-text)]">
              {copy.title}
            </span>
            <span className="text-[0.8125rem] leading-snug text-[var(--overlay-text-muted)]">
              {copy.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

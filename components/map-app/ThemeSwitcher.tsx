"use client";

import type { AppThemeId } from "@/lib/theme/constants";
import { APP_THEMES } from "@/lib/theme/constants";

const LABELS: Record<AppThemeId, string> = {
  dark: "Oscuro",
  light: "Claro",
  illuminated: "Ciudad",
  satellite: "Satélite",
};

export function ThemeSwitcher({
  value,
  onChange,
}: {
  value: AppThemeId;
  onChange: (t: AppThemeId) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Tema visual"
      className="flex shrink-0 gap-1 rounded-full border border-[var(--overlay-border)] bg-[var(--overlay-muted-bg)] p-1"
    >
      {APP_THEMES.map((id) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={on}
            className={`rounded-full px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition sm:px-3 ${
              on
                ? "bg-[var(--overlay-accent-soft)] text-[var(--overlay-text)] shadow-sm"
                : "text-[var(--overlay-text-muted)] hover:text-[var(--overlay-text)]"
            }`}
          >
            {LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}

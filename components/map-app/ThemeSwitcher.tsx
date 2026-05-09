"use client";

import type { AppThemeId } from "@/lib/theme/constants";
import { APP_THEMES } from "@/lib/theme/constants";
import { Moon, Sun, Building2, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const LABELS: Record<AppThemeId, string> = {
  dark: "Oscuro",
  light: "Claro",
  illuminated: "Ciudad",
  satellite: "Satélite",
};

const ICONS: Record<AppThemeId, LucideIcon> = {
  dark: Moon,
  light: Sun,
  illuminated: Building2,
  satellite: Globe,
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
      className="pointer-events-auto flex shrink-0 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl shadow-2xl"
    >
      {APP_THEMES.map((id) => {
        const on = value === id;
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(id);
            }}
            aria-pressed={on}
            title={LABELS[id]}
            className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-[0.625rem] font-bold uppercase tracking-wider transition-all duration-300 sm:px-4 ${
              on
                ? "bg-indigo-600 text-white shadow-lg scale-105 z-10"
                : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 transition-transform duration-500 ${on ? "rotate-0" : "rotate-12 group-hover:rotate-0"}`} />
            <span className="hidden sm:inline">{LABELS[id]}</span>
            
            {on && (
              <span className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
            )}
          </button>
        );
      })}
    </div>
  );
}

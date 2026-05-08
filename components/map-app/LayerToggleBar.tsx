"use client";

import type { MapLayerVisibility } from "@/components/map-app/CoreMap";

type LayerToggleBarProps = {
  layers: MapLayerVisibility;
  onChange: (next: MapLayerVisibility) => void;
};

export function LayerToggleBar({ layers, onChange }: LayerToggleBarProps) {
  const toggle = (key: keyof MapLayerVisibility) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  const pill = (
    key: keyof MapLayerVisibility,
    label: string,
    emoji: string,
  ) => {
    const on = layers[key];
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => toggle(key)}
        className={`flex min-h-11 flex-1 basis-[30%] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-[0.6875rem] font-semibold transition sm:basis-0 sm:flex-row sm:gap-1.5 sm:px-3 ${
          on
            ? "border-[var(--overlay-accent)] bg-[var(--overlay-accent-soft)] text-[var(--overlay-text)]"
            : "border-[var(--overlay-border)] bg-[var(--overlay-card)] text-[var(--overlay-text-muted)] hover:border-[var(--overlay-border-strong)]"
        }`}
      >
        <span aria-hidden className="text-base leading-none">
          {emoji}
        </span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
        Capas en mapa
      </p>
      <div className="flex w-full flex-wrap gap-2">
        {pill("buses", "Bus", "🚌")}
        {pill("bikes", "Bici", "🚲")}
        {pill("traffic", "Tráfico", "🟠")}
      </div>
    </div>
  );
}

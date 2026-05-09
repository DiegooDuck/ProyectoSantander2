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

  const selectAll = () => {
    onChange({ buses: true, bikes: true, traffic: true, parking: true, airQuality: true, incidents: true });
  };

  const deselectAll = () => {
    onChange({ buses: false, bikes: false, traffic: false, parking: false, airQuality: false, incidents: false });
  };

  const allSelected = layers.buses && layers.bikes && layers.traffic && layers.parking && layers.airQuality && layers.incidents;
  const noneSelected = !layers.buses && !layers.bikes && !layers.traffic && !layers.parking && !layers.airQuality && !layers.incidents;

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

  const bulkButton = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-9 flex-1 basis-[45%] items-center justify-center rounded-lg border px-2 py-1.5 text-[0.625rem] font-semibold transition sm:basis-0 sm:px-3 ${
        disabled
          ? "cursor-not-allowed border-[var(--overlay-border)] bg-[var(--overlay-card)] text-[var(--overlay-text-muted)] opacity-50"
          : "border-[var(--overlay-accent)] bg-[var(--overlay-accent-soft)] text-[var(--overlay-accent)] hover:bg-[var(--overlay-accent-soft-hover)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--overlay-text-muted)]">
        Capas en mapa
      </p>
      <div className="flex w-full flex-wrap gap-2">
        {pill("buses", "Bus", "🚌")}
        {pill("bikes", "Bici", "🚲")}
        {pill("parking", "Parking", "🅿️")}
        {pill("traffic", "Tráfico", "🟠")}
        {pill("airQuality", "Aire", "💨")}
        {pill("incidents", "Avisos", "🚧")}
      </div>
      <div className="flex w-full gap-2">
        {bulkButton("Seleccionar todo", selectAll, allSelected)}
        {bulkButton("Deseleccionar todo", deselectAll, noneSelected)}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";

export type Destination = {
  name: string;
  coordinates: [number, number]; // [lng, lat]
};

export type DestinationInputProps = {
  onDestinationSelect: (destination: Destination) => void;
  onClear?: () => void;
  onConfirm?: () => void;
  isConfirming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  currentDestination?: Destination | null;
};

// Lugares populares en Santander para autocompletar
const POPULAR_DESTINATIONS: Array<{
  name: string;
  coordinates: [number, number];
  description?: string;
}> = [
  { name: "Plaza Porticada", coordinates: [-3.8078, 43.4623], description: "Centro histórico" },
  { name: "Playa del Sardinero", coordinates: [-3.7956, 43.4765], description: "Playa principal" },
  { name: "Palacio de Festivales", coordinates: [-3.8046, 43.4637], description: "Centro cultural" },
  { name: "Gran Casino", coordinates: [-3.7968, 43.4748], description: "Casino y playa" },
  { name: "Parque de la Magdalena", coordinates: [-3.7895, 43.4728], description: "Parque y palacio" },
  { name: "Catedral Santander", coordinates: [-3.8091, 43.4626], description: "Catedral" },
  { name: "Puerto Chico", coordinates: [-3.8067, 43.4612], description: "Puerto deportivo" },
  { name: "Estación de Tren", coordinates: [-3.8049, 43.4628], description: "Renfe" },
  { name: "Hospital Valdecilla", coordinates: [-3.8667, 43.4789], description: "Hospital" },
  { name: "Universidad de Cantabria", coordinates: [-3.8098, 43.4745], description: "Campus" },
];

export function DestinationInput({
  onDestinationSelect,
  onClear,
  onConfirm,
  isConfirming = false,
  placeholder = "¿A dónde quieres ir?",
  disabled = false,
  currentDestination,
}: DestinationInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof POPULAR_DESTINATIONS>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(
        (dest) =>
          dest.name.toLowerCase().includes(value.toLowerCase()) ||
          dest.description?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions(POPULAR_DESTINATIONS.slice(0, 5)); // Mostrar primeros 5 por defecto
      setIsOpen(true);
    }
  }, []);

  const handleDestinationSelect = useCallback((destination: typeof POPULAR_DESTINATIONS[0]) => {
    const dest: Destination = {
      name: destination.name,
      coordinates: destination.coordinates,
    };
    onDestinationSelect(dest);
    setQuery(destination.name);
    setIsOpen(false);
  }, [onDestinationSelect]);

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    onClear?.();
  }, [onClear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {currentDestination ? (
            <MapPin className="h-4 w-4 text-emerald-500" />
          ) : (
            <Search className="h-4 w-4 text-[var(--overlay-text-muted)]" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length === 0) {
              setSuggestions(POPULAR_DESTINATIONS.slice(0, 5));
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-3 rounded-2xl border border-[var(--overlay-border)]
            bg-[var(--overlay-surface)] text-[var(--overlay-text)]
            placeholder-[var(--overlay-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
            transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--overlay-text-muted)] hover:text-[var(--overlay-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {currentDestination && onConfirm && (
        <div className="mt-2">
          <button
            onClick={onConfirm}
            disabled={isConfirming || disabled}
            className={`
              w-full flex items-center justify-center py-3 rounded-2xl bg-emerald-500 text-white font-medium 
              hover:bg-emerald-600 transition-colors shadow-sm
              ${isConfirming || disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isConfirming ? "Calculando ruta..." : "Confirmar destino y buscar ruta"}
          </button>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)] shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((destination, index) => (
              <button
                key={`${destination.name}-${index}`}
                onClick={() => handleDestinationSelect(destination)}
                className="w-full text-left px-3 py-3 rounded-xl hover:bg-[var(--overlay-card)] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--overlay-text)] group-hover:text-emerald-500 transition-colors">
                      {destination.name}
                    </div>
                    {destination.description && (
                      <div className="text-sm text-[var(--overlay-text-muted)] mt-0.5">
                        {destination.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

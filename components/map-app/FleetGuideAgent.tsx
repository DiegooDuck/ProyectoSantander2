"use client";

import { useEffect, useState, useRef } from "react";
import { Bot, Sparkles, Mic, MicOff } from "lucide-react";

// Add type for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type FleetVehicle = {
  "ayto:PlazasDePie": string;
  "ayto:Longitud": string;
  "dc:identifier": string;
  "ayto:Combustible": string;
  "ayto:PlazasSentadas": string;
  "dc:modified": string;
};

type FleetStats = {
  totalVehicles: number;
  totalCapacity: number;
  fuelTypes: Record<string, number>;
  dieselPercentage: number;
  ecoPercentage: number;
};

export function FleetGuideAgent() {
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "es-ES";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          // Auto-submit if transcript is meaningful
          if (transcript.length > 2) {
            handleSendMessage(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    setMessages((s) => [...s, { sender: "user", text: userText }]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const j = await res.json();
      const reply = j?.reply || 'Lo siento, no tengo una respuesta ahora.';
      setMessages((s) => [...s, { sender: 'agent', text: reply }]);
    } catch (err) {
      setMessages((s) => [...s, { sender: 'agent', text: 'Error de conexión con el agente.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // Try to load cached stats first for instant UI
    try {
      const raw = localStorage.getItem("fleetStats:v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.stats) {
          setStats(parsed.stats as FleetStats);
          setLastUpdated(parsed.updatedAt || null);
          setIsLoading(false);
        }
      }
    } catch (e) {
      console.warn("Failed to read cached fleet stats", e);
    }

    // Fetch fresh data
    fetchFleet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchFleet() {
    setError(null);
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/santander/fleet");
      if (!res.ok) throw new Error("Error fetching fleet data");
      const data = await res.json();

      if (data.resources) {
        const vehicles: FleetVehicle[] = data.resources;
        let totalCapacity = 0;
        const fuelTypes: Record<string, number> = {};

        vehicles.forEach((v) => {
          const seats = parseInt(v["ayto:PlazasSentadas"]) || 0;
          const standing = parseInt(v["ayto:PlazasDePie"]) || 0;
          totalCapacity += seats + standing;

          const fuel = v["ayto:Combustible"]?.toUpperCase() || "DESCONOCIDO";
          fuelTypes[fuel] = (fuelTypes[fuel] || 0) + 1;
        });

        const totalVehicles = vehicles.length;
        const diesel = fuelTypes["DIESEL"] || 0;
        const hybrid = fuelTypes["HIBRIDO"] || fuelTypes["HÍBRIDO"] || 0;
        const electric = fuelTypes["ELECTRICO"] || fuelTypes["ELÉCTRICO"] || 0;

        const newStats: FleetStats = {
          totalVehicles,
          totalCapacity,
          fuelTypes,
          dieselPercentage: totalVehicles > 0 ? (diesel / totalVehicles) * 100 : 0,
          ecoPercentage: totalVehicles > 0 ? ((hybrid + electric) / totalVehicles) * 100 : 0,
        };

        setStats(newStats);
        const now = new Date().toISOString();
        setLastUpdated(now);
        try {
          localStorage.setItem("fleetStats:v1", JSON.stringify({ stats: newStats, updatedAt: now }));
        } catch (e) {
          console.warn("Failed to cache fleet stats", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al cargar datos de la flota");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }

  // Accessibility: focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // focus input when opened
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Tab") {
        // basic focus trap inside panel
        const el = panelRef.current;
        if (!el) return;
        const focusable = el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Poll every 5 minutes
    const interval = setInterval(() => {
      fetchFleet();
    }, 5 * 60 * 1000);

    // Refresh when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchFleet();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the floating button visible even while loading; show loading inside panel

  return (
    <div className="absolute right-4 bottom-10 z-20 flex flex-col items-end gap-2 md:bottom-12">
      {/* Botón Flotante del Agente */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="fleet-agent-panel"
        aria-label={isOpen ? "Cerrar agente Smart Data" : "Abrir agente Smart Data"}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all hover:scale-110 hover:bg-indigo-500"
      >
        <Bot className="h-7 w-7 text-white" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400">
          <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        </span>
      </button>

      {/* Panel de Análisis y Chat */}
      <div
        id="fleet-agent-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fleet-agent-title"
        aria-describedby="fleet-agent-desc"
        className={`w-80 max-w-sm overflow-hidden rounded-2xl border border-[var(--overlay-border)] bg-[var(--overlay-surface)]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none hidden'}`}
      >
          <div className="flex items-center gap-3 border-b border-white/10 bg-indigo-600/10 p-4">
          <div className="relative rounded-full bg-indigo-500/20 p-2">
            <Sparkles id="fleet-agent-title" className="h-5 w-5 text-indigo-400" />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/10"></span>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--overlay-text)]">Agente Smart Data</h3>
            <p id="fleet-agent-desc" className="text-[10px] font-medium uppercase tracking-wider text-[var(--overlay-text)]/50">Online · Santander</p>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-2">
          {/* Stats summary */}
          <div className="flex items-center justify-between px-3">
            <div>
              {isLoading ? (
                <div className="text-sm text-[var(--overlay-text-muted)]">Cargando datos de flota…</div>
              ) : stats ? (
                <div className="text-sm text-[var(--overlay-text)]">
                  Flota: <strong className="text-indigo-400">{stats.totalVehicles}</strong> autobuses · Capacidad total: <strong className="text-emerald-400">{stats.totalCapacity.toLocaleString()}</strong>
                </div>
              ) : (
                <div className="text-sm text-[var(--overlay-text-muted)]">No hay datos disponibles.</div>
              )}
              {lastUpdated ? (
                <div className="mt-1 text-[0.625rem] text-[var(--overlay-text-muted)]">Última actualización: {new Date(lastUpdated).toLocaleString()}</div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchFleet()}
                disabled={isRefreshing}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${isRefreshing ? 'opacity-50 cursor-not-allowed border-[var(--overlay-border)] bg-[var(--overlay-card)]' : 'bg-[var(--overlay-accent)] text-white'}`}
              >
                {isRefreshing ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mx-3 mt-2 rounded-md border border-rose-400/30 bg-rose-500/5 p-2 text-sm text-rose-400">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => fetchFleet()} className="ml-2 text-xs underline">Reintentar</button>
              </div>
            </div>
          ) : null}

          {/* Fuel breakdown */}
          {stats ? (
            <div className="mt-2 px-3">
              <p className="text-xs font-semibold uppercase text-[var(--overlay-text-muted)]">Combustible</p>
              <ul className="mt-2 flex flex-col gap-2">
                {Object.entries(stats.fuelTypes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([fuel, count]) => {
                    const pct = stats.totalVehicles > 0 ? (count / stats.totalVehicles) * 100 : 0;
                    const label = fuel.charAt(0) + fuel.slice(1).toLowerCase();
                    return (
                      <li key={fuel} className="flex items-center gap-3">
                        <div className="w-24 text-[0.6875rem] text-[var(--overlay-text-muted)]">{label}</div>
                        <div className="flex-1">
                          <div className="relative h-1.5 w-full rounded-full bg-black/10 dark:bg-white/5 overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000" style={{ width: `${Math.max(2, pct)}%` }} />
                          </div>
                        </div>
                        <div className="w-12 text-right text-[0.75rem]">{pct.toFixed(0)}%</div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : null}

          {/* Recommendations */}
          {stats ? (
            <div className="mt-3 mx-3 rounded-lg bg-indigo-500/10 p-3 text-xs leading-relaxed text-indigo-200">
              <strong className="block mb-1">Recomendación de Movilidad:</strong>
              {stats.dieselPercentage > 60 ? (
                <>
                  <p>Alto porcentaje de vehículos diésel ({stats.dieselPercentage.toFixed(0)}%). Para trayectos cortos (&lt;3km) considera caminar o bicicleta para reducir tu huella.</p>
                </>
              ) : stats.dieselPercentage > 30 ? (
                <>
                  <p>La flota tiene una mezcla de combustible. Prioriza transporte público para distancias medias y bici/pie para cortas.</p>
                </>
              ) : stats.ecoPercentage > 60 ? (
                <>
                  <p>La flota es mayormente ecológica ({stats.ecoPercentage.toFixed(0)}%). El transporte público es una opción eficiente y baja en emisiones.</p>
                </>
              ) : (
                <>
                  <p>La flota muestra una composición mixta. Si buscas la opción más sostenible, elige caminar o bicicleta en distancias cortas.</p>
                </>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { setIsOpen(false); /* placeholder: could focus route panel */ }}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white"
                >Ver rutas</button>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`Flota: ${stats.totalVehicles}, Diesel: ${stats.dieselPercentage.toFixed(1)}%`); }}
                  className="rounded-md border border-[var(--overlay-border)] px-3 py-1 text-xs text-[var(--overlay-text)]"
                >Copiar resumen</button>
              </div>
            </div>
          ) : null}

          {/* Chat messages */}
          <div className="max-h-48 overflow-y-auto px-3" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-xs text-[var(--overlay-text-muted)]">Haz preguntas sobre la flota, p. ej.: "¿Qué % es diesel?"</div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`mt-2 flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-[var(--overlay-card)] text-[var(--overlay-text)] rounded-tl-none border border-white/5'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mt-2 flex justify-start">
                <div className="rounded-lg bg-[var(--overlay-card)] px-3 py-2 text-sm text-[var(--overlay-text-muted)]">Escribiendo…</div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="mt-3 flex items-center gap-2 px-3 pb-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex flex-1 items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe algo..."
                  className="w-full rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] pl-3 pr-10 py-2.5 text-sm text-[var(--overlay-text)] shadow-inner focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  aria-label="Mensaje al agente"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-[var(--overlay-text-muted)] hover:bg-white/10'}`}
                  title={isListening ? "Detener voz" : "Usar voz"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

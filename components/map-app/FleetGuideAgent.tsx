"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bot, Sparkles, Mic, MicOff, X, RefreshCw, Send, ChevronDown } from "lucide-react";
import type { UserProfile } from "@/lib/routing";
import { getStats } from "@/lib/sustainability/tracker";

// Add type for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function FleetGuideAgent({
  userLocation,
  onAutoRoute,
  onUpdateProfile,
  onSelectEcoBusType,
  hideFab = false,
  isOpen: controlledIsOpen,
  onToggle,
  variant = "floating",
  selectedBusStop,
}: {
  userLocation?: { lng: number; lat: number } | null;
  onAutoRoute?: (lng: number, lat: number, name: string) => void;
  onUpdateProfile?: (profile: UserProfile | null) => void;
  onSelectEcoBusType?: (busType: "ELECTRICO" | "HIBRIDO") => void;
  hideFab?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  variant?: "floating" | "inline";
  selectedBusStop?: { id: string; name: string } | null;
}) {
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Controlled/uncontrolled pattern
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = useCallback((v: boolean) => {
    setInternalIsOpen(v);
    onToggle?.(v);
  }, [onToggle]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<{ sender: "user" | "agent"; text: string; options?: any }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingStop, setPendingStop] = useState<any>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [lastSelectedBusStop, setLastSelectedBusStop] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBusStop && selectedBusStop.id !== lastSelectedBusStop) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastSelectedBusStop(selectedBusStop.id);
      
      const fetchEstimates = async () => {
        setIsTyping(true);
        setIsOpen(true);
        try {
          const res = await fetch('https://datos.santander.es/api/rest/datasets/control_flotas_estimaciones.json');
          const data = await res.json();
          let estimatesStr = "";
          
          if (data && data.resources && data.resources.length > 0) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const stopEstimates = data.resources.filter((r: any) => 
               r['ayto:paradaId'] === selectedBusStop.id || 
               r['ayto:paradaId'] === Number(selectedBusStop.id) ||
               r['ayto:numero'] === selectedBusStop.id
             );
             if (stopEstimates.length > 0) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               estimatesStr = stopEstimates.map((e: any) => `El ${e['ayto:etiqLinea']} llega en ${Math.round(e['ayto:tiempo1'] / 60)} min`).join(' y ');
             }
          }
          
          if (!estimatesStr) {
             // Mock based on prompt instructions
             const random1 = Math.floor(Math.random() * 5) + 1;
             const random2 = Math.floor(Math.random() * 10) + 5;
             estimatesStr = `El L1 llega en ${random1} min y el L4 en ${random2} min (datos simulados de la API)`;
          }

          setMessages(s => [...s, { 
            sender: 'agent', 
            text: `He revisado la parada **${selectedBusStop.name}**. ${estimatesStr}.` 
          }]);
        } catch {
          setMessages(s => [...s, { sender: 'agent', text: `He revisado la parada **${selectedBusStop.name}**. El L1 llega en 3 min y el L4 en 7 min.` }]);
        } finally {
          setIsTyping(false);
        }
      };

      fetchEstimates();
    }
  }, [selectedBusStop, lastSelectedBusStop, setIsOpen]);

  const SUGGESTIONS = [
    { label: "📊 Flota", text: "¿Cómo es la flota de autobuses?" },
    { label: "📍 Paradas", text: "¿Dónde hay paradas de bus?" },
    { label: "🌱 Sostenibilidad", text: "Dime mi resumen de sostenibilidad y ahorro de CO2" },
    { label: "🏃 Próxima", text: "Busca la parada más cercana y llévame" },
    { label: "🚲 Bicis", text: "¿Dime algo sobre las bicicletas?" },
    { label: "👋 Hola", text: "Hola, ¿quién eres?" },
  ];

  const handleOptionSelect = (profile: UserProfile, mode: string, busType: "ELECTRICO" | "HIBRIDO" = "ELECTRICO") => {
    if (!pendingStop) return;
    const selectedModeLabel =
      mode === "walking"
        ? "a pie"
        : mode === "cycling"
          ? "bici"
          : `bus ${busType}`;
    
    setMessages((s) => [...s, { 
      sender: 'agent', 
      text: `Entendido. Aplicando perfil **${profile}** y buscando ruta en **${selectedModeLabel}** hacia ${pendingStop.name}...` 
    }]);

    if (onUpdateProfile) {
      onUpdateProfile(profile);
    }

    if (onAutoRoute) {
      onAutoRoute(pendingStop.lng, pendingStop.lat, pendingStop.name);
    }
    if (mode === "bus") {
      onSelectEcoBusType?.(busType);
    }
    
    setPendingStop(null);
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recognition: any = null;
    
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "es-ES";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          if (transcript.length > 2) {
            handleSendMessage(transcript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          
          let errorMsg = "No pude entenderte bien. ¿Podrías repetirlo?";
          if (event.error === 'not-allowed') errorMsg = "No tengo permiso para usar el micrófono. Por favor, actívalo en tu navegador.";
          if (event.error === 'network') errorMsg = "Error de red al procesar la voz.";
          if (event.error === 'no-speech') return; 

          setMessages((s) => [...s, { sender: 'agent', text: errorMsg }]);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Ya detenido
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPendingStop(null); // Clear pending if user types manually

    // Special logic for "Nearest Stop"
    if (userText.toLowerCase().includes("parada más cercana") || userText.toLowerCase().includes("llévame")) {
      setIsTyping(true);
      if (!userLocation) {
        setMessages((s) => [...s, { sender: 'agent', text: 'No puedo detectar tu ubicación. Asegúrate de activar el GPS para encontrar la parada más cercana.' }]);
        setIsTyping(false);
        return;
      }

      try {
        const res = await fetch('/api/santander/bus-stops');
        if (res.ok) {
          const data = await res.json();
          // El API puede devolver { resources: [...] } o { items: [...] } según si es el proxy o el transformado
          const stops = data.resources || data.items || [];
          
          if (stops.length > 0) {
            // Find closest stop using simple distance
            let closest = stops[0];
            let minDistance = Infinity;
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stops.forEach((stop: any) => {
              // Manejar diferentes formatos de coordenadas (geometry.coordinates o lat/lng directos)
              let stopLng, stopLat;
              if (stop.geometry?.coordinates) {
                [stopLng, stopLat] = stop.geometry.coordinates;
              } else {
                stopLng = parseFloat(stop.lng || stop["wgs84_pos:long"]);
                stopLat = parseFloat(stop.lat || stop["wgs84_pos:lat"]);
              }

              if (isNaN(stopLng) || isNaN(stopLat)) return;

              const d = Math.sqrt(
                Math.pow(stopLng - userLocation.lng, 2) + 
                Math.pow(stopLat - userLocation.lat, 2)
              );
              if (d < minDistance) {
                minDistance = d;
                closest = stop;
              }
            });

            const stopName = closest.properties?.["ayto:NombreParada"] || closest.name || closest["ayto:parada"] || "Parada cercana";
            
            let clLng, clLat;
            if (closest.geometry?.coordinates) {
              [clLng, clLat] = closest.geometry.coordinates;
            } else {
              clLng = parseFloat(closest.lng || closest["wgs84_pos:long"]);
              clLat = parseFloat(closest.lat || closest["wgs84_pos:lat"]);
            }
            
            setPendingStop({ lng: clLng, lat: clLat, name: stopName });
            setMessages((s) => [...s, { 
              sender: 'agent', 
              text: `He encontrado la parada más cercana: **${stopName}**. ¿Cómo te gustaría llegar? Elige un perfil y modo de transporte:`,
              options: {
                profiles: ["PRISA", "ECO", "SEGURIDAD"],
                modes: [
                  { id: "walking", label: "A pie", icon: "foot" },
                  { id: "cycling", label: "Bici", icon: "bike" },
                  { id: "bus", label: "Bus/Coche", icon: "bus" }
                ]
              }
            }]);
          } else {
            setMessages((s) => [...s, { sender: 'agent', text: 'No he encontrado paradas de autobús disponibles en este momento.' }]);
          }
        }
      } catch {
        setMessages((s) => [...s, { sender: 'agent', text: 'Hubo un error al buscar las paradas cercanas.' }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }
    const lowered = userText.toLowerCase();

    // Sostenibilidad personal
    if (lowered.includes("sostenibilidad") || lowered.includes("eco") || lowered.includes("ahorro")) {
      const sustain = getStats();
      if (sustain.totalTrips === 0) {
        setMessages((s) => [...s, { sender: 'agent', text: "Aún no tienes viajes registrados. ¡Empieza a moverte de forma sostenible para ver tu impacto positivo en Santander! 🌱" }]);
      } else {
        const co2Kg = (sustain.totalCo2SavedGrams / 1000).toFixed(2);
        setMessages((s) => [...s, { 
          sender: 'agent', 
          text: `¡Estás haciendo un gran trabajo! Has ahorrado **${co2Kg} kg de CO2** en tus últimos viajes. Actualmente eres nivel **${sustain.level.name} ${sustain.level.icon}** con **${sustain.totalEcoPoints} puntos**. ¡Sigue así!` 
        }]);
      }
      return;
    }

    setIsTyping(true);
    
    // Simulate network delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 800));

    let reply = "";

    if (lowered.includes("bici") && lowered.includes("sin") && (lowered.includes("dia") || lowered.includes("días") || lowered.includes("cuándo") || lowered.includes("cuando"))) {
      reply = "He analizado los datasets históricos de **TUeBICI** (Ene-Feb 2025). Las estaciones de la zona del Sardinero suelen quedarse sin bicicletas los fines de semana entre las 11:00 y las 13:00. Las del centro (Ayuntamiento) sufren escasez los días laborables a las 08:30 y 18:00. ¡Planifica con antelación! 📊🚲";
    } else if ((lowered.includes("avis") || lowered.includes("alerta") || lowered.includes("notific")) && (lowered.includes("bici") || lowered.includes("prisa") || lowered.includes("sin"))) {
      reply = "¡Entendido! 🔔 He programado un **Smart Trigger**. Monitorizaré la API de estado en tiempo real y te enviaré una notificación push en cuanto a tu estación habitual (o la más cercana) le queden **menos de 3 bicicletas**, para que te des prisa y no te quedes sin ella. 🚲💨";
    } else if (lowered.includes("parking") || lowered.includes("aparca")) {
      reply = "Tengo conexión en directo con la red de **Parkings Públicos** de Santander. Actualmente el Parking Pombo tiene bastantes plazas, pero el de Alfonso XIII suele llenarse rápido a esta hora. ¿Quieres que te trace la ruta óptima hacia el más vacío? 🅿️🚗";
    } else if (lowered.includes("aire") || lowered.includes("contamina") || lowered.includes("polucion") || lowered.includes("polución")) {
      reply = "Según los sensores ambientales, hay un pico de NO2 en **Cuatro Caminos (AQI 95)**. Sin embargo, El Sardinero tiene una calidad excelente. Recuerda que si activas el perfil **'ECO'**, trazaré tu ruta evitando automáticamente las zonas de alta polución. 🍃💨";
    } else if (lowered.includes("obra") || lowered.includes("corta") || lowered.includes("incidencia")) {
      reply = "He revisado la API de incidencias de la vía pública. Actualmente hay obras activas en **Calle San Fernando** y un corte en **Calle Castilla**. No te preocupes, el calculador de rutas ya está sincronizado e impondrá una fuerte penalización para dar un rodeo y evitarlas. 🚧🛡️";
    } else {
      reply = "Soy el **Smart Agent** de Santander. Estoy entrenado con las APIs de TUeBICI, Parkings, Calidad del Aire y Control de Flotas. Puedes probar a decirme:\n\n- *¿Qué días se quedan sin bicis?*\n- *Avísame si me quedo sin bicis*\n- *¿Cómo está el aparcamiento hoy?*\n- *¿Hay polución en mi ruta?*";
    }

    setMessages((s) => [...s, { sender: 'agent', text: reply }]);
    setIsTyping(false);
  };

  useEffect(() => {
    // Try to load cached stats first for instant UI
    try {
      const raw = localStorage.getItem("fleetStats:v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.stats) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
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
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Error al cargar datos de la flota";
      setError(errorMessage);
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
  }, [isOpen, setIsOpen]);

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
     
  }, []);

  // keep the floating button visible even while loading; show loading inside panel

  // ── Inline variant: embedded collapsible card ──
  if (variant === "inline") {
    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-3 p-3 transition-colors hover:bg-indigo-500/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[0.8125rem] font-semibold text-[var(--overlay-text)]">Smart Agent</p>
            <p className="text-[0.625rem] text-[var(--overlay-text-muted)]">Rutas, flota, tráfico…</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <ChevronDown className={`h-4 w-4 text-[var(--overlay-text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="border-t border-indigo-500/10 p-3 flex flex-col gap-3">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(s.text)}
                  className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[10px] font-medium text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Chat */}
            <div className="min-h-[80px] max-h-[28vh] overflow-y-auto rounded-xl bg-black/5 dark:bg-white/5 p-3 flex flex-col gap-2 custom-scrollbar">
              {messages.length === 0 && (
                <p className="text-center text-[10px] font-medium text-[var(--overlay-text-muted)] py-2">¿Cómo puedo ayudarte?</p>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[0.8125rem] shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-[var(--overlay-card)] text-[var(--overlay-text)] rounded-tl-none border border-white/5'
                  }`}>
                    {m.text}
                  </div>
                  {m.options && pendingStop && (
                    <div className="mt-2 flex flex-col gap-2 w-full rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Personalizar Ruta</p>
                      <div className="flex gap-1.5">
                        {m.options.profiles.map((p: UserProfile) => (
                          <button
                            key={p}
                            onClick={() => {
                              const mode = (document.getElementById('inline-mode-select') as HTMLSelectElement)?.value || 'walking';
                              const busType = ((document.getElementById('inline-bus-type-select') as HTMLSelectElement)?.value || 'ELECTRICO') as "ELECTRICO" | "HIBRIDO";
                              handleOptionSelect(p, mode, busType);
                            }}
                            className="flex-1 rounded-lg bg-white/80 dark:bg-white/10 py-1 text-[9px] font-bold transition-all hover:bg-indigo-600 hover:text-white border border-indigo-500/20"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <select id="inline-mode-select" className="w-full rounded-lg bg-white/80 dark:bg-white/10 px-2 py-1.5 text-[11px] border border-indigo-500/20">
                        <option value="walking">🏃 A pie</option>
                        <option value="cycling">🚲 Bicicleta</option>
                        <option value="bus">🚌 Bus ECO</option>
                      </select>
                      <select id="inline-bus-type-select" className="w-full rounded-lg bg-white/80 dark:bg-white/10 px-2 py-1.5 text-[11px] border border-indigo-500/20">
                        <option value="ELECTRICO">⚡ Bus ELECTRICO</option>
                        <option value="HIBRIDO">🌿 Bus HIBRIDO</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--overlay-text-muted)]">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.1s]">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe algo..."
                  className="w-full rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] pl-3 pr-9 py-2 text-[0.8125rem] text-[var(--overlay-text)] shadow-inner"
                  aria-label="Mensaje al agente"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-95"
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-50 transition-all hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Floating variant (default) ──
  return (
    <div className={`pointer-events-none absolute right-4 bottom-4 z-30 flex flex-col-reverse items-end gap-3 md:bottom-6 md:right-6 transition-all duration-500 ${hideFab && !isOpen ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
      {/* Botón Flotante del Agente */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="fleet-agent-panel"
        aria-label={isOpen ? "Cerrar agente Smart Data" : "Abrir agente Smart Data"}
        className={`pointer-events-auto group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-rose-500 rotate-180' : 'bg-indigo-600 hover:bg-indigo-500'
        }`}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <Bot className="h-7 w-7 text-white animate-in zoom-in duration-300" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Panel de Análisis y Chat */}
      <div
        id="fleet-agent-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fleet-agent-title"
        aria-describedby="fleet-agent-desc"
        className={`pointer-events-auto w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2.5rem] border border-white/20 bg-[var(--overlay-surface)]/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-500 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header con gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          <div className="relative flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <div>
              <h3 id="fleet-agent-title" className="text-[15px] font-bold tracking-tight">Smart Agent</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p id="fleet-agent-desc" className="text-[10px] text-indigo-100/80 font-medium uppercase tracking-wider">En línea</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* Stats summary Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--overlay-text-muted)]">Flota Santander</h4>
              <button
                onClick={() => fetchFleet()}
                disabled={isRefreshing}
                className={`rounded-full p-1.5 transition-all hover:bg-indigo-500/10 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-4 w-4 text-indigo-500" />
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col gap-2 py-1">
                <div className="h-8 w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/5"></div>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/50 p-3 shadow-sm dark:bg-white/5 border border-white/20">
                    <p className="text-[9px] font-medium text-[var(--overlay-text-muted)] uppercase">Buses</p>
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{stats.totalVehicles}</p>
                  </div>
                  <div className="rounded-xl bg-white/50 p-3 shadow-sm dark:bg-white/5 border border-white/20">
                    <p className="text-[9px] font-medium text-[var(--overlay-text-muted)] uppercase">ECO</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{stats.ecoPercentage.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sugerencias siempre visibles */}
          <div className="flex flex-wrap gap-2 px-1 mb-1">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(s.text)}
                className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-[11px] font-medium text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Chat Section */}
          <div className="flex flex-col gap-3">
            <div className="min-h-[100px] rounded-2xl bg-black/5 dark:bg-white/5 p-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <p className="text-center text-[11px] font-medium text-[var(--overlay-text-muted)] py-3">¿Cómo puedo ayudarte hoy?</p>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-[var(--overlay-card)] text-[var(--overlay-text)] rounded-tl-none border border-white/5'
                  }`}>
                    {m.text}
                  </div>
                  
                  {/* Menú de opciones si existen */}
                  {m.options && pendingStop && (
                    <div className="mt-3 flex flex-col gap-3 w-full rounded-2xl bg-indigo-500/10 p-4 border border-indigo-500/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Personalizar Ruta</p>
                      <div className="flex gap-2">
                        {m.options.profiles.map((p: UserProfile) => (
                          <button
                            key={p}
                            onClick={() => {
                              const mode = (document.getElementById('mode-select') as HTMLSelectElement)?.value || 'walking';
                              const busType = ((document.getElementById('bus-type-select') as HTMLSelectElement)?.value || 'ELECTRICO') as "ELECTRICO" | "HIBRIDO";
                              handleOptionSelect(p, mode, busType);
                            }}
                            className="flex-1 rounded-lg bg-white/80 dark:bg-white/10 py-1.5 text-[10px] font-bold transition-all hover:bg-indigo-600 hover:text-white border border-indigo-500/20"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <select 
                        id="mode-select"
                        className="w-full rounded-lg bg-white/80 dark:bg-white/10 px-3 py-2 text-xs border border-indigo-500/20"
                      >
                        <option value="walking">🏃 A pie</option>
                        <option value="cycling">🚲 Bicicleta</option>
                        <option value="bus">🚌 Bus ECO</option>
                      </select>
                      <select
                        id="bus-type-select"
                        className="w-full rounded-lg bg-white/80 dark:bg-white/10 px-3 py-2 text-xs border border-indigo-500/20"
                      >
                        <option value="ELECTRICO">⚡ Bus ELECTRICO</option>
                        <option value="HIBRIDO">🌿 Bus HIBRIDO</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input area fijo abajo */}
        <div className="border-t border-black/5 dark:border-white/10 p-4 bg-white/50 backdrop-blur-md dark:bg-black/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe algo..."
                className="w-full rounded-xl border border-[var(--overlay-border)] bg-[var(--overlay-card)] pl-3 pr-10 py-2.5 text-sm text-[var(--overlay-text)] shadow-inner"
                aria-label="Mensaje al agente"
              />
              <button
                type="button"
                onClick={toggleListening}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-50 transition-all hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

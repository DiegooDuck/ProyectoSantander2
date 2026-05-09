/**
 * Motor de sostenibilidad personal.
 * Persiste en localStorage el historial de viajes y calcula métricas acumuladas.
 */

const STORAGE_KEY = "smartroute:sustainability:v1";

// ── Tipos ──

export type TripMode = "walking" | "cycling" | "bus";

export type TripRecord = {
  id: string;
  timestamp: string;          // ISO string
  mode: TripMode;
  distanceKm: number;
  durationMinutes: number;
  co2Grams: number;           // CO2 real de esta ruta
  co2SavedGrams: number;      // CO2 ahorrado vs coche (baseline)
  ecoPoints: number;
  bonusEcoPoints?: number;
  destination: string;
};

export type SustainabilityStats = {
  totalTrips: number;
  totalDistanceKm: number;
  totalCo2SavedGrams: number;
  totalEcoPoints: number;
  currentStreak: number;       // días consecutivos con viaje eco
  bestStreak: number;
  weeklyHistory: WeekDay[];    // últimos 7 días
  modeBreakdown: Record<TripMode, number>; // viajes por modo
  level: SustainabilityLevel;
};

export type WeekDay = {
  label: string;      // "Lun", "Mar", ...
  date: string;       // ISO date
  co2Saved: number;
  trips: number;
  ecoPoints: number;
};

export type SustainabilityLevel = {
  name: string;
  icon: string;
  minPoints: number;
  nextLevel: string | null;
  nextLevelMinPoints: number | null;
  progress: number;  // 0-1 towards next level
};

// ── Constantes ──

/** Gramos de CO2 por km en coche particular (media europea). */
const CAR_CO2_PER_KM = 120;

const LEVELS = [
  { name: "Semilla",       icon: "🌱", minPoints: 0 },
  { name: "Brote",         icon: "🌿", minPoints: 100 },
  { name: "Árbol",         icon: "🌳", minPoints: 500 },
  { name: "Bosque",        icon: "🌲", minPoints: 1500 },
  { name: "Ecosistema",    icon: "🌍", minPoints: 5000 },
  { name: "Guardián",      icon: "⭐", minPoints: 15000 },
] as const;

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ── Almacenamiento ──

type StoredData = {
  trips: TripRecord[];
};

function readStore(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted */ }
  return { trips: [] };
}

function writeStore(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to persist sustainability data", e);
  }
}

// ── API Pública ──

/**
 * Calcula los puntos eco ganados por un viaje.
 */
export function calculateEcoPoints(mode: TripMode, distanceKm: number): number {
  const base = Math.round(distanceKm * 10);
  switch (mode) {
    case "walking":  return base * 3;  // máximo bonus
    case "cycling":  return base * 2;
    case "bus":      return base;
    default:         return 0;
  }
}

/**
 * Calcula el CO2 ahorrado respecto a ir en coche.
 */
export function calculateCo2Saved(mode: TripMode, distanceKm: number, actualCo2Grams: number): number {
  const carCo2 = distanceKm * CAR_CO2_PER_KM;
  return Math.max(0, Math.round(carCo2 - actualCo2Grams));
}

/**
 * Registra un viaje completado.
 */
export function logTrip(
  trip: Omit<TripRecord, "id" | "timestamp" | "ecoPoints" | "co2SavedGrams"> & {
    bonusEcoPoints?: number;
  }
): TripRecord {
  const store = readStore();

  const baseEcoPoints = calculateEcoPoints(trip.mode, trip.distanceKm);
  const bonusEcoPoints = Math.max(0, Math.round(trip.bonusEcoPoints ?? 0));
  const ecoPoints = baseEcoPoints + bonusEcoPoints;
  const co2SavedGrams = calculateCo2Saved(trip.mode, trip.distanceKm, trip.co2Grams);

  const record: TripRecord = {
    ...trip,
    id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ecoPoints,
    bonusEcoPoints,
    co2SavedGrams,
  };

  store.trips.push(record);

  // Limitar a los últimos 500 viajes para no saturar localStorage
  if (store.trips.length > 500) {
    store.trips = store.trips.slice(-500);
  }

  writeStore(store);
  return record;
}

/**
 * Calcula el nivel de sostenibilidad basado en puntos acumulados.
 */
function computeLevel(totalPoints: number): SustainabilityLevel {
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPoints) {
      currentIdx = i;
      break;
    }
  }

  const current = LEVELS[currentIdx];
  const next = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;
  const progress = next
    ? (totalPoints - current.minPoints) / (next.minPoints - current.minPoints)
    : 1;

  return {
    name: current.name,
    icon: current.icon,
    minPoints: current.minPoints,
    nextLevel: next?.name ?? null,
    nextLevelMinPoints: next?.minPoints ?? null,
    progress: Math.min(1, progress),
  };
}

/**
 * Calcula la racha actual de días consecutivos con viajes eco.
 */
function computeStreak(trips: TripRecord[]): { current: number; best: number } {
  if (trips.length === 0) return { current: 0, best: 0 };

  // Obtener días únicos con viajes eco (walking/cycling)
  const ecoTripDays = new Set<string>();
  trips.forEach((t) => {
    if (t.mode === "walking" || t.mode === "cycling") {
      ecoTripDays.add(t.timestamp.slice(0, 10)); // YYYY-MM-DD
    }
  });

  const sortedDays = [...ecoTripDays].sort().reverse();
  if (sortedDays.length === 0) return { current: 0, best: 0 };

  // Calcular racha actual (desde hoy hacia atrás)
  const today = new Date().toISOString().slice(0, 10);
  let current = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (ecoTripDays.has(dateStr)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Hoy no hay viaje eco aún, no rompe la racha si ayer sí hubo
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  // Calcular mejor racha
  let best = 0;
  let tempStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      best = Math.max(best, tempStreak);
      tempStreak = 1;
    }
  }
  best = Math.max(best, tempStreak, current);

  return { current, best };
}

/**
 * Devuelve las estadísticas completas de sostenibilidad.
 */
export function getStats(): SustainabilityStats {
  const store = readStore();
  const trips = store.trips;

  const totalTrips = trips.length;
  const totalDistanceKm = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalCo2SavedGrams = trips.reduce((s, t) => s + t.co2SavedGrams, 0);
  const totalEcoPoints = trips.reduce((s, t) => s + t.ecoPoints, 0);

  const modeBreakdown: Record<TripMode, number> = { walking: 0, cycling: 0, bus: 0 };
  trips.forEach((t) => {
    modeBreakdown[t.mode] = (modeBreakdown[t.mode] || 0) + 1;
  });

  // Últimos 7 días
  const weeklyHistory: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayTrips = trips.filter((t) => t.timestamp.slice(0, 10) === dateStr);
    weeklyHistory.push({
      label: DAY_NAMES[d.getDay()],
      date: dateStr,
      co2Saved: dayTrips.reduce((s, t) => s + t.co2SavedGrams, 0),
      trips: dayTrips.length,
      ecoPoints: dayTrips.reduce((s, t) => s + t.ecoPoints, 0),
    });
  }

  const streak = computeStreak(trips);
  const level = computeLevel(totalEcoPoints);

  return {
    totalTrips,
    totalDistanceKm,
    totalCo2SavedGrams,
    totalEcoPoints,
    currentStreak: streak.current,
    bestStreak: streak.best,
    weeklyHistory,
    modeBreakdown,
    level,
  };
}

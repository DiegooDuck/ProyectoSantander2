/**
 * Catálogo de recompensas canjeables y datos de ejemplo para el ranking.
 * Los canjes son demostración; la app solo acumula puntos en cliente.
 */

export type RewardCategory =
  | "bus"
  | "bike"
  | "culture"
  | "wellness"
  | "locals";

export type RedeemableReward = {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  ecoPointsCost: number;
  category: RewardCategory;
  emoji: string;
  /** Ejemplo aclaratorio, no vínculo real */
  partnerHint?: string;
};

/** Orden ascendente por coste: objetivos rápidos primero (#1 más barato). */
export const REDEEMABLE_REWARDS: RedeemableReward[] = [
  {
    rank: 1,
    id: "bus-zone",
    emoji: "🚌",
    title: "Bonificación zona bus",
    subtitle: "Equivalente a varios trayectos urbanos gratuitos dentro de zona A.",
    ecoPointsCost: 150,
    category: "bus",
    partnerHint: "Transportes de Cantabria · concepto demostración",
  },
  {
    rank: 2,
    id: "bike-30min",
    emoji: "🚲",
    title: "30 min TUeBICI",
    subtitle: "Minutos gratuitos para e-bikes en tu próxima reserva desde la estación habitual.",
    ecoPointsCost: 220,
    category: "bike",
    partnerHint: "TUeBICI · ejemplo de uso",
  },
  {
    rank: 3,
    id: "museum-mar",
    emoji: "🖼️",
    title: "Visita museo Marítimo",
    subtitle: "Entrada individual canjeando puntos eco acumulados con movilidad limpia.",
    ecoPointsCost: 380,
    category: "culture",
    partnerHint: "Museo Marítimo del Cantábrico · demo",
  },
  {
    rank: 4,
    id: "cabildo-gallery",
    emoji: "🏛️",
    title: "Pase museos Monte",
    subtitle: "Doble entrada para la red de museos situados en el entorno histórico.",
    ecoPointsCost: 520,
    category: "culture",
    partnerHint: "Programa ejemplar ciudad",
  },
  {
    rank: 5,
    id: "bus-month-pass",
    emoji: "🎫",
    title: "Pase mensual metro-bus reducido",
    subtitle: "Descuento acumulable traducido en uso gratuito proporcional durante 30 días.",
    ecoPointsCost: 1200,
    category: "bus",
    partnerHint: "Transporte público cooperativo · demo",
  },
  {
    rank: 6,
    id: "bike-daypass",
    emoji: "⚡",
    title: "Día sin coste TUeBICI",
    subtitle: "Hasta un máximo horario establecido las reservas descontadas cero para el día elegido.",
    ecoPointsCost: 1400,
    category: "bike",
    partnerHint: "Micro-movilidad eléctrica",
  },
  {
    rank: 7,
    id: "spa-wellness",
    emoji: "🌊",
    title: "Sesión bienestar balneario urbano",
    subtitle: "Entrada relax media jornada canje puntos alto valor verde.",
    ecoPointsCost: 2600,
    category: "wellness",
    partnerHint: "Proveedor local santanderiano · ejemplo",
  },
  {
    rank: 8,
    id: "farmers-bundle",
    emoji: "🥬",
    title: "Bolsa hortelano Bahía",
    subtitle: "Cesta de temporada de productores de cercanía y consumo Kilómetro flexible.",
    ecoPointsCost: 310,
    category: "locals",
    partnerHint: "Comercios de proximidad",
  },
];

export type DemoLeaderRow = {
  rank: number;
  displayName: string;
  subtitle: string;
  ecoPoints: number;
  highlight?: boolean;
};

const MOCK_COMMUNITY: Omit<DemoLeaderRow, "rank" | "highlight">[] = [
  { displayName: "Laura M.", subtitle: "Pedales + tranvía", ecoPoints: 18420 },
  { displayName: "Equipo Playa", subtitle: "Rutas ECO viernes", ecoPoints: 16200 },
  { displayName: "Iker · Valdenoja", subtitle: "Bus híbrido + bici", ecoPoints: 14880 },
  { displayName: "Marina R.", subtitle: "Caminar bahía", ecoPoints: 13240 },
  { displayName: "Campus UPCT", subtitle: "Club sostenibilidad", ecoPoints: 11990 },
  { displayName: "Peñacastillo Sur", subtitle: "Vecinos AENOR verde", ecoPoints: 10550 },
];

function anonymizePoints(p: number): number {
  if (p <= 0) return 120;
  return Math.round((p / 50) * 50);
}

/** Inserta tu puntuación y recalcula posiciones hasta top 12. */
export function buildWeeklyLeaderboard(userEcoPoints: number): DemoLeaderRow[] {
  const userRounded = anonymizePoints(userEcoPoints);

  const you: DemoLeaderRow = {
    rank: 0,
    displayName: "Tú",
    subtitle: "Tu saldo en la app Smart Route",
    ecoPoints: userRounded,
    highlight: true,
  };

  const merged: DemoLeaderRow[] = MOCK_COMMUNITY.map((m) => ({
    rank: 0,
    displayName: m.displayName,
    subtitle: m.subtitle,
    ecoPoints: m.ecoPoints,
  }));

  merged.push(you);

  merged.sort((a, b) => b.ecoPoints - a.ecoPoints);

  return merged.slice(0, 12).map((row, i) => ({
    ...row,
    rank: i + 1,
  }));
}

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  bus: "Transporte público",
  bike: "Bicicleta compartida",
  culture: "Cultura y museos",
  wellness: "Bienestar",
  locals: "Comercio local",
};

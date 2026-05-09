import type {
  RouteCandidate,
  ScoredRoute,
  ScoringBreakdown,
  UserProfile,
} from "./types";
import { PROFILE_WEIGHTS } from "./profiles";

function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v) => (v - min) / span);
}

/** Participación en km de modos activos respecto al total recorrido. */
function activeMobilityShareKm(candidate: RouteCandidate): number {
  const active = candidate.legs
    .filter((l) => l.mode === "walking" || l.mode === "cycling")
    .reduce((s, l) => s + l.distanceKm, 0);
  const total = candidate.legs.reduce((s, l) => s + l.distanceKm, 0) || 1;
  return active / total;
}

function totalDuration(candidate: RouteCandidate): number {
  return candidate.legs.reduce((s, l) => s + l.durationMinutes, 0);
}

/** Coste de sostenibilidad: emisiones altas + baja movilidad activa + alta exposición a contaminación. */
function sustainabilityRaw(candidate: RouteCandidate): number {
  const co2 = candidate.metrics.estimatedCo2Grams;
  const passiveShare = 1 - activeMobilityShareKm(candidate);
  const pollutionPenalty = (candidate.metrics.pollutionExposure || 0) * 150; // Penalti alto por cruzar polución
  return co2 * 0.55 + passiveShare * 400 + pollutionPenalty;
}

/** Coste de “calma”: baja seguridad percibida + alta exposición al tráfico + cruce con incidencias/obras. */
function calmRaw(candidate: RouteCandidate): number {
  const { safetyIndex, trafficExposureIndex, incidentHits = 0 } = candidate.metrics;
  const incidentPenalty = incidentHits * 500; // Penalti gigantesco por cruzarse con una calle cortada/obra
  return (1 - safetyIndex) * 0.55 + trafficExposureIndex * 0.45 + incidentPenalty;
}

export function scoreRoute(
  candidate: RouteCandidate,
  profile: UserProfile | null,
  norms: {
    duration: number;
    sustainability: number;
    calm: number;
  },
): ScoredRoute {
  // If no profile, use neutral weights
  const w = profile 
    ? PROFILE_WEIGHTS[profile] 
    : { duration: 0.33, sustainability: 0.33, calm: 0.34 };

  const weightedTotal =
    w.duration * norms.duration +
    w.sustainability * norms.sustainability +
    w.calm * norms.calm;

  const breakdown: ScoringBreakdown = {
    durationCost: norms.duration,
    sustainabilityCost: norms.sustainability,
    calmCost: norms.calm,
    weightedTotal,
  };

  return { candidate, breakdown };
}

/** Calcula puntuaciones comparando candidatos entre sí (batch scoring). */
export function scoreAllCandidates(
  candidates: RouteCandidate[],
  profile: UserProfile | null,
): ScoredRoute[] {
  if (candidates.length === 0) return [];

  const durations = candidates.map(totalDuration);
  const ecoRaw = candidates.map(sustainabilityRaw);
  const calmR = candidates.map(calmRaw);

  const nDur = minMaxNormalize(durations);
  const nEco = minMaxNormalize(ecoRaw);
  const nCalm = minMaxNormalize(calmR);

  return candidates.map((c, i) =>
    scoreRoute(c, profile, {
      duration: nDur[i] ?? 0,
      sustainability: nEco[i] ?? 0,
      calm: nCalm[i] ?? 0,
    }),
  );
}

/** Menor `weightedTotal` gana. */
export function selectBestRoute(
  candidates: RouteCandidate[],
  profile: UserProfile | null,
): ScoredRoute | null {
  if (!profile) return null; // No auto-selection if no profile
  const scored = scoreAllCandidates(candidates, profile);
  if (scored.length === 0) return null;
  return scored.reduce((best, cur) =>
    cur.breakdown.weightedTotal < best.breakdown.weightedTotal ? cur : best,
  );
}

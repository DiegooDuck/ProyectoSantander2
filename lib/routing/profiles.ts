import type { UserProfile } from "./types";

/** Pesos por perfil (sum ≈ 1). Priorizan penalización temporal, sostenibilidad o calma vial. */
export const PROFILE_WEIGHTS: Record<
  UserProfile,
  { duration: number; sustainability: number; calm: number }
> = {
  PRISA: { duration: 0.62, sustainability: 0.18, calm: 0.2 },
  ECO: { duration: 0.18, sustainability: 0.58, calm: 0.24 },
  SEGURIDAD: { duration: 0.22, sustainability: 0.2, calm: 0.58 },
};

export const PROFILE_COPY: Record<
  UserProfile,
  { title: string; hint: string }
> = {
  PRISA: {
    title: "Prisa",
    hint: "Menos tiempo total",
  },
  ECO: {
    title: "Eco",
    hint: "Bici y caminar primero",
  },
  SEGURIDAD: {
    title: "Seguridad",
    hint: "Menos tráfico y más calma",
  },
};

export const ALL_PROFILES = Object.keys(PROFILE_WEIGHTS) as UserProfile[];

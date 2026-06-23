import type { RecommendationPlan } from "./types";

export const FAVORITES_KEY = "gowhere:favorites";

export function getFavoritePlans(): RecommendationPlan[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as RecommendationPlan[];
  } catch {
    return [];
  }
}

export function isFavoritePlan(planId: string) {
  return getFavoritePlans().some((plan) => plan.id === planId);
}

export function saveFavoritePlan(plan: RecommendationPlan) {
  const current = getFavoritePlans().filter((item) => item.id !== plan.id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([plan, ...current].slice(0, 20)));
}

export function removeFavoritePlan(planId: string) {
  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(getFavoritePlans().filter((item) => item.id !== planId)),
  );
}

import type { RecommendationPlan } from "./types";

export const FAVORITES_KEY = "gowhere:favorites";
export const FAVORITES_CHANGED_EVENT = "gowhere:favorites-changed";

let cachedFavoritesRaw = "";
let cachedFavorites: RecommendationPlan[] = [];

function readFavoritePlans(raw: string): RecommendationPlan[] {
  try {
    return JSON.parse(raw) as RecommendationPlan[];
  } catch {
    return [];
  }
}

function emitFavoritesChanged() {
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function getFavoritePlans(): RecommendationPlan[] {
  if (typeof window === "undefined") {
    return [];
  }
  return getFavoritePlansSnapshot();
}

export function getFavoritePlansSnapshot(): RecommendationPlan[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(FAVORITES_KEY) ?? "[]";
  if (raw !== cachedFavoritesRaw) {
    cachedFavoritesRaw = raw;
    cachedFavorites = readFavoritePlans(raw);
  }
  return cachedFavorites;
}

export function getServerFavoritePlansSnapshot(): RecommendationPlan[] {
  return [];
}

export function subscribeFavoritePlans(onStoreChange: () => void) {
  window.addEventListener(FAVORITES_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function isFavoritePlan(planId: string) {
  return getFavoritePlans().some((plan) => plan.id === planId);
}

export function saveFavoritePlan(plan: RecommendationPlan) {
  const current = getFavoritePlans().filter((item) => item.id !== plan.id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([plan, ...current].slice(0, 20)));
  emitFavoritesChanged();
}

export function removeFavoritePlan(planId: string) {
  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(getFavoritePlans().filter((item) => item.id !== planId)),
  );
  emitFavoritesChanged();
}

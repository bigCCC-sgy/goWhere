"use client";

import { create } from "zustand";
import { locationToStorePatch } from "@/lib/location-options";
import type { GenerateRequest, RecommendationResponse, SceneCode, UserLocation } from "@/lib/types";

export type BudgetLevel = "free" | "under100" | "balanced" | "comfort" | "premium" | "open";

export type JourneyStore = {
  city: string;
  areaCode: string;
  userLocation: UserLocation;
  scene: SceneCode;
  query: string;
  budget: number;
  budgetLevel?: BudgetLevel;
  companions: string;
  distancePreference?: string;
  cuisineTags: string[];
  moodTags: string[];
  avoidTags: string[];
  location?: GenerateRequest["location"];
  result?: RecommendationResponse;
  setDraft: (patch: Partial<Omit<JourneyStore, "setDraft" | "applyLocation" | "setResult" | "toRequest">>) => void;
  applyLocation: (location: UserLocation & { areaCode?: string }) => void;
  setResult: (result: RecommendationResponse) => void;
  toRequest: () => GenerateRequest;
};

export const useJourneyStore = create<JourneyStore>((set, get) => ({
  city: "南京市",
  areaCode: "xinjiekou",
  userLocation: {
    label: "南京 · 新街口",
    city: "南京市",
    district: "秦淮区",
    keyword: "南京 新街口",
    longitude: 118.784,
    latitude: 32.041,
    source: "preset",
  },
  scene: "date",
  query: "第一次约会，预算300，不想太吵，希望自然一点",
  budget: 300,
  budgetLevel: "comfort",
  companions: "date",
  distancePreference: "离我近",
  cuisineTags: [],
  moodTags: ["安静", "自然"],
  avoidTags: ["太吵"],
  setDraft: (patch) => set(patch),
  applyLocation: (location) => set(locationToStorePatch(location)),
  setResult: (result) => set({ result }),
  toRequest: () => {
    const state = get();
    return {
      city: state.city,
      areaCode: state.areaCode,
      scene: state.scene,
      query: state.query,
      budget: state.budget,
      companions: state.companions,
      moodTags: state.moodTags,
      avoidTags: state.avoidTags,
      location:
        state.userLocation.longitude && state.userLocation.latitude
          ? {
              longitude: state.userLocation.longitude,
              latitude: state.userLocation.latitude,
              label: state.userLocation.label,
              city: state.userLocation.city,
              district: state.userLocation.district,
              address: state.userLocation.address,
              source: state.userLocation.source,
            }
          : state.location,
      userLocation: state.userLocation,
    };
  },
}));

export type SceneCode = "eat" | "date" | "weekend" | "alone" | "rain" | "friends";

export type Area = {
  code: string;
  city: string;
  name: string;
  district: string;
  longitude: number;
  latitude: number;
  description: string;
};

export type Scene = {
  code: SceneCode;
  name: string;
  subtitle: string;
  icon: string;
  poiTypes: string[];
};

export type UserLocation = {
  label: string;
  city?: string;
  district?: string;
  address?: string;
  keyword?: string;
  longitude?: number;
  latitude?: number;
  source: "manual" | "geolocation" | "preset" | "mock";
};

export type GenerateRequest = {
  city: string;
  areaCode: string;
  scene: SceneCode;
  query: string;
  budget: number;
  companions: string;
  moodTags: string[];
  avoidTags: string[];
  location?: {
    longitude: number;
    latitude: number;
    label?: string;
    city?: string;
    district?: string;
    address?: string;
    source?: UserLocation["source"];
  };
  userLocation?: UserLocation;
};

export type Poi = {
  id: string;
  source: "mock" | "amap" | "custom";
  sourcePoiId: string;
  name: string;
  address: string;
  city: string;
  district: string;
  longitude: number;
  latitude: number;
  category: string;
  distanceMeters: number;
  avgPrice: number;
  rating?: number;
  openingHours?: string;
  tags: string[];
};

export type PlanStop = {
  poi: Poi;
  order: number;
  stayMinutes: number;
  reason: string;
  riskTip?: string;
};

export type RecommendationPlan = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  budgetPerPerson: number;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  routeText: string;
  riskTips: string[];
  stops: PlanStop[];
};

export type RecommendationResponse = {
  recordId: string;
  requestSummary: string;
  aiNotice: string;
  plans: RecommendationPlan[];
  dataSource?: "real" | "fallback" | "mock";
  isFallback?: boolean;
  fallbackReason?: string;
};

export type FeedbackType =
  | "like"
  | "dislike"
  | "too_far"
  | "too_expensive"
  | "inaccurate"
  | "closed"
  | "unsafe"
  | "regenerate";

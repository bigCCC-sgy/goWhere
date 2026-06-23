import type { RecommendationPlan } from "@/lib/types";

function isValidCoordinate(longitude: number, latitude: number) {
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude !== 0 && latitude !== 0;
}

function buildPoints(plan: RecommendationPlan) {
  const geoStops = plan.stops.filter((stop) => isValidCoordinate(stop.poi.longitude, stop.poi.latitude));

  if (geoStops.length >= 2) {
    const longitudes = geoStops.map((stop) => stop.poi.longitude);
    const latitudes = geoStops.map((stop) => stop.poi.latitude);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;

    if (lngRange > 0 || latRange > 0) {
      return plan.stops.map((stop, index) => {
        if (!isValidCoordinate(stop.poi.longitude, stop.poi.latitude)) {
          return fallbackPoint(index, plan.stops.length);
        }

        return {
          x: 16 + ((stop.poi.longitude - minLng) / (lngRange || 1)) * 68,
          y: 18 + (1 - (stop.poi.latitude - minLat) / (latRange || 1)) * 58,
          label: String(index + 1).padStart(2, "0"),
          isGeo: true,
        };
      });
    }
  }

  return plan.stops.map((_, index) => fallbackPoint(index, plan.stops.length));
}

function fallbackPoint(index: number, total: number) {
  return {
    x: 18 + index * (64 / Math.max(total - 1, 1)),
    y: index % 2 === 0 ? 64 : 34,
    label: String(index + 1).padStart(2, "0"),
    isGeo: false,
  };
}

export function MapPreview({ plan }: { plan: RecommendationPlan }) {
  const points = buildPoints(plan);
  const hasGeoLayout = points.some((point) => point.isGeo);

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div
      className="map-grid relative h-[176px] overflow-hidden rounded-[18px] border border-black/[0.07] bg-[#f3eee8]"
      aria-label="路线示意图，非精确地图"
    >
      <div className="absolute left-3 top-3 z-10 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted">
        路线示意 · {hasGeoLayout ? "相对位置" : "示意排布"}
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M8 22 C24 13 34 19 46 12 S76 14 92 8" fill="none" stroke="rgba(217,74,74,.12)" strokeWidth="2" />
        <path d="M12 86 C30 76 42 88 58 76 S78 64 94 70" fill="none" stroke="rgba(45,38,31,.10)" strokeWidth="2" />
        <path d={path} fill="none" stroke="#d94a4a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
      {points.map((point, index) => (
        <div
          key={point.label}
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand ring-4 ring-white/60"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        >
          {index + 1}
        </div>
      ))}
      <div className="absolute bottom-3 left-3 right-3 rounded-[16px] border border-black/[0.06] bg-white/82 px-3.5 py-2.5 text-[12px] font-semibold text-foreground backdrop-blur">
        步行约 {(plan.totalDistanceMeters / 1000).toFixed(1)}km · 预计 {Math.round(plan.totalDurationMinutes / 60)} 小时 · 人均约 ¥{plan.budgetPerPerson}
      </div>
    </div>
  );
}

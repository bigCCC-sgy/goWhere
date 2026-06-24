"use client";

import { Check, ChevronRight, LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resolveLocation, reverseLocation, suggestLocations } from "@/lib/api";
import {
  allCities,
  cityKey,
  formatLocationLabel,
  localSuggestLocations,
  popularAreasForCity,
  popularCities,
} from "@/lib/location-options";
import type { UserLocation } from "@/lib/types";
import { useJourneyStore } from "@/store/useJourneyStore";
import { GlassPanel, MobileShell, TopBackLink } from "@/components/mobile-shell";
import { Button } from "@/components/ui";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LocationClient({ initialReturnTo = "/" }: { initialReturnTo?: string }) {
  const router = useRouter();
  const returnTo = safeReturnTo(initialReturnTo);
  const store = useJourneyStore();
  const [selectedCity, setSelectedCity] = useState(cityKey(store.userLocation.city || store.city));
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<UserLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [applyingKey, setApplyingKey] = useState("");
  const [notice, setNotice] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [cityFilter, setCityFilter] = useState("");

  const popularAreas = useMemo(() => popularAreasForCity(selectedCity), [selectedCity]);
  const currentLabel = formatLocationLabel(store.userLocation);
  const filteredCities = useMemo(() => {
    const normalized = cityFilter.trim().toLowerCase();
    if (!normalized) return allCities;
    return allCities.filter((city) => {
      const haystack = [city.label, city.city, city.keyword, ...(city.aliases ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [cityFilter]);

  useEffect(() => {
    const query = keyword.trim();
    if (!query) {
      return;
    }

    const controller = window.setTimeout(() => {
      setSearching(true);
      suggestLocations(query, selectedCity)
        .then((items) => {
          setSuggestions(items.length ? items : localSuggestLocations(query, selectedCity));
        })
        .catch(() => {
          setSuggestions(localSuggestLocations(query, selectedCity));
        })
        .finally(() => setSearching(false));
    }, 220);

    return () => window.clearTimeout(controller);
  }, [keyword, selectedCity]);

  function finish(location: UserLocation & { areaCode?: string }) {
    store.applyLocation(location);
    router.push(returnTo);
  }

  function selectCity(city: UserLocation) {
    const nextCity = city.city || city.label;
    setSelectedCity(nextCity);
    setNotice(popularAreasForCity(nextCity).length ? `已切换到 ${nextCity}，可以继续选择商圈。` : `已切换到 ${nextCity}，可以搜索这个城市的商圈、地标或地址。`);
  }

  async function applyCandidate(location: UserLocation) {
    const key = `${location.label}-${location.longitude}-${location.latitude}`;
    if (location.longitude && location.latitude) {
      finish(location);
      return;
    }

    setApplyingKey(key);
    setNotice("正在确认这个位置。");
    try {
      const resolved = await resolveLocation(location.keyword || location.label);
      finish({ ...resolved, source: "manual" });
    } catch (error) {
      setNotice(getApiErrorMessage(error));
    } finally {
      setApplyingKey("");
    }
  }

  async function locateAgain() {
    if (!("geolocation" in navigator)) {
      setNotice("当前浏览器不支持定位，可以选择城市或搜索地标。");
      return;
    }

    setLocating(true);
    setNotice("正在重新定位。");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        try {
          const resolved = await reverseLocation(longitude, latitude);
          store.applyLocation({ ...resolved, longitude, latitude, source: "geolocation" });
          setSelectedCity(cityKey(resolved.city || store.city));
          setNotice(
            resolved.city || resolved.district || resolved.address
              ? `已定位到 ${formatLocationLabel(resolved)}`
              : "已获取当前位置，但暂时无法识别具体地址。",
          );
        } catch {
          store.applyLocation({
            label: "当前位置",
            longitude,
            latitude,
            source: "geolocation",
          });
          setNotice("已获取当前位置，但暂时无法识别具体地址。");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setNotice("定位未开启，可以搜索城市、商圈或地标继续使用。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  async function submitSearch() {
    const query = keyword.trim();
    if (!query) {
      setNotice("输入城市、商圈或地标后再搜索。");
      return;
    }

    setSearching(true);
    setNotice("");
    try {
      const resolved = await resolveLocation(query);
      finish({ ...resolved, source: "manual" });
    } catch (error) {
      const local = localSuggestLocations(query, selectedCity);
      if (local[0]) {
        finish(local[0]);
        return;
      }
      setNotice(getApiErrorMessage(error));
    } finally {
      setSearching(false);
    }
  }

  return (
    <MobileShell activeDock="home">
      <TopBackLink href={returnTo} label="返回" />

      <section className="mt-7">
        <p className="text-[13px] font-semibold text-muted">城市与商圈</p>
        <h1 className="mt-1 text-[30px] font-[650] leading-[1.1] tracking-normal text-foreground">选择位置</h1>
        <p className="mt-2 text-[14px] leading-[22px] text-muted">推荐会围绕这里寻找真实地点。</p>
      </section>

      <div className="mt-5 grid gap-3 pb-10">
        <GlassPanel className="rounded-[20px] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <MapPin size={16} strokeWidth={1.8} />
                <span className="truncate">{currentLabel}</span>
              </div>
              <p className="mt-1 text-[12px] font-medium leading-5 text-muted">
                {store.userLocation.source === "geolocation" ? "来自定位" : "当前已选择"}
                {store.userLocation.address ? ` · ${store.userLocation.address}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={locateAgain}
              disabled={locating}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/72 px-3 text-[13px] font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {locating ? <Loader2 className="animate-spin" size={15} /> : <LocateFixed size={15} />}
              重新定位
            </button>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => finish(store.userLocation)}
            className="mt-3 min-h-[46px] w-full justify-between px-4"
          >
            <span>使用当前位置</span>
            <ChevronRight size={16} />
          </Button>
          {notice && (
            <p className="mt-3 rounded-[14px] bg-[#fff3ef] px-3 py-2 text-[12px] font-semibold leading-5 text-warning">
              {notice}
            </p>
          )}
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <label htmlFor="location-search" className="text-[16px] font-semibold text-foreground">
            搜索
          </label>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <div className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-black/[0.06] bg-[#faf8f5] px-3.5">
              <Search size={16} className="shrink-0 text-muted" />
              <input
                id="location-search"
                value={keyword}
                onChange={(event) => {
                  const value = event.target.value;
                  setKeyword(value);
                  if (!value.trim()) {
                    setSuggestions([]);
                    setSearching(false);
                  } else {
                    setSearching(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitSearch();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-foreground outline-none placeholder:text-muted/70"
                placeholder="搜索城市、商圈、地标"
              />
            </div>
            <button
              type="button"
              onClick={() => void submitSearch()}
              disabled={searching}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {searching ? <Loader2 className="animate-spin" size={15} /> : "搜索"}
            </button>
          </div>

          {keyword.trim() && (
            <div className="mt-3 overflow-hidden rounded-[16px] border border-black/[0.06] bg-white/70">
              {suggestions.length ? (
                suggestions.map((item) => (
                  <LocationRow
                    key={`${item.city}-${item.district}-${item.label}-${item.longitude}`}
                    location={item}
                    loading={applyingKey === `${item.label}-${item.longitude}-${item.latitude}`}
                    onClick={() => void applyCandidate(item)}
                  />
                ))
              ) : (
                <div>
                  <div className="px-3.5 py-3 text-[13px] font-medium text-muted">
                    {searching ? "正在查找候选" : "还没有精确候选"}
                  </div>
                  <button
                    type="button"
                    onClick={() => void submitSearch()}
                    className="flex w-full items-center justify-between gap-3 border-t border-black/[0.05] px-3.5 py-3 text-left text-[14px] font-semibold text-foreground transition hover:bg-white active:scale-[0.995]"
                  >
                    <span className="min-w-0 truncate">
                      {selectedCity ? `在 ${selectedCity} 搜索「${keyword.trim()}」` : `搜索「${keyword.trim()}」`}
                    </span>
                    {searching ? <Loader2 className="shrink-0 animate-spin text-muted" size={16} /> : <ChevronRight size={16} className="shrink-0 text-muted" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">热门城市</h2>
            <span className="text-[12px] font-medium text-muted">{selectedCity}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {popularCities.map((city) => {
              const active = selectedCity === city.city;
              return (
                <button
                  key={city.city}
                  type="button"
                  onClick={() => selectCity(city)}
                  aria-pressed={active}
                  className={`min-h-10 rounded-full border px-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                    active ? "border-brand/20 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/66 text-muted"
                  }`}
                >
                  {city.label.replace("市", "")}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowAllCities((value) => !value)}
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-full border border-black/[0.07] bg-white/68 px-4 text-[13px] font-semibold text-foreground transition active:scale-[0.98]"
          >
            {showAllCities ? "收起" : "展开全部城市"}
            <ChevronRight className={`transition ${showAllCities ? "rotate-90" : ""}`} size={15} />
          </button>
          {showAllCities && (
            <div className="mt-3 rounded-[16px] border border-black/[0.06] bg-[#faf8f5] p-2.5">
              <input
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="h-10 w-full rounded-full border border-black/[0.06] bg-white/80 px-3.5 text-[13px] font-semibold text-foreground outline-none placeholder:text-muted/70"
                placeholder="搜索城市，例如 苏州 / xian"
                aria-label="搜索全部城市"
              />
              <div className="mt-2 grid max-h-[220px] grid-cols-3 gap-2 overflow-y-auto pr-1">
                {filteredCities.map((city) => {
                  const active = selectedCity === city.city;
                  return (
                    <button
                      key={city.city}
                      type="button"
                      onClick={() => selectCity(city)}
                      aria-pressed={active}
                      className={`min-h-9 rounded-full border px-2 text-[12px] font-semibold transition active:scale-[0.98] ${
                        active ? "border-brand/20 bg-brand-soft text-brand" : "border-black/[0.06] bg-white/72 text-muted"
                      }`}
                    >
                      {city.label.replace("市", "")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-foreground">热门地区 / 商圈</h2>
            <button type="button" onClick={() => finish(cityLocation(selectedCity))} className="text-[12px] font-semibold text-brand">
              使用城市
            </button>
          </div>
          {popularAreas.length ? (
            <div className="mt-3 grid gap-2">
              {popularAreas.map((area) => {
                const active = formatLocationLabel(store.userLocation) === formatLocationLabel(area);
                return (
                  <button
                    key={area.label}
                    type="button"
                    onClick={() => finish(area)}
                    aria-pressed={active}
                    className={`flex min-h-[62px] items-center justify-between gap-3 rounded-[18px] border px-3.5 py-2.5 text-left transition active:scale-[0.99] ${
                      active ? "border-brand/22 bg-white text-foreground" : "border-black/[0.06] bg-white/58 text-muted"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-[700] text-foreground">{area.label.split("·").pop()?.trim()}</span>
                      <span className="mt-1 block truncate text-[12px] font-medium">{area.city} · {area.district}</span>
                    </span>
                    {active ? <Check size={16} className="shrink-0 text-brand" /> : <ChevronRight size={16} className="shrink-0 text-muted" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-[18px] border border-dashed border-black/[0.09] bg-white/58 px-3.5 py-4">
              <p className="text-[14px] font-semibold text-foreground">{selectedCity} 暂无预设商圈</p>
              <p className="mt-1 text-[12px] font-medium leading-5 text-muted">可以搜索这个城市的商圈、地标或地址。</p>
              <button
                type="button"
                onClick={() => {
                  setKeyword(selectedCity.replace("市", ""));
                  setSearching(true);
                }}
                className="mt-3 inline-flex min-h-9 items-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-white transition active:scale-[0.98]"
              >
                去搜索 {selectedCity.replace("市", "")}
              </button>
            </div>
          )}
        </GlassPanel>

        <footer className="flex justify-center text-[12px] font-medium text-muted">
          <Link href="/legal">定位与隐私说明</Link>
        </footer>
      </div>
    </MobileShell>
  );
}

function LocationRow({ location, loading, onClick }: { location: UserLocation; loading?: boolean; onClick: () => void }) {
  const title = location.label.split("·").pop()?.trim() || location.label;
  const meta = [location.city, location.district].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-b border-black/[0.05] px-3.5 py-3 text-left last:border-b-0 transition hover:bg-white active:scale-[0.995]"
    >
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-[700] text-foreground">{title}</span>
        <span className="mt-1 block truncate text-[12px] font-medium text-muted">
          {meta}
          {location.address ? ` · ${location.address}` : ""}
        </span>
      </span>
      {loading ? <Loader2 className="shrink-0 animate-spin text-muted" size={16} /> : <ChevronRight size={16} className="shrink-0 text-muted" />}
    </button>
  );
}

function cityLocation(city: string): UserLocation {
  const match = allCities.find((item) => item.city === city || item.label === city);
  return {
    label: match?.label || city,
    city: match?.city || city,
    keyword: match?.keyword || city.replace("市", ""),
    longitude: match?.longitude,
    latitude: match?.latitude,
    source: "preset",
  };
}

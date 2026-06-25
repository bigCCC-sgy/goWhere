"use client";

import { ArrowRight, Check, ChevronDown, Cloud, CloudRain, CloudSnow, CloudSun, LocateFixed, Loader2, MapPin, Navigation, Sparkles, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reverseLocation } from "@/lib/api";
import { formatLocationLabel } from "@/lib/location-options";
import { sceneOptions, type SceneOption } from "@/lib/preference-options";
import { mockWeatherForCity } from "@/lib/weather";
import { useJourneyStore } from "@/store/useJourneyStore";
import { MobileShell } from "@/components/mobile-shell";

const sceneCards = sceneOptions.filter((scene) => scene.home).slice(0, 8);

function getWeatherIcon(weatherText: string): LucideIcon {
  if (weatherText.includes("雪")) return CloudSnow;
  if (weatherText.includes("雨")) return CloudRain;
  if (weatherText.includes("晴")) return Sun;
  if (weatherText.includes("多云")) return CloudSun;
  if (weatherText.includes("阴")) return Cloud;
  return Cloud;
}

export default function HomePage() {
  const router = useRouter();
  const store = useJourneyStore();
  const locationLabel = formatLocationLabel(store.userLocation);
  const weatherText = mockWeatherForCity(store.userLocation.city || store.city);
  const WeatherIcon = getWeatherIcon(weatherText);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");

  function locateNow() {
    if (!("geolocation" in navigator)) {
      setLocationNotice("当前浏览器不支持定位，可以点位置文字手动选择。");
      return;
    }

    setLocating(true);
    setLocationNotice("正在获取当前位置。");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        try {
          const resolved = await reverseLocation(longitude, latitude);
          const nextLocation = { ...resolved, longitude, latitude, source: "geolocation" as const };
          store.applyLocation(nextLocation);
          setLocationNotice(
            resolved.city || resolved.district || resolved.address
              ? `已定位到 ${formatLocationLabel(nextLocation)}`
              : "已获取当前位置，但暂时无法识别具体地址。",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationNotice("定位未开启，可以点位置文字手动选择。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  function enterChoose(scene?: SceneOption) {
    if (scene) {
      store.setDraft({
        scene: scene.value,
        query: scene.query,
        moodTags: scene.moodTags,
        avoidTags: scene.avoidTags,
      });
    }
    router.push("/generate?mode=choose");
  }

  return (
    <MobileShell activeDock="home">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[18px] font-[700] tracking-normal text-foreground">此刻去哪</div>
          <Link
            href="/location?returnTo=%2F"
            className="ios-pressable mt-1 flex max-w-[285px] min-w-0 items-center gap-1.5 rounded-full py-1 pr-2 text-[13px] font-medium text-muted"
            aria-label="选择位置"
          >
            <MapPin className="shrink-0" size={13} strokeWidth={1.8} />
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <span className="min-w-0 truncate">{locationLabel}</span>
              <span className="shrink-0 text-muted/70">·</span>
              <WeatherIcon className="shrink-0 text-muted" size={13} strokeWidth={1.8} />
              <span className="shrink-0 whitespace-nowrap">{weatherText}</span>
            </span>
            <ChevronDown className="shrink-0" size={13} strokeWidth={1.8} />
          </Link>
        </div>
        <button
          type="button"
          onClick={locateNow}
          disabled={locating}
          aria-label="快速定位"
          className="ios-pressable ios-lift inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.07] bg-white/72 text-foreground disabled:opacity-60"
        >
          {locating ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} strokeWidth={1.9} />}
        </button>
      </header>

      {locationNotice && (
        <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-white/70 px-3 py-2 text-[12px] font-medium leading-5 text-muted">
          {locationNotice}
        </div>
      )}

      <AnimatedRouteHero />

      <section className="mt-4 grid gap-2">
        <HomeActionButton
          title="帮我选"
          subtitle="点几下，今晚就有安排"
          onClick={() => enterChoose()}
          primary
        />
        <HomeActionButton
          title="我有想法"
          subtitle="说一句，我帮你整理"
          href="/generate?mode=idea"
        />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[18px] font-[700] text-foreground">先选一个今晚的方向</h2>
          <span className="text-[12px] font-medium text-muted">可到下一步细调</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sceneCards.map((scene) => {
            const active = store.scene === scene.value;
            return (
              <button
                key={scene.value}
                type="button"
                onClick={() => enterChoose(scene)}
                className={`ios-pressable min-h-[88px] rounded-[18px] border p-3 text-left ${
                  active
                    ? "scene-selected-pulse border-brand/18 bg-[#fffdf9] text-foreground shadow-[0_8px_18px_rgba(68,48,30,0.045)]"
                    : "border-black/[0.06] bg-white/58 text-muted"
                  }`}
              >
                <span className="flex items-center justify-between text-[16px] font-[700]">
                  {scene.label}
                  {active && <Check size={15} className="text-brand" />}
                </span>
                <span className="mt-1.5 block text-[12px] leading-5">{scene.prompt}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-7 flex items-center justify-center gap-4 text-[12px] font-medium text-muted">
        <Link href="/favorites">本地收藏</Link>
        <span className="h-1 w-1 rounded-full bg-muted/40" />
        <Link href="/legal">协议与说明</Link>
      </footer>
    </MobileShell>
  );
}

function AnimatedRouteHero() {
  const [pulseKey, setPulseKey] = useState(0);

  function replayHero() {
    setPulseKey((value) => value + 1);
  }

  if (pulseKey >= 0) {
    return (
      <button
        type="button"
        onClick={replayHero}
        aria-label="播放今晚灵感生成动效"
        className="animated-route-hero ios-pressable relative mt-5 block h-[238px] w-full overflow-hidden rounded-[26px] border border-white/80 text-left shadow-[0_20px_44px_rgba(68,48,30,0.12)]"
      >
        <div className="hero-glass-sweep pointer-events-none absolute inset-0" />
        <div className="hero-aurora pointer-events-none absolute inset-0" />
        <div className="hero-depth-glass pointer-events-none absolute left-4 right-4 top-4 h-[132px] rounded-[30px]" />
        <div className="hero-city-silhouette pointer-events-none absolute inset-x-6 top-[92px] h-14" aria-hidden="true">
          <span className="left-[4%] h-8 w-5" />
          <span className="left-[14%] h-12 w-7" />
          <span className="left-[27%] h-7 w-10" />
          <span className="left-[44%] h-10 w-6" />
          <span className="left-[58%] h-6 w-12" />
          <span className="left-[76%] h-11 w-8" />
          <span className="left-[91%] h-7 w-5" />
        </div>

        <div key={`halo-${pulseKey}`} className="hero-tap-halo pointer-events-none absolute left-1/2 top-[76px] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/10" />

        <svg className="pointer-events-none absolute left-3 right-3 top-4 h-[146px] w-[calc(100%-24px)]" viewBox="0 0 340 150" fill="none" aria-hidden="true">
          <path
            d="M34 104C78 38 119 52 150 76C180 99 203 112 238 68C264 36 294 32 316 46"
            stroke="rgba(121,94,75,0.12)"
            strokeLinecap="round"
            strokeWidth="18"
          />
          <path
            className="hero-flow-line"
            d="M34 104C78 38 119 52 150 76C180 99 203 112 238 68C264 36 294 32 316 46"
            stroke="url(#heroFlow)"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
          <path
            key={`flow-${pulseKey}`}
            className="hero-flow-spark"
            d="M34 104C78 38 119 52 150 76C180 99 203 112 238 68C264 36 294 32 316 46"
            stroke="rgba(255,247,235,0.96)"
            strokeLinecap="round"
            strokeWidth="4.2"
          />
          <defs>
            <linearGradient id="heroFlow" x1="34" x2="316" y1="104" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d9bba2" stopOpacity="0.34" />
              <stop offset="0.48" stopColor="#d94a4a" stopOpacity="0.34" />
              <stop offset="1" stopColor="#8e9aa0" stopOpacity="0.26" />
            </linearGradient>
          </defs>
        </svg>

        <div key={`core-${pulseKey}`} className="hero-core hero-pulse-once absolute left-1/2 top-[42px] h-[94px] w-[94px] -translate-x-1/2 rounded-[32px]">
          <div className="absolute inset-[10px] rounded-[26px] border border-white/70 bg-white/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl" />
          <div className="hero-core-orb absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(217,74,74,0.34)]" />
        </div>

        <div className="hero-floating-card hero-floating-card-a absolute left-5 top-[39px] h-[62px] w-[94px] rounded-[22px] border border-white/64 bg-white/26 backdrop-blur-xl">
          <span className="absolute left-3 top-3 h-8 w-8 rounded-[12px] bg-[linear-gradient(135deg,rgba(217,74,74,0.16),rgba(255,255,255,0.48))]" />
          <span className="absolute left-[50px] top-[18px] h-2 w-7 rounded-full bg-[#b9a895]/35" />
          <span className="absolute left-[50px] top-[32px] h-1.5 w-9 rounded-full bg-white/58" />
        </div>
        <div className="hero-floating-card hero-floating-card-b absolute right-5 top-[56px] h-[58px] w-[88px] rounded-[20px] border border-white/58 bg-white/22 backdrop-blur-xl">
          <span className="absolute left-3 top-3 h-7 w-7 rounded-[11px] bg-[linear-gradient(135deg,rgba(142,154,160,0.18),rgba(255,255,255,0.46))]" />
          <span className="absolute left-[46px] top-[17px] h-2 w-7 rounded-full bg-[#9b8b7a]/28" />
          <span className="absolute left-[46px] top-[31px] h-1.5 w-8 rounded-full bg-white/52" />
        </div>

        <span className="hero-star absolute right-[30px] top-[22px] text-[#d9745a]" aria-hidden="true">
          <Sparkles size={16} strokeWidth={2.1} />
        </span>
        <span className="hero-star hero-star-soft absolute left-[46px] top-[106px] text-[#e0a483]" aria-hidden="true">
          <Sparkles size={13} strokeWidth={2.1} />
        </span>

        <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,transparent,rgba(255,252,247,0.64)_20%,rgba(255,252,247,0.9)_100%)] px-4 pb-4 pt-8 text-[#171717]">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7f7164]">
            <Sparkles size={13} /> 今晚，从一个选择开始
          </p>
          <h1 className="mt-1 whitespace-nowrap text-[21px] font-[750] leading-[1.15] tracking-normal">
            你不用想太多，我来把路线排好
          </h1>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={replayHero}
      aria-label="播放路线生成动效"
      className="animated-route-hero ios-pressable relative mt-5 block h-[224px] w-full overflow-hidden rounded-[24px] border border-white/80 bg-[#fbf7f1] text-left shadow-[0_18px_38px_rgba(68,48,30,0.11)]"
    >
      <div className="hero-glass-sweep pointer-events-none absolute inset-0" />
      <div className="absolute left-[-60px] top-[-72px] h-48 w-48 rounded-full bg-[#fff4e8] blur-2xl" />
      <div className="absolute bottom-[-68px] right-[-54px] h-52 w-52 rounded-full bg-[#f3e5d7] blur-2xl" />
      <div className="absolute right-5 top-5 h-16 w-16 rounded-full border border-white/70 bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md" />
      <div key={`halo-${pulseKey}`} className="hero-tap-halo pointer-events-none absolute left-1/2 top-[88px] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/10" />

      <div className="absolute inset-x-5 top-5 h-[122px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 332 128" fill="none" aria-hidden="true">
          <path
            d="M18 92C66 28 117 19 164 63C207 103 261 84 315 25"
            stroke="rgba(126,104,84,0.13)"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            className="hero-route-dash"
            d="M18 92C66 28 117 19 164 63C207 103 261 84 315 25"
            stroke="rgba(116,99,83,0.48)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="7 9"
          />
          <circle className="hero-light-dot" cx="18" cy="92" r="5.2" fill="#fffaf4" stroke="#d98a68" strokeWidth="2" />
        </svg>

        <div key={pulseKey} className="hero-compass hero-pulse-once absolute left-[119px] top-[26px] flex h-[80px] w-[80px] items-center justify-center rounded-[25px] border border-white/72 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_14px_28px_rgba(91,68,48,0.11)] backdrop-blur-xl">
          <Navigation className="text-[#47535a]" size={38} strokeWidth={1.62} />
          <span className="absolute h-2.5 w-2.5 rounded-full bg-[#d9745a] shadow-[0_0_0_5px_rgba(217,116,90,0.13)]" />
        </div>

        <span className="hero-star absolute right-[22px] top-[10px] text-[#d9745a]">
          <Sparkles size={17} strokeWidth={2.1} />
        </span>
        <span className="absolute left-[32px] top-[74px] h-3 w-3 rounded-full border border-white bg-[#d8c2aa] shadow-[0_0_0_7px_rgba(216,194,170,0.13)]" />
        <span className="absolute right-[12px] top-[19px] h-3 w-3 rounded-full border border-white bg-[#e49a76] shadow-[0_0_0_7px_rgba(228,154,118,0.13)]" />

        <div className="absolute left-1 top-[22px] h-[54px] w-[92px] rounded-[18px] border border-white/70 bg-white/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_12px_24px_rgba(91,68,48,0.08)] backdrop-blur-md">
          <span className="absolute left-3 top-3 h-2 w-10 rounded-full bg-[#d8c2aa]/55" />
          <span className="absolute left-3 top-7 h-1.5 w-14 rounded-full bg-white/64" />
        </div>
        <div className="absolute right-5 top-[66px] h-[48px] w-[84px] rounded-[16px] border border-white/64 bg-white/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_10px_20px_rgba(91,68,48,0.07)] backdrop-blur-md">
          <span className="absolute left-3 top-3 h-2 w-9 rounded-full bg-[#e49a76]/45" />
          <span className="absolute left-3 top-7 h-1.5 w-12 rounded-full bg-white/62" />
        </div>
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/72 bg-white/46 px-3 py-1.5 text-[11px] font-semibold text-[#7d6957] shadow-[0_8px_18px_rgba(91,68,48,0.08)] backdrop-blur-md">
        轻点重播路线流光
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,transparent,rgba(255,252,247,0.64)_24%,rgba(255,252,247,0.84)_100%)] px-4 pb-4 pt-7 text-[#171717]">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7f7164]">
          <Sparkles size={13} /> 今晚，从一个选择开始
        </p>
        <h1 className="mt-1 whitespace-nowrap text-[22px] font-[750] leading-[1.15] tracking-normal">
          你不用想太多，我来把路线排好
        </h1>
      </div>
    </button>
  );
}

function HomeActionButton({
  title,
  subtitle,
  href,
  onClick,
  primary = false,
}: {
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const className = `ios-pressable ios-lift relative flex min-h-[62px] overflow-hidden items-center justify-between gap-3 rounded-[20px] border px-4 text-left ${
    primary
      ? "border-black/[0.065] bg-[linear-gradient(180deg,rgba(255,253,249,0.94),rgba(255,248,241,0.86))] text-foreground shadow-[0_12px_24px_rgba(68,48,30,0.09)]"
      : "border-black/[0.06] bg-white/72 text-foreground shadow-[0_8px_18px_rgba(30,22,14,0.045)]"
  }`;
  const content = (
    <>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 truncate text-[16px] font-[750]">
          {primary && <Sparkles size={14} className="shrink-0 text-[#d9745a]" strokeWidth={2} />}
          <span className="truncate">{title}</span>
        </span>
        <span className="mt-1 block truncate text-[12px] font-semibold text-muted">
          {subtitle}
        </span>
      </span>
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          primary ? "bg-brand-soft text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]" : "bg-white text-[#5f574f] border border-black/[0.06]"
        }`}
      >
        <ArrowRight size={17} strokeWidth={2.2} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

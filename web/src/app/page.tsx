"use client";

import { ArrowRight, Check, ChevronRight, LocateFixed, Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { generateRecommendations, getApiErrorMessage, resolveLocation } from "@/lib/api";
import type { SceneCode, UserLocation } from "@/lib/types";
import { useJourneyStore } from "@/store/useJourneyStore";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui";

type HomePreset = {
  scene: SceneCode;
  title: string;
  note: string;
  query: string;
  moods: string[];
  avoids: string[];
  steps: string[];
  tags: string[];
  meta: string;
};

const presets: Record<SceneCode, HomePreset> = {
  date: {
    scene: "date",
    title: "不尴尬的第一次约会",
    note: "先坐下来，再自然走一段。",
    query: "第一次约会，预算300，不想太吵，希望自然一点",
    moods: ["安静", "浪漫"],
    avoids: ["太吵"],
    steps: ["安静咖啡", "氛围晚餐", "自然散步"],
    tags: ["#安静咖啡", "#自然散步", "#不赶路"],
    meta: "人均 ¥238 · 1.8km · 3h",
  },
  friends: {
    scene: "friends",
    title: "朋友小酌不踩雷",
    note: "好聊天，有饭吃，也能轻松收尾。",
    query: "和朋友小酌，想找好聊天的地方，别太贵",
    moods: ["好聊天", "不排队"],
    avoids: ["太贵"],
    steps: ["轻晚餐", "小酒馆", "夜路散步"],
    tags: ["#好聊天", "#小酌", "#收尾舒服"],
    meta: "人均 ¥180 · 1.5km · 3h",
  },
  weekend: {
    scene: "weekend",
    title: "周末半日慢逛",
    note: "一点内容，一点咖啡，一点城市感。",
    query: "周末想看展再吃点东西，路线不要太赶",
    moods: ["出片", "不赶"],
    avoids: ["太累"],
    steps: ["先看展", "咖啡休息", "晚餐收尾"],
    tags: ["#看展", "#咖啡", "#慢慢逛"],
    meta: "人均 ¥210 · 2.2km · 4h",
  },
  alone: {
    scene: "alone",
    title: "一个人的恢复路线",
    note: "安静、有书、有风，别被人群打扰。",
    query: "一个人想安静待一会儿，最好能读书或散步",
    moods: ["安静", "自然"],
    avoids: ["太吵"],
    steps: ["书店", "公园", "咖啡"],
    tags: ["#独处", "#书店", "#放空"],
    meta: "人均 ¥80 · 1.4km · 2.5h",
  },
  rain: {
    scene: "rain",
    title: "雨天也不狼狈",
    note: "尽量室内，少走路，留一点余地。",
    query: "今天下雨，想找室内路线，别走太多路",
    moods: ["室内", "省力"],
    avoids: ["太远"],
    steps: ["商场", "展演空间", "晚餐"],
    tags: ["#室内", "#少走路", "#雨天"],
    meta: "人均 ¥160 · 1.2km · 3.5h",
  },
  eat: {
    scene: "eat",
    title: "下班后好好吃饭",
    note: "舒服、方便，最好不用等太久。",
    query: "下班后想吃点舒服的，人均150左右，不想排很久",
    moods: ["省心", "不排队"],
    avoids: ["排队"],
    steps: ["先吃饭", "咖啡甜点", "短程散步"],
    tags: ["#下班饭", "#不排队", "#轻松"],
    meta: "人均 ¥150 · 900m · 2h",
  },
};

const moodActions = [
  { label: "心情一般", query: "今天有点累，想找舒服、不费力、能慢慢恢复状态的路线", moodTags: ["安静", "省力"] },
  { label: "想见人", query: "今晚想和人见面聊天，地点要自然、不太吵，方便收尾", moodTags: ["好聊天", "自然"] },
  { label: "想出片", query: "想找有画面感、适合拍照但不要太赶的城市路线", moodTags: ["出片", "不赶"] },
];

const locationPresets = ["上海 静安寺", "北京 三里屯", "成都 太古里", "杭州 西湖", "广州 天河城", "深圳 海岸城"];

const sceneOrder: SceneCode[] = ["date", "friends", "alone", "weekend", "rain", "eat"];

export default function HomePage() {
  const router = useRouter();
  const store = useJourneyStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedStep, setSelectedStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationNotice, setLocationNotice] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [resolvingLocation, setResolvingLocation] = useState(false);

  const preset = presets[store.scene] ?? presets.date;
  const weatherText = `${store.userLocation.label} · 多云 26°C`;

  function applyPreset(code: SceneCode) {
    const next = presets[code];
    setSelectedStep(0);
    setError("");
    store.setDraft({
      scene: code,
      query: next.query,
      moodTags: next.moods,
      avoidTags: next.avoids,
    });
  }

  function applyMood(label: string, query: string, moodTags: string[]) {
    setSelectedMood(label);
    setError("");
    store.setDraft({ query, moodTags });
    textareaRef.current?.focus();
  }

  function selectRouteStep(step: string, index: number) {
    setSelectedStep(index);
    setError("");
    store.setDraft({
      query: `我想从${step}开始，${preset.query}`,
      moodTags: preset.moods,
      avoidTags: preset.avoids,
    });
  }

  function applyUserLocation(location: UserLocation) {
    store.setDraft({
      userLocation: location,
      city: location.city || location.label || "全国",
      areaCode: location.source === "preset" ? "xinjiekou" : "manual",
      location:
        location.longitude && location.latitude
          ? {
              longitude: location.longitude,
              latitude: location.latitude,
              label: location.label,
              city: location.city,
              district: location.district,
              address: location.address,
              source: location.source,
            }
          : undefined,
    });
  }

  async function submitManualLocation(keyword = locationInput) {
    const nextKeyword = keyword.trim();
    if (!nextKeyword) {
      setLocationNotice("输入城市、商圈、地址或地标，例如“上海 静安寺”。");
      return;
    }

    setResolvingLocation(true);
    setLocationNotice("正在确认这个位置。");
    try {
      const resolved = await resolveLocation(nextKeyword);
      applyUserLocation(resolved);
      setLocationInput("");
      setLocationNotice(`已切换到 ${resolved.label}，推荐会围绕这里生成。`);
    } catch (caughtError) {
      setLocationNotice(getApiErrorMessage(caughtError));
    } finally {
      setResolvingLocation(false);
    }
  }

  function useLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setLocationNotice("当前浏览器不支持定位，可以直接输入城市、商圈或地标。");
      return;
    }

    setLocationNotice("正在请求定位。拒绝后也可以继续使用。");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        store.setDraft({
          city: "全国",
          areaCode: "geolocation",
          userLocation: {
            label: "当前位置",
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            source: "geolocation",
          },
          location: {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            label: "当前位置",
            source: "geolocation",
          },
        });
        setLocationNotice("已使用当前位置，本次路线会优先考虑距离。");
      },
      () => {
        setLocationNotice("定位未开启，可以直接输入城市、商圈或地标继续使用。");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submitFromHome() {
    if (!store.query.trim()) {
      setError("先说说今晚的状态，比如“第一次约会，预算300，不想太吵”。");
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await generateRecommendations(store.toRequest());
      store.setResult(result);
      router.push("/results");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell activeDock="home">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[18px] font-[700] tracking-normal text-foreground">此刻去哪</div>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <MapPin size={13} strokeWidth={1.8} />
            {weatherText}
          </div>
        </div>
        <button
          type="button"
          onClick={useLocation}
          aria-label="使用当前位置"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.07] bg-white/72 text-foreground transition active:scale-[0.98]"
        >
          <LocateFixed size={18} strokeWidth={1.9} />
        </button>
      </header>

      {locationNotice && (
        <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-white/70 px-3 py-2 text-[12px] font-medium leading-5 text-muted">
          {locationNotice}
        </div>
      )}

      <section className="mt-3 rounded-[18px] border border-black/[0.06] bg-white/70 p-2.5">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={locationInput}
            onChange={(event) => setLocationInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitManualLocation();
              }
            }}
            className="h-11 min-w-0 rounded-full border border-black/[0.06] bg-[#faf8f5] px-4 text-[14px] font-semibold text-foreground outline-none placeholder:text-muted/70"
            placeholder="输入城市/商圈/地标，如 上海 静安寺"
            aria-label="手动输入位置"
          />
          <button
            type="button"
            onClick={() => void submitManualLocation()}
            disabled={resolvingLocation}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {resolvingLocation ? <Loader2 className="animate-spin" size={16} /> : "使用"}
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {locationPresets.map((keyword) => (
            <button
              key={keyword}
              type="button"
              disabled={resolvingLocation}
              onClick={() => void submitManualLocation(keyword)}
              className="inline-flex h-8 shrink-0 items-center rounded-full border border-black/[0.06] bg-white/72 px-3 text-[12px] font-semibold text-muted transition active:scale-[0.98] disabled:opacity-60"
            >
              {keyword.replace(" ", " · ")}
            </button>
          ))}
        </div>
      </section>

      <section
        className="relative mt-5 h-[214px] overflow-hidden rounded-[20px] border border-black/[0.06] bg-[#2b241f] shadow-[0_14px_30px_rgba(30,22,14,0.12)]"
        role="button"
        tabIndex={0}
        onClick={() => applyPreset(store.scene)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            applyPreset(store.scene);
          }
        }}
        aria-label="套用今晚路线灵感"
      >
        <Image
          src="/route-evening-card-v2.png"
          alt="城市夜晚路线灵感"
          fill
          priority
          sizes="(max-width: 430px) 100vw, 430px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.54)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-[12px] font-medium opacity-80">今晚灵感</p>
          <h1 className="mt-1 max-w-[260px] text-[28px] font-[700] leading-[1.08] tracking-normal">
            走一条刚刚好的路线
          </h1>
          <div className="mt-3 inline-flex rounded-full bg-white/18 px-3 py-1.5 text-[12px] font-semibold backdrop-blur">
            {preset.title}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[20px] border border-black/[0.07] bg-card p-3 shadow-[0_8px_22px_rgba(30,22,14,0.055)]">
        <label htmlFor="home-query" className="px-1 text-[14px] font-semibold text-foreground">
          说说今晚的状态
        </label>
        <textarea
          id="home-query"
          ref={textareaRef}
          value={store.query}
          onChange={(event) => {
            setError("");
            store.setDraft({ query: event.target.value });
          }}
          maxLength={200}
          className="mt-2 min-h-[96px] w-full resize-none rounded-[16px] border border-black/[0.06] bg-[#faf8f5] px-3.5 py-3 text-[15px] font-medium leading-6 text-foreground outline-none placeholder:text-muted/70"
          placeholder="第一次约会，预算300，不想太吵"
        />
        <div className="mt-3 grid grid-cols-[1fr_48px] gap-2">
          <Button
            type="button"
            onClick={submitFromHome}
            disabled={loading}
            className="min-h-[50px] justify-between px-4 text-[15px]"
          >
            <span className="inline-flex items-center gap-2">
              {loading && <Loader2 className="animate-spin" size={17} />}
              {loading ? "正在生成路线" : "生成今晚路线"}
            </span>
            <ArrowRight size={17} />
          </Button>
          <Link
            href="/generate"
            aria-label="先调整条件"
            className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-black/[0.07] bg-white/76 text-foreground transition active:scale-[0.98]"
          >
            <SlidersHorizontal size={18} strokeWidth={1.9} />
          </Link>
        </div>
        {error && <p className="mt-3 rounded-[14px] bg-brand-soft px-3 py-2 text-[12px] font-semibold leading-5 text-warning">{error}</p>}
      </section>

      <section className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {moodActions.map((mood) => {
          const active = selectedMood === mood.label;
          return (
            <button
              key={mood.label}
              type="button"
              aria-pressed={active}
              onClick={() => applyMood(mood.label, mood.query, mood.moodTags)}
                className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold ${
                active ? "border-brand/30 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/62 text-foreground"
              }`}
            >
              {active && <Check className="mr-1.5" size={13} />}
              {mood.label}
            </button>
          );
        })}
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-[700] text-foreground">今晚适合这样走</h2>
          <button type="button" onClick={() => applyPreset(store.scene)} className="text-[13px] font-semibold text-brand">
            套用
          </button>
        </div>

        <button
          type="button"
          onClick={() => applyPreset(store.scene)}
          className="block w-full overflow-hidden rounded-[20px] border border-black/[0.07] bg-card text-left shadow-[0_8px_22px_rgba(30,22,14,0.055)] transition active:scale-[0.99]"
        >
          <div className="grid grid-cols-[112px_minmax(0,1fr)]">
            <div className="relative min-h-[132px] bg-[#eadfd3]">
              <Image src="/route-evening-card-v2.png" alt="" fill sizes="112px" className="object-cover" />
            </div>
            <div className="p-3.5">
              <h3 className="line-clamp-2 text-[18px] font-[700] leading-6 text-foreground">{preset.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted">{preset.note}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {preset.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-muted">{preset.meta}</p>
            </div>
          </div>
        </button>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {preset.steps.map((step, index) => (
            <button
              key={step}
              type="button"
              aria-pressed={selectedStep === index}
              onClick={() => selectRouteStep(step, index)}
              className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold ${
                selectedStep === index ? "border-brand/24 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/62 text-muted"
              }`}
            >
              {index + 1}. {step}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="场景" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sceneOrder.map((code) => {
            const item = presets[code];
            const active = store.scene === code;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(code)}
                className={`relative w-[132px] shrink-0 rounded-[18px] border p-3 text-left transition active:scale-[0.98] ${
                  active ? "border-brand/24 bg-white/82 text-foreground shadow-[0_8px_18px_rgba(217,74,74,0.08)]" : "border-black/[0.06] bg-white/58 text-muted"
                }`}
              >
                {active && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand shadow-[0_0_0_4px_rgba(217,74,74,0.1)]" />}
                <span className="block text-[15px] font-[700]">{item.title.replace("的第一次", "")}</span>
                <span className="mt-1 block line-clamp-2 text-[12px] leading-4">{item.note}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="热门位置" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {locationPresets.map((keyword) => {
            const [city, name] = keyword.split(" ");
            const active =
              store.userLocation.keyword === keyword ||
              store.userLocation.label.includes(name ?? keyword);
            return (
              <button
                key={keyword}
                type="button"
                aria-pressed={active}
                disabled={resolvingLocation}
                onClick={() => void submitManualLocation(keyword)}
                className={`min-h-[64px] rounded-[18px] border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                  active ? "border-brand/24 bg-white text-foreground" : "border-black/[0.06] bg-white/54 text-muted"
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-[15px] font-[700]">
                  {name ?? keyword}
                  {active && <Check size={15} className="text-brand" />}
                </span>
                <span className="mt-1 block truncate text-[12px]">{city}</span>
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

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[18px] font-[700] text-foreground">{title}</h2>
      <ChevronRight size={16} className="text-muted" />
    </div>
  );
}

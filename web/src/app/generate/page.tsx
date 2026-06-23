"use client";

import { Check, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { generateRecommendations, getApiErrorMessage, resolveLocation } from "@/lib/api";
import { scenes } from "@/lib/mock-data";
import type { SceneCode, UserLocation } from "@/lib/types";
import { useJourneyStore } from "@/store/useJourneyStore";
import { Button, Pill } from "@/components/ui";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";

const budgets = [80, 150, 300, 500];
const companions = [
  { code: "alone", name: "一个人" },
  { code: "date", name: "约会" },
  { code: "friends", name: "朋友" },
  { code: "colleagues", name: "同事" },
];
const moods = ["安静", "浪漫", "出片", "省钱", "不排队", "室内", "自然", "好聊天"];
const avoids = ["太吵", "太远", "太贵", "排队", "太累"];

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition active:scale-[0.98] ${
        active ? "border-brand/24 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/62 text-muted"
      }`}
    >
      {active && <Check size={14} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const store = useJourneyStore();
  const queryRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [locationError, setLocationError] = useState("");
  const [resolvingLocation, setResolvingLocation] = useState(false);

  function toggleTag(type: "moodTags" | "avoidTags", tag: string) {
    const current = store[type];
    store.setDraft({ [type]: current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag] });
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

  async function submitManualLocation() {
    const keyword = locationInput.trim();
    if (!keyword) {
      setLocationError("输入城市、商圈、地址或地标，例如“成都 太古里”。");
      return;
    }

    setResolvingLocation(true);
    setLocationError("");
    try {
      const resolved = await resolveLocation(keyword);
      applyUserLocation(resolved);
      setLocationInput("");
    } catch (caughtError) {
      setLocationError(getApiErrorMessage(caughtError));
    } finally {
      setResolvingLocation(false);
    }
  }

  async function submit() {
    if (!store.query.trim()) {
      setError("先告诉我一句你的状态或需求，再生成路线。");
      queryRef.current?.focus();
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
    <MobileShell activeDock="inspiration">
      <TopBackLink
        href="/"
        label="返回首页"
        right={
          <Pill className="min-h-[40px] bg-white/62 text-foreground">
            <MapPin size={14} strokeWidth={1.8} />
            {store.userLocation.label}
          </Pill>
        }
      />

      <SectionTitle
        className="mt-8"
        eyebrow="今晚偏好"
        title="调整今晚的偏好"
        description="保留你在意的几件事就好。"
      />

      <div className="mt-5 grid gap-3 pb-40">
        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="位置" hint={store.userLocation.source === "geolocation" ? "来自定位" : "可手动修改"} />
          <div className="mt-3 rounded-[16px] border border-black/[0.06] bg-[#faf8f5] px-3.5 py-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <MapPin size={15} strokeWidth={1.8} />
              <span className="min-w-0 truncate">{store.userLocation.label}</span>
            </div>
            {store.userLocation.address && (
              <p className="mt-1 truncate text-[12px] font-medium text-muted">{store.userLocation.address}</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={locationInput}
              onChange={(event) => {
                setLocationInput(event.target.value);
                setLocationError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitManualLocation();
                }
              }}
              className="h-10 min-w-0 rounded-full border border-black/[0.06] bg-white/72 px-3.5 text-[13px] font-semibold text-foreground outline-none placeholder:text-muted/70"
              placeholder="如 北京 三里屯"
              aria-label="手动修改位置"
            />
            <button
              type="button"
              onClick={() => void submitManualLocation()}
              disabled={resolvingLocation}
              className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {resolvingLocation ? <Loader2 className="animate-spin" size={15} /> : "使用"}
            </button>
          </div>
          {locationError && <p className="mt-2 text-[12px] font-semibold leading-5 text-warning">{locationError}</p>}
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <div className="text-[15px] font-semibold text-foreground">
            一句需求
          </div>
          <textarea
            ref={queryRef}
            value={store.query}
            onChange={(event) => store.setDraft({ query: event.target.value })}
            maxLength={200}
            aria-invalid={Boolean(error && !store.query.trim())}
            className="mt-3 min-h-[96px] w-full resize-none rounded-[16px] border border-black/[0.07] bg-[#faf8f5] px-4 py-3 text-[15px] font-medium leading-6 text-foreground outline-none placeholder:text-muted/70"
            placeholder="比如：第一次约会，预算300，不想太吵"
          />
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="场景" hint="选择今晚的主旋律" />
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {scenes.map((scene) => (
              <OptionButton
                key={scene.code}
                active={store.scene === scene.code}
                onClick={() => store.setDraft({ scene: scene.code as SceneCode })}
              >
                {scene.name}
              </OptionButton>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="预算" hint={`当前人均约 ¥${store.budget}`} />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {budgets.map((budget) => (
              <OptionButton key={budget} active={store.budget === budget} onClick={() => store.setDraft({ budget })}>
                ¥{budget}
              </OptionButton>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="同行人" hint="路线氛围会跟着调整" />
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {companions.map((item) => (
              <OptionButton
                key={item.code}
                active={store.companions === item.code}
                onClick={() => store.setDraft({ companions: item.code })}
              >
                {item.name}
              </OptionButton>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="想要的状态" hint="选 2-3 个最贴近此刻的词" />
          <div className="mt-3 flex flex-wrap gap-2">
            {moods.map((tag) => (
              <OptionButton key={tag} active={store.moodTags.includes(tag)} onClick={() => toggleTag("moodTags", tag)}>
                {tag}
              </OptionButton>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="尽量避开" hint="会降低相关地点权重" />
          <div className="mt-3 flex flex-wrap gap-2">
            {avoids.map((tag) => (
              <OptionButton key={tag} active={store.avoidTags.includes(tag)} onClick={() => toggleTag("avoidTags", tag)}>
                {tag}
              </OptionButton>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="fixed inset-x-0 bottom-[82px] z-40 mx-auto w-[min(398px,calc(100%_-_24px))]">
        <div className="rounded-[22px] border border-black/[0.07] bg-[#faf8f5]/92 p-2.5 shadow-[0_12px_28px_rgba(30,22,14,0.09)] backdrop-blur-xl">
          {error && (
            <p className="mb-2 rounded-[18px] bg-[#fff3ef] px-3 py-2 text-[13px] font-semibold leading-5 text-warning">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={loading} className="min-h-[54px] w-full justify-between px-5 text-[17px]">
            <span className="inline-flex items-center gap-2">
              {loading && <Loader2 className="animate-spin" size={19} />}
              {loading ? "正在生成路线" : "生成方案"}
            </span>
            <span className="max-w-[120px] truncate text-sm text-white/78">{store.userLocation.label}</span>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

function PanelLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="text-[16px] font-semibold text-foreground">{title}</div>
      <div className="shrink-0 text-[12px] font-medium text-muted">{hint}</div>
    </div>
  );
}

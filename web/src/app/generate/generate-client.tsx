"use client";

import { Check, ChevronRight, Loader2, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { generateRecommendations, getApiErrorMessage } from "@/lib/api";
import { parseIntentFromText, type ParsedIntent } from "@/lib/intent";
import { formatLocationLabel } from "@/lib/location-options";
import {
  avoidOptions,
  budgetOptions,
  budgetValue,
  companionOptions,
  cuisineOptions,
  distanceOptions,
  labelOf,
  moodOptions,
  sceneCategories,
  sceneOptions,
} from "@/lib/preference-options";
import type { GenerateRequest, SceneCode } from "@/lib/types";
import { type BudgetLevel, useJourneyStore } from "@/store/useJourneyStore";
import { Button, Pill } from "@/components/ui";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";

type Mode = "choose" | "idea";

type IdeaStoreView = {
  scene: SceneCode;
  companions: string;
  budgetLevel?: BudgetLevel;
  distancePreference?: string;
  cuisineTags: string[];
  moodTags: string[];
  avoidTags: string[];
};

function listText(values: string[]) {
  return values.filter(Boolean).join("、");
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function buildChooseQuery({
  scene,
  companions,
  budgetLevel,
  distancePreference,
  cuisineTags,
  moodTags,
  avoidTags,
}: {
  scene: SceneCode;
  companions: string;
  budgetLevel: BudgetLevel;
  distancePreference?: string;
  cuisineTags: string[];
  moodTags: string[];
  avoidTags: string[];
}) {
  const sceneLabel = labelOf(sceneOptions, scene);
  const companionLabel = labelOf(companionOptions, companions);
  const budgetLabel = labelOf(budgetOptions, budgetLevel);
  const parts = [`想找适合${companionLabel || "今晚"}的${sceneLabel}安排`];

  const cuisine = cuisineTags.filter((tag) => tag !== "不挑");
  if (scene === "eat" && cuisine.length) parts.push(`偏好${listText(cuisine)}`);
  if (distancePreference) parts.push(distancePreference);
  parts.push(`预算${budgetLabel}`);
  if (moodTags.length) parts.push(`希望${listText(moodTags)}`);
  if (avoidTags.length) parts.push(`避开${listText(avoidTags)}`);

  return `${parts.join("，")}。`;
}

function buildIdeaQuery(base: string, store: IdeaStoreView) {
  const additions = [
    `场景${labelOf(sceneOptions, store.scene)}`,
    `同行${labelOf(companionOptions, store.companions)}`,
    `预算${labelOf(budgetOptions, store.budgetLevel)}`,
    store.distancePreference,
    store.cuisineTags.length ? `餐饮偏好${listText(store.cuisineTags)}` : "",
    store.moodTags.length ? `希望${listText(store.moodTags)}` : "",
    store.avoidTags.length ? `避开${listText(store.avoidTags)}` : "",
  ].filter(Boolean);

  return additions.length ? `${base}。补充偏好：${additions.join("，")}。` : base;
}

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
      className={`ios-pressable inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
        active ? "border-brand/20 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/72 text-muted"
      }`}
    >
      {active && <Check size={14} strokeWidth={2.2} />}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function PanelLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="text-[16px] font-semibold text-foreground">{title}</div>
      {hint && <div className="shrink-0 text-[12px] font-medium text-muted">{hint}</div>}
    </div>
  );
}

export default function GenerateClient({ initialMode = "choose" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const store = useJourneyStore();
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const [ideaText, setIdeaText] = useState(store.query || "");
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [sceneCategory, setSceneCategory] = useState<(typeof sceneCategories)[number]>("常用");
  const [showMoreScenes, setShowMoreScenes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const locationHref = `/location?returnTo=${encodeURIComponent(`/generate?mode=${mode}`)}`;
  const locationLabel = formatLocationLabel(store.userLocation);
  const visibleScenes = useMemo(() => {
    const categoryScenes = sceneOptions.filter((scene) => scene.category === sceneCategory);
    if (showMoreScenes || sceneCategory !== "常用") return categoryScenes;
    return categoryScenes.slice(0, 8);
  }, [sceneCategory, showMoreScenes]);

  const understood = useMemo(() => {
    const items = [
      store.scene && `场景：${labelOf(sceneOptions, store.scene)}`,
      store.companions && `同行：${labelOf(companionOptions, store.companions)}`,
      store.budgetLevel && `预算：${labelOf(budgetOptions, store.budgetLevel)}`,
      store.distancePreference && `距离：${store.distancePreference}`,
      store.cuisineTags.length ? `餐饮：${listText(store.cuisineTags)}` : "",
      store.moodTags.length ? `氛围：${listText(store.moodTags)}` : "",
      store.avoidTags.length ? `避开：${listText(store.avoidTags)}` : "",
    ].filter(Boolean);
    return items as string[];
  }, [
    store.avoidTags,
    store.budgetLevel,
    store.companions,
    store.cuisineTags,
    store.distancePreference,
    store.moodTags,
    store.scene,
  ]);

  const missing = useMemo(() => {
    const items = [];
    if (!store.scene) items.push("场景");
    if (!store.companions) items.push("同行人");
    if (!store.budgetLevel) items.push("预算");
    if (!store.distancePreference) items.push("距离偏好");
    if (!store.moodTags.length) items.push("氛围");
    return items;
  }, [store.budgetLevel, store.companions, store.distancePreference, store.moodTags.length, store.scene]);

  function switchMode(nextMode: Mode) {
    setError("");
    setMode(nextMode);
    router.replace(`/generate?mode=${nextMode}`, { scroll: false });
  }

  function toggleTag(type: "moodTags" | "avoidTags" | "cuisineTags", tag: string) {
    const current = store[type];
    const next = current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag];
    store.setDraft({ [type]: next });
  }

  function applyParsedIntent(text = ideaText) {
    const parsed = parseIntentFromText(text);
    setParsedIntent(parsed);
    store.setDraft({
      ...(parsed.scene ? { scene: parsed.scene } : {}),
      ...(parsed.companions ? { companions: parsed.companions } : {}),
      ...(parsed.budgetLevel ? { budgetLevel: parsed.budgetLevel, budget: parsed.budget ?? budgetValue(parsed.budgetLevel) } : {}),
      ...(parsed.distancePreference ? { distancePreference: parsed.distancePreference } : {}),
      ...(parsed.cuisineTags.length ? { cuisineTags: parsed.cuisineTags } : {}),
      ...(parsed.moodTags.length ? { moodTags: unique([...store.moodTags, ...parsed.moodTags]) } : {}),
      ...(parsed.avoidTags.length ? { avoidTags: unique([...store.avoidTags, ...parsed.avoidTags]) } : {}),
      query: text,
    });
  }

  function buildRequest(finalQuery: string, patch: Partial<GenerateRequest> = {}): GenerateRequest {
    return {
      ...store.toRequest(),
      ...patch,
      query: finalQuery,
      budget: patch.budget ?? store.budget,
      moodTags: patch.moodTags ?? store.moodTags,
      avoidTags: patch.avoidTags ?? store.avoidTags,
    };
  }

  async function submit() {
    if (mode === "idea" && !ideaText.trim()) {
      setError("先说说今晚的想法，我再帮你整理成偏好。");
      ideaRef.current?.focus();
      return;
    }

    if (mode === "idea" && !parsedIntent) {
      applyParsedIntent();
      setError("我先理解了一下，你确认或补选后再生成。");
      return;
    }

    const budgetLevel = store.budgetLevel || "balanced";
    const budget = budgetValue(budgetLevel);
    const finalQuery =
      mode === "choose"
        ? buildChooseQuery({
            scene: store.scene,
            companions: store.companions,
            budgetLevel,
            distancePreference: store.distancePreference,
            cuisineTags: store.cuisineTags,
            moodTags: store.moodTags,
            avoidTags: store.avoidTags,
          })
        : buildIdeaQuery(ideaText.trim(), store);

    const request = buildRequest(finalQuery, {
      budget,
      moodTags: unique([...store.moodTags, ...(store.distancePreference ? [store.distancePreference] : [])]),
      avoidTags: store.avoidTags,
    });

    store.setDraft({ query: finalQuery, budget, budgetLevel });
    setLoading(true);
    setError("");
    try {
      const result = await generateRecommendations(request);
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
          <Link href={locationHref} aria-label="修改位置">
            <Pill className="min-h-[40px] max-w-[190px] bg-white/62 text-foreground">
              <MapPin size={14} strokeWidth={1.8} />
              <span className="truncate">{locationLabel}</span>
              <ChevronRight size={13} strokeWidth={1.8} />
            </Pill>
          </Link>
        }
      />

      <SectionTitle
        className="mt-7"
        eyebrow="今晚偏好"
        title={mode === "choose" ? "点几下，我来安排" : "先说想法，再确认"}
        description={mode === "choose" ? "不用写长句，选到差不多就可以生成。" : "我会先理解你的表达，再让你补齐关键偏好。"}
      />

      <div className="mt-5 rounded-full border border-black/[0.06] bg-white/68 p-1">
        <div className="grid grid-cols-2 gap-1">
          {([
            ["choose", "帮我选"],
            ["idea", "我有想法"],
          ] as const).map(([itemMode, label]) => {
            const active = mode === itemMode;
            return (
              <button
                key={itemMode}
                type="button"
                onClick={() => switchMode(itemMode)}
                aria-pressed={active}
                className={`ios-pressable h-10 rounded-full text-[14px] font-semibold ${
                  active ? "bg-[linear-gradient(180deg,#e65b61,#d94a4a)] text-white shadow-[0_8px_18px_rgba(217,74,74,0.16)]" : "text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 pb-40">
        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="位置" hint={store.userLocation.source === "geolocation" ? "来自定位" : "可修改"} />
          <Link
            href={locationHref}
            className="ios-pressable mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-black/[0.06] bg-[#faf8f5] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                <MapPin size={15} strokeWidth={1.8} />
                <span className="min-w-0 truncate">{locationLabel}</span>
              </span>
              {store.userLocation.address && (
                <span className="mt-1 block truncate text-[12px] font-medium text-muted">{store.userLocation.address}</span>
              )}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/72 px-3 py-1.5 text-[12px] font-semibold text-foreground">
              修改
              <ChevronRight size={13} />
            </span>
          </Link>
        </GlassPanel>

        {mode === "idea" && (
          <GlassPanel className="rounded-[20px] p-3.5">
            <PanelLabel title="一句想法" hint="先理解，再生成" />
            <textarea
              ref={ideaRef}
              value={ideaText}
              onChange={(event) => {
                setIdeaText(event.target.value);
                setParsedIntent(null);
                setError("");
              }}
              maxLength={200}
              aria-invalid={Boolean(error && !ideaText.trim())}
              className="mt-3 min-h-[106px] w-full resize-none rounded-[16px] border border-black/[0.07] bg-[#faf8f5] px-4 py-3 text-[15px] font-medium leading-6 text-foreground outline-none placeholder:text-muted/70"
              placeholder="比如：今晚想和朋友吃火锅，不想排队太久，最好离我近一点"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => applyParsedIntent()}
                className="ios-pressable inline-flex min-h-10 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/78 px-4 text-[13px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_8px_18px_rgba(30,22,14,0.055)]"
              >
                <Sparkles size={15} />
                理解一下
              </button>
              <span className="text-[12px] font-medium text-muted">识别后还能继续改</span>
            </div>
          </GlassPanel>
        )}

        {mode === "idea" && (parsedIntent || understood.length > 0) && (
          <GlassPanel className="rounded-[20px] p-3.5">
            <PanelLabel title="已理解" hint={missing.length ? `未选：${missing.join("、")}` : "偏好完整"} />
            <div className="mt-3 flex flex-wrap gap-2">
              {understood.map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-8 items-center rounded-full border border-brand/15 bg-brand-soft px-3 text-[12px] font-semibold text-brand"
                >
                  {item}
                </span>
              ))}
            </div>
          </GlassPanel>
        )}

        <GlassPanel className="rounded-[20px] p-3.5">
          <PanelLabel title="场景" hint={mode === "choose" ? "先定今晚方向" : "可修正识别结果"} />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sceneCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSceneCategory(category);
                  setShowMoreScenes(category !== "常用");
                }}
                aria-pressed={sceneCategory === category}
                className={`ios-pressable inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] ${
                  sceneCategory === category ? "border-brand/20 bg-brand-soft text-brand" : "border-black/[0.07] bg-white/72 text-muted"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {visibleScenes.map((scene) => {
              const active = store.scene === scene.value;
              return (
                <button
                  key={scene.value}
                  type="button"
                  onClick={() => store.setDraft({ scene: scene.value })}
                  aria-pressed={active}
                  className={`ios-pressable min-h-[72px] rounded-[18px] border p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] ${
                    active ? "border-brand/22 bg-brand-soft/70 text-foreground" : "border-black/[0.06] bg-white/62 text-muted"
                  }`}
                >
                  <span className="flex items-center justify-between text-[15px] font-[700]">
                    {scene.label}
                    {active && <Check size={15} className="text-brand" />}
                  </span>
                  <span className="mt-1 block text-[12px] leading-5">{scene.prompt}</span>
                </button>
              );
            })}
          </div>
          {sceneCategory === "常用" && sceneOptions.filter((scene) => scene.category === "常用").length > 8 && (
            <button
              type="button"
              onClick={() => setShowMoreScenes((value) => !value)}
              className="ios-pressable mt-3 min-h-10 w-full rounded-full border border-black/[0.07] bg-white/78 px-4 text-[13px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_18px_rgba(30,22,14,0.05)]"
            >
              {showMoreScenes ? "收起常用场景" : "展开更多常用场景"}
            </button>
          )}
        </GlassPanel>

        <OptionPanel title="同行人">
          {companionOptions.map((item) => (
            <OptionButton
              key={item.value}
              active={store.companions === item.value}
              onClick={() => store.setDraft({ companions: item.value })}
            >
              {item.label}
            </OptionButton>
          ))}
        </OptionPanel>

        <OptionPanel title="预算" hint={`人均约 ¥${budgetValue(store.budgetLevel || "balanced")}`}>
          {budgetOptions.map((item) => (
            <OptionButton
              key={item.value}
              active={(store.budgetLevel || "balanced") === item.value}
              onClick={() => store.setDraft({ budgetLevel: item.value, budget: item.amount })}
            >
              {item.label}
            </OptionButton>
          ))}
        </OptionPanel>

        <OptionPanel title="距离偏好">
          {distanceOptions.map((item) => (
            <OptionButton
              key={item}
              active={store.distancePreference === item}
              onClick={() => store.setDraft({ distancePreference: item })}
            >
              {item}
            </OptionButton>
          ))}
        </OptionPanel>

        {store.scene === "eat" && (
          <OptionPanel title="餐饮偏好" hint="吃饭场景可选">
            {cuisineOptions.map((item) => (
              <OptionButton key={item} active={store.cuisineTags.includes(item)} onClick={() => toggleTag("cuisineTags", item)}>
                {item}
              </OptionButton>
            ))}
          </OptionPanel>
        )}

        <OptionPanel title="氛围" hint="选 2-3 个最贴近的词">
          {moodOptions.map((tag) => (
            <OptionButton key={tag} active={store.moodTags.includes(tag)} onClick={() => toggleTag("moodTags", tag)}>
              {tag}
            </OptionButton>
          ))}
        </OptionPanel>

        <OptionPanel title="避雷">
          {avoidOptions.map((tag) => (
            <OptionButton key={tag} active={store.avoidTags.includes(tag)} onClick={() => toggleTag("avoidTags", tag)}>
              {tag}
            </OptionButton>
          ))}
        </OptionPanel>
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
              {loading ? "正在生成路线" : mode === "choose" ? "按这些偏好生成" : "确认并生成"}
            </span>
            <span className="max-w-[120px] truncate text-sm text-white/78">{locationLabel}</span>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

function OptionPanel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <GlassPanel className="rounded-[20px] p-3.5">
      <PanelLabel title={title} hint={hint} />
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </GlassPanel>
  );
}

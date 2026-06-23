"use client";

import { Check, Clock3, Copy, Heart, MapPin, Navigation, Route, ThumbsUp, WalletCards, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { createShare, submitFeedback } from "@/lib/api";
import { isFavoritePlan, removeFavoritePlan, saveFavoritePlan } from "@/lib/favorites";
import type { FeedbackType, RecommendationPlan, RecommendationResponse } from "@/lib/types";
import { Button, Pill } from "./ui";
import { MapPreview } from "./map-preview";

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}

export function PlanCard({
  plan,
  result,
  removable = false,
  onRemove,
}: {
  plan: RecommendationPlan;
  result: RecommendationResponse;
  removable?: boolean;
  onRemove?: (planId: string) => void;
}) {
  const [saved, setSaved] = useState(() => (typeof window === "undefined" ? false : isFavoritePlan(plan.id)));
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [manualShareUrl, setManualShareUrl] = useState("");

  async function savePlan() {
    try {
      saveFavoritePlan(plan);
      setSaved(true);
      setActionMessage("已保存到本地收藏。");
    } catch {
      setActionMessage("收藏失败，请检查浏览器本地存储权限。");
    }
  }

  function removePlan() {
    try {
      removeFavoritePlan(plan.id);
      setSaved(false);
      setActionMessage("已取消收藏。");
      onRemove?.(plan.id);
    } catch {
      setActionMessage("取消收藏失败，请稍后再试。");
    }
  }

  async function sharePlan() {
    setActionMessage("");
    setManualShareUrl("");
    try {
      const share = await createShare({ ...result, plans: [plan] });
      if (!navigator.clipboard) {
        setManualShareUrl(share.url);
        setActionMessage("浏览器不支持自动复制，可手动复制下方链接。");
        return;
      }
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setActionMessage("分享链接已复制。");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setActionMessage("分享服务暂不可用，请稍后重试。");
    }
  }

  async function sendFeedback(type: FeedbackType) {
    setActionMessage("");
    try {
      await submitFeedback({ recordId: result.recordId, planId: plan.id, type });
      setFeedback(type);
      setActionMessage("反馈已收到，会用于后续推荐优化。");
    } catch {
      setActionMessage("反馈提交失败，请稍后再试。");
    }
  }

  const firstStop = plan.stops[0]?.poi;

  return (
    <section className="rounded-[20px] border border-black/[0.07] bg-card p-3 shadow-[0_10px_26px_rgba(30,22,14,0.065)]">
      <div className="p-1">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {plan.tags.map((tag) => (
            <Pill key={tag} className="px-2.5 py-1 text-[11px]">
              #{tag}
            </Pill>
          ))}
        </div>

        <h2 className="text-[24px] font-[700] leading-[1.15] tracking-normal text-foreground">{plan.title}</h2>
        <p className="mt-2 text-[14px] leading-[22px] text-muted">{plan.summary}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric icon={WalletCards} label="人均" value={`¥${plan.budgetPerPerson}`} />
          <Metric icon={Route} label="距离" value={formatDistance(plan.totalDistanceMeters)} />
          <Metric icon={Clock3} label="时间" value={`${Math.round(plan.totalDurationMinutes / 60)}h`} />
        </div>
      </div>

      <div className="mt-3">
        <MapPreview plan={plan} />
      </div>

      <div className="mt-3 space-y-2">
        {plan.stops.map((stop, index) => (
          <div key={stop.poi.id} className="relative overflow-hidden rounded-[18px] border border-black/[0.06] bg-[#fffaf6] p-3.5">
            {index < plan.stops.length - 1 && <div className="absolute left-[27px] top-12 h-full w-px bg-black/[0.08]" />}
            <div className="grid grid-cols-[30px_minmax(0,1fr)] gap-3">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-bold text-brand ring-1 ring-black/[0.06]">
                {String(stop.order).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-semibold text-foreground">{stop.poi.name}</h3>
                    <p className="mt-1 text-[12px] font-medium text-muted">
                      {stop.poi.category} · {formatDistance(stop.poi.distanceMeters)} · {stop.poi.avgPrice === 0 ? "免费" : `¥${stop.poi.avgPrice}`}
                    </p>
                  </div>
                  <a
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-black/[0.07] bg-white/72 px-2.5 text-[12px] font-semibold text-brand"
                    href={`https://uri.amap.com/search?keyword=${encodeURIComponent(stop.poi.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={13} />
                    导航
                  </a>
                </div>

                <p className="mt-2 text-[13px] leading-[21px] text-foreground">{stop.reason}</p>
                <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-5 text-muted">
                  <MapPin className="mt-0.5 shrink-0 text-muted" size={13} />
                  {stop.poi.address}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stop.poi.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/[0.05]">
                      {tag}
                    </span>
                  ))}
                </div>

                {(stop.riskTip || plan.riskTips[0]) && (
                  <p className="mt-2 rounded-[14px] bg-brand-soft px-3 py-2 text-[12px] leading-5 text-warning">
                    {stop.riskTip ?? plan.riskTips[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 rounded-[16px] border border-black/[0.06] bg-[#fffaf6] p-2">
        {(["like", "too_far", "too_expensive", "inaccurate", "closed"] as FeedbackType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => sendFeedback(type)}
            aria-pressed={feedback === type}
            className={`rounded-full px-3 py-2 text-[12px] font-semibold transition ${
              feedback === type ? "bg-brand text-white" : "bg-white/70 text-muted hover:text-foreground"
            }`}
          >
            {type === "like" && "喜欢"}
            {type === "too_far" && "太远"}
            {type === "too_expensive" && "太贵"}
            {type === "inaccurate" && "不准"}
            {type === "closed" && "已关门"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          onClick={removable && saved ? removePlan : savePlan}
          variant={saved ? "secondary" : "primary"}
          className="min-h-[48px] px-3 text-[14px]"
          aria-label={removable && saved ? "取消收藏路线" : "收藏路线到本地"}
        >
          {saved ? <Check size={16} /> : <Heart size={16} />}
          {removable && saved ? "取消收藏" : saved ? "已收藏" : "本地收藏"}
        </Button>
        <Button onClick={sharePlan} variant="secondary" className="min-h-[48px] px-3 text-[14px]" aria-label="分享路线">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "已复制" : "分享路线"}
        </Button>
        <Button
          variant="ghost"
          className="col-span-2 min-h-[44px] px-3 text-[14px]"
          aria-label="打开第一站导航"
          onClick={() => firstStop && window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(firstStop.name)}`, "_blank")}
        >
          <ThumbsUp size={16} />
          先去第一站
        </Button>
      </div>

      {actionMessage && (
        <div
          className={`mt-3 rounded-[18px] px-3 py-2 text-[12px] font-semibold leading-5 ${
            actionMessage.includes("失败") || actionMessage.includes("不可用")
              ? "bg-[#fff3ef] text-warning"
              : "bg-white/58 text-brand"
          }`}
        >
          {actionMessage}
          {manualShareUrl && (
            <div className="mt-2 overflow-x-auto rounded-[14px] bg-white/70 px-2 py-1.5 text-[11px] text-muted">
              {manualShareUrl}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 rounded-[16px] border border-black/[0.06] bg-white/54 px-3.5 py-3 text-[12px] font-medium leading-5 text-muted">
        AI 只负责路线文案、理由和风险提示；地点来自地图 API 或自建 POI 候选库。
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-black/[0.06] bg-[#fffaf6] px-3 py-2.5">
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
        <Icon size={13} strokeWidth={1.8} />
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

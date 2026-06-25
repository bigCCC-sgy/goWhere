"use client";

/* eslint-disable @next/next/no-img-element */

import { Check, Clock3, Copy, ExternalLink, Heart, ImageIcon, MapPin, Navigation, Phone, Route, Search, Star, ThumbsUp, WalletCards, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { createShare, submitFeedback } from "@/lib/api";
import { isFavoritePlan, removeFavoritePlan, saveFavoritePlan } from "@/lib/favorites";
import type { FeedbackType, PlanStop, Poi, RecommendationPlan, RecommendationResponse } from "@/lib/types";
import { Button, Pill } from "./ui";
import { MapPreview } from "./map-preview";

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}

function amapUrl(poi: Poi) {
  return poi.amapUri || `https://uri.amap.com/search?keyword=${encodeURIComponent(`${poi.name} ${poi.city}`)}`;
}

function reviewKeyword(poi: Poi) {
  return `${poi.name} ${poi.city || ""} 测评`.trim();
}

function validPhotoUrls(poi: Poi) {
  return Array.from(new Set((poi.photoUrls ?? []).filter((url) => /^https?:\/\//i.test(url.trim())))).slice(0, 5);
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
  const [detailStop, setDetailStop] = useState<PlanStop | null>(null);

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

  function openReview(poi: Poi) {
    const keyword = encodeURIComponent(reviewKeyword(poi));
    const appUrl = `xhsdiscover://search/result?keyword=${keyword}`;
    const webUrl = `https://www.xiaohongshu.com/search_result?keyword=${keyword}`;
    try {
      window.open(appUrl, "_self");
      window.setTimeout(() => window.open(webUrl, "_blank", "noopener,noreferrer"), 800);
      setActionMessage("正在尝试打开小红书测评，若未拉起会打开网页搜索。");
    } catch {
      window.open(webUrl, "_blank", "noopener,noreferrer");
      setActionMessage("已打开小红书网页搜索。");
    }
  }

  const firstStop = plan.stops[0]?.poi;

  return (
    <section className="max-w-full overflow-hidden rounded-[20px] border border-black/[0.07] bg-card p-3 shadow-[0_10px_26px_rgba(30,22,14,0.065)]">
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
          <div key={stop.poi.id} className="relative overflow-hidden rounded-[18px] border border-black/[0.06] bg-[#fffaf6]">
            <div className="relative p-3.5">
            {index < plan.stops.length - 1 && <div className="absolute left-[27px] top-12 h-full w-px bg-black/[0.08]" />}
            <div className="grid grid-cols-[30px_minmax(0,1fr)] gap-3">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-bold text-brand ring-1 ring-black/[0.06]">
                {String(stop.order).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDetailStop(stop)}
                      className="block max-w-full truncate text-left text-[17px] font-semibold text-foreground underline-offset-4 hover:underline"
                    >
                      {stop.poi.name}
                    </button>
                    <p className="mt-1 text-[12px] font-medium text-muted">
                      {stop.poi.category} · {formatDistance(stop.poi.distanceMeters)} · {stop.poi.avgPrice === 0 ? "免费" : `¥${stop.poi.avgPrice}`}
                    </p>
                  </div>
                  <a
                    className="ios-pressable inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-black/[0.07] bg-white/78 px-2.5 text-[12px] font-semibold text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                    href={amapUrl(stop.poi)}
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

                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailStop(stop)}
                    className="ios-pressable inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-black/[0.06] bg-white/78 px-2 text-[12px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(30,22,14,0.045)]"
                  >
                    <ExternalLink size={13} />
                    详情
                  </button>
                  <a
                    href={amapUrl(stop.poi)}
                    target="_blank"
                    rel="noreferrer"
                    className="ios-pressable inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-black/[0.06] bg-white/78 px-2 text-[12px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(30,22,14,0.045)]"
                  >
                    <Navigation size={13} />
                    导航
                  </a>
                </div>
              </div>
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
            className={`ios-pressable rounded-full border px-3 py-2 text-[12px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] ${
              feedback === type ? "border-brand/20 bg-brand-soft text-brand" : "border-black/[0.05] bg-white/72 text-muted hover:text-foreground"
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
          onClick={() => firstStop && window.open(amapUrl(firstStop), "_blank", "noopener,noreferrer")}
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

      {detailStop && <PoiDetailDrawer stop={detailStop} onClose={() => setDetailStop(null)} onReview={openReview} />}
    </section>
  );
}

function PoiPhotoGallery({ poi }: { poi: Poi }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const photos = validPhotoUrls(poi).filter((url) => !failedUrls.includes(url));
  const hasSparsePhotos = photos.length > 0 && photos.length < 3;

  function markFailed(url: string) {
    setFailedUrls((current) => (current.includes(url) ? current : [...current, url]));
  }

  if (!photos.length) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-white/70 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(135deg,#fff6ed,#eadfce)]">
        <div className="flex h-[176px] flex-col items-center justify-center px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/70 bg-white/50 text-[#a58a73] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
            <ImageIcon size={22} strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-[#6f6257]">暂无可展示的真实实拍图</p>
          <a
            href={amapUrl(poi)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-8 items-center rounded-full border border-black/[0.06] bg-white/70 px-3 text-[12px] font-semibold text-brand"
          >
            查看地图商家页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex snap-x gap-2 overflow-x-auto rounded-[20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((photo, index) => (
          <div
            key={photo}
            className={`relative shrink-0 snap-start overflow-hidden rounded-[18px] ${
              photos.length >= 3 ? "h-[154px] w-[78%]" : "h-[174px] w-full"
            }`}
          >
            <img
              src={photo}
              alt={`${poi.name} 实拍图 ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => markFailed(photo)}
            />
            <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-[11px] font-semibold text-[#6f6257] backdrop-blur-md">
              实拍 {index + 1}/{photos.length}
            </div>
          </div>
        ))}
      </div>
      {hasSparsePhotos && (
        <p className="mt-2 rounded-[14px] bg-white/62 px-3 py-2 text-[12px] font-medium leading-5 text-muted">
          实拍图片较少，环境和营业状态请以地图商家页为准。
        </p>
      )}
    </div>
  );
}

function PoiDetailDrawer({
  stop,
  onClose,
  onReview,
}: {
  stop: PlanStop;
  onClose: () => void;
  onReview: (poi: Poi) => void;
}) {
  const poi = stop.poi;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/24 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[72px] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[calc(100dvh-72px)] w-full max-w-[390px] flex-col overflow-hidden rounded-[26px] border border-white/72 bg-[#faf8f5] shadow-[0_18px_44px_rgba(30,22,14,0.22)]">
        <div className="shrink-0 px-3 pb-2 pt-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-[13px] font-semibold text-muted">地点详情</div>
          <button
            type="button"
            onClick={onClose}
            className="ios-pressable inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-white/72 text-foreground"
            aria-label="关闭地点详情"
          >
            <X size={17} />
          </button>
        </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <PoiPhotoGallery poi={poi} />
        <div className="px-1 pb-2 pt-4">
          <h3 className="text-[22px] font-[750] leading-[1.15] text-foreground">{poi.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill className="text-[11px]">{poi.category}</Pill>
            {poi.rating && (
              <Pill className="text-[11px]">
                <Star size={12} className="fill-brand text-brand" />
                {poi.rating.toFixed(1)}
              </Pill>
            )}
            <Pill className="text-[11px]">{poi.avgPrice === 0 ? "免费/价格待确认" : `人均 ¥${poi.avgPrice}`}</Pill>
            <Pill className="text-[11px]">{formatDistance(poi.distanceMeters)}</Pill>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-foreground">{stop.reason}</p>
          {(stop.riskTip || poi.openingHours) && (
            <p className="mt-3 rounded-[16px] bg-white/62 px-3 py-2 text-[12px] font-medium leading-5 text-muted">
              {stop.riskTip || `营业信息：${poi.openingHours}`}
            </p>
          )}
          <div className="mt-3 space-y-2 text-[12px] font-medium leading-5 text-muted">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 shrink-0" size={14} />
              <span>{poi.address || "地址以地图为准"}</span>
            </p>
            {poi.phone && (
              <p className="flex gap-2">
                <Phone className="mt-0.5 shrink-0" size={14} />
                <span>{poi.phone}</span>
              </p>
            )}
            {poi.businessArea && <p>商圈：{poi.businessArea}</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {poi.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/[0.05]">
                {tag}
              </span>
            ))}
          </div>
          {poi.detailUrl && (
            <a href={poi.detailUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-[12px] font-semibold text-brand">
              查看商家页面
            </a>
          )}
        </div>
        </div>
        <div className="sticky bottom-0 shrink-0 border-t border-black/[0.06] bg-[#faf8f5]/92 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-2">
          <a
            href={amapUrl(poi)}
            target="_blank"
            rel="noreferrer"
            className="ios-pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(180deg,#2b2926,#171717)] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(30,22,14,0.16)]"
          >
            <Navigation size={15} />
            导航
          </a>
          <button
            type="button"
            onClick={() => onReview(poi)}
            className="ios-pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-brand/12 bg-brand-soft px-4 text-[13px] font-semibold text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]"
          >
            <Search size={15} />
            看测评
          </button>
          </div>
        </div>
      </div>
    </div>
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

"use client";

import { Bookmark, Compass, Heart, MapPin, Route, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  getFavoritePlansSnapshot,
  getServerFavoritePlansSnapshot,
  removeFavoritePlan,
  subscribeFavoritePlans,
} from "@/lib/favorites";
import type { RecommendationPlan, RecommendationResponse } from "@/lib/types";
import { Button, Pill } from "@/components/ui";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";
import { PlanCard } from "@/components/plan-card";

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}

function routeSummary(plan: RecommendationPlan) {
  const first = plan.stops[0]?.poi.name;
  const last = plan.stops.at(-1)?.poi.name;
  if (!first) return "路线地点待确认";
  if (!last || first === last) return first;
  return `${first} → ${last}${plan.stops.length > 2 ? ` · 共 ${plan.stops.length} 站` : ""}`;
}

export default function FavoritesPage() {
  const plans = useSyncExternalStore(
    subscribeFavoritePlans,
    getFavoritePlansSnapshot,
    getServerFavoritePlansSnapshot,
  );
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  function removePlan(planId: string) {
    removeFavoritePlan(planId);
    setExpandedPlanId((expanded) => (expanded === planId ? null : expanded));
  }

  function togglePlan(planId: string) {
    setExpandedPlanId((current) => {
      const next = current === planId ? null : planId;
      if (next) {
        window.setTimeout(() => {
          document.getElementById(`favorite-route-${next}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      }
      return next;
    });
  }

  function favoriteResult(plan: RecommendationPlan): RecommendationResponse {
    return {
      recordId: "local-favorites",
      requestSummary: "本地收藏的路线",
      aiNotice: "这些路线保存在当前浏览器里，不需要登录。地点信息仍建议出发前以地图和现场为准。",
      plans: [plan],
    };
  }

  return (
    <MobileShell activeDock="favorites">
      <TopBackLink
        href="/"
        label="返回首页"
        right={
          <Pill className="min-h-[40px] bg-white/62 text-foreground">
            <Heart size={14} strokeWidth={1.8} />
            {plans.length} 条
          </Pill>
        }
      />

      <SectionTitle
        className="mt-8"
        eyebrow="本地收藏"
        title="把喜欢的路线先放这里"
        description="收藏只保存在当前浏览器。适合把今晚想走的路线先存起来，临出门前再做一次确认。"
      />

      {plans.length === 0 ? (
        <GlassPanel className="mt-6 flex min-h-[260px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/[0.07] bg-white/72 text-brand shadow-[0_10px_24px_rgba(30,22,14,0.06)]">
            <Bookmark size={25} strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-[22px] font-semibold text-foreground">还没有收藏路线</h2>
          <p className="mt-2 max-w-[260px] text-[13px] leading-6 text-muted">
            生成推荐后，点路线卡片里的“本地收藏”，它就会出现在这里。
          </p>
          <Link href="/generate" className="mt-6 block w-full">
            <Button className="min-h-[50px] w-full">
              <Compass size={17} />
              去生成路线
            </Button>
          </Link>
        </GlassPanel>
      ) : (
        <>
          <div className="mt-5 grid gap-2.5">
            {plans.map((plan) => {
              const active = expandedPlanId === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`max-w-full overflow-hidden rounded-[20px] border p-3.5 shadow-[0_8px_22px_rgba(30,22,14,0.05)] transition ${
                    active ? "border-brand/24 bg-white/82" : "border-black/[0.06] bg-white/58"
                  }`}
                >
                  <button type="button" onClick={() => togglePlan(plan.id)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          {plan.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-cream/90 px-2 py-1 text-[11px] font-semibold text-warm">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-[18px] font-semibold leading-6 text-foreground">{plan.title}</h2>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/70 bg-white/62 px-2.5 py-1 text-[11px] font-semibold text-brand">
                        {active ? "已展开" : "收藏"}
                      </span>
                    </div>

                    <div className="mt-3 flex min-w-0 items-start gap-2 rounded-[16px] border border-black/[0.04] bg-white/56 px-3 py-2 text-[12px] font-semibold leading-5 text-muted">
                      <Route className="mt-0.5 shrink-0 text-brand" size={14} />
                      <span className="line-clamp-2 min-w-0">{routeSummary(plan)}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold text-foreground">
                      <span className="truncate rounded-full bg-white/62 px-2 py-1.5">¥{plan.budgetPerPerson}</span>
                      <span className="truncate rounded-full bg-white/62 px-2 py-1.5">{formatDistance(plan.totalDistanceMeters)}</span>
                      <span className="truncate rounded-full bg-white/62 px-2 py-1.5">{Math.round(plan.totalDurationMinutes / 60)}h</span>
                    </div>
                  </button>

                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Button onClick={() => togglePlan(plan.id)} variant={active ? "primary" : "secondary"} className="min-h-[42px] min-w-0 px-3 text-[13px]">
                      <Route size={15} />
                      {active ? "收起路线" : "展开路线"}
                    </Button>
                    <Button onClick={() => removePlan(plan.id)} variant="secondary" className="min-h-[42px] px-3 text-[13px] text-warning">
                      <Trash2 size={15} />
                      取消
                    </Button>
                  </div>

                  {active && (
                    <div id={`favorite-route-${plan.id}`} className="favorite-route-expand mt-3 max-w-full overflow-hidden pb-24">
                      <GlassPanel className="mb-3 flex items-start gap-2 text-[12px] font-medium leading-5 text-brand">
                        <MapPin className="mt-0.5 shrink-0" size={14} />
                        当前展开的是本地收藏快照；取消收藏后会立即从列表移除。
                      </GlassPanel>
                      <PlanCard plan={plan} result={favoriteResult(plan)} removable onRemove={removePlan} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </MobileShell>
  );
}

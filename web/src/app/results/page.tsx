"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { generateRecommendations, getApiErrorMessage } from "@/lib/api";
import type { RecommendationResponse } from "@/lib/types";
import { PlanCard } from "@/components/plan-card";
import { Button, Pill } from "@/components/ui";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";
import { useJourneyStore } from "@/store/useJourneyStore";

export default function ResultsPage() {
  const store = useJourneyStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const result: RecommendationResponse | undefined = store.result;
  const sourceLabel = result?.isFallback
    ? "演示数据"
    : result?.dataSource === "real"
      ? "真实服务"
      : "等待生成";

  async function regenerate() {
    setLoading(true);
    setError("");
    try {
      const data = await generateRecommendations(store.toRequest());
      store.setResult(data);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell activeDock="trips">
      <TopBackLink
        href="/generate"
        label="调整条件"
        right={
          <button
            type="button"
            onClick={regenerate}
            disabled={loading}
            aria-label="重新生成一批路线"
            className="ios-pressable inline-flex min-h-[38px] items-center gap-2 rounded-full border border-black/[0.07] bg-white/78 px-3.5 text-[13px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_8px_18px_rgba(30,22,14,0.055)] disabled:opacity-60"
          >
            <RefreshCw size={15} strokeWidth={1.9} />
            换一批
          </button>
        }
      />

      <div className="mt-7">
        <Pill className="mb-3 bg-white/70 text-muted">
          {sourceLabel}
        </Pill>
        <SectionTitle
          title="今晚可以这样走"
          description={result?.requestSummary ?? "正在整理你的城市路线"}
        />
      </div>

      {loading && (
        <GlassPanel className="mt-8 flex min-h-[220px] flex-col items-center justify-center text-center">
          <Loader2 className="animate-spin text-brand" size={28} />
          <h2 className="mt-4 text-[20px] font-semibold text-foreground">正在生成路线</h2>
          <p className="mt-2 max-w-[260px] text-[13px] leading-6 text-muted">会先确认地点，再整理成适合今晚的走法。</p>
        </GlassPanel>
      )}

      {!loading && !result?.plans.length && (
        <GlassPanel className="mt-8 text-center">
          <h2 className="text-[20px] font-semibold text-foreground">还没有生成行程</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-[13px] leading-6 text-muted">
            从首页说说今晚的状态，或去灵感页补充偏好。
          </p>
          {error && <p className="mt-3 text-[13px] font-medium text-warning">{error}</p>}
          <Link href="/generate" className="mt-5 block">
            <Button className="min-h-[48px] w-full">去生成路线</Button>
          </Link>
        </GlassPanel>
      )}

      {result && result.plans.length > 0 && (
        <div className="mt-5 grid gap-3">
          <div className="flex items-center justify-between gap-2 rounded-[16px] border border-black/[0.06] bg-white/58 px-3 py-2 text-[12px] font-semibold text-muted">
            <span>{result.isFallback ? "演示数据 · 真实服务暂不可用" : "地点已校验 · AI 不新增地点"}</span>
            <span className={result.isFallback ? "text-warning" : "text-brand"}>{sourceLabel}</span>
          </div>
          {error && (
            <div className="rounded-[16px] bg-brand-soft px-3.5 py-3 text-[13px] font-semibold text-warning">
              {error}
            </div>
          )}
          <div className="rounded-[16px] border border-black/[0.06] bg-white/54 px-3.5 py-3 text-[12px] font-medium leading-5 text-muted">
            {result.aiNotice}
          </div>
          {result.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} result={result} />
          ))}
        </div>
      )}
    </MobileShell>
  );
}

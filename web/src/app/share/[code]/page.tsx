import { Gift, Home, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { getShare } from "@/lib/api";
import { PlanCard } from "@/components/plan-card";
import { Button, Pill } from "@/components/ui";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";

export default async function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await getShare(code);

  if (!result) {
    return (
      <MobileShell activeDock="trips">
        <TopBackLink
          href="/"
          label="返回首页"
          right={
            <Pill className="min-h-[40px] bg-white/62 text-foreground">
              <Gift size={14} strokeWidth={1.8} />
              分享
            </Pill>
          }
        />

        <GlassPanel className="mt-8 flex min-h-[320px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/68 text-warning shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_12px_28px_rgba(255,159,10,0.12)]">
            <RefreshCw size={24} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-[26px] font-semibold leading-tight text-foreground">分享已失效</h1>
          <p className="mt-2 max-w-[280px] text-[13px] leading-6 text-muted">
            没有读取到这份路线快照。可能是分享码不存在、服务暂时不可用，或本地进程已重启。
          </p>
          <div className="mt-6 grid w-full grid-cols-2 gap-2">
            <Link href="/">
              <Button variant="secondary" className="w-full">
                <Home size={16} />
                回首页
              </Button>
            </Link>
            <Link href="/generate">
              <Button className="w-full">
                <Sparkles size={16} />
                重新生成
              </Button>
            </Link>
          </div>
        </GlassPanel>
      </MobileShell>
    );
  }

  return (
    <MobileShell activeDock="trips">
      <TopBackLink
        href="/"
        label="返回首页"
        right={
          <Pill className="min-h-[40px] bg-white/62 text-foreground">
            <Gift size={14} strokeWidth={1.8} />
            分享
          </Pill>
        }
      />

      <SectionTitle
        className="mt-8"
        eyebrow={`分享码 ${code}`}
        title="朋友分享给你的城市路线"
        description="这是一份生成时的路线快照。出发前仍建议确认营业时间、价格和排队情况。"
      />

      {result.isFallback && (
        <GlassPanel className="mt-5 border border-warning/20 bg-warning/10 text-[12px] font-semibold leading-5 text-warning">
          当前展示的是演示数据，不代表真实分享内容。
        </GlassPanel>
      )}

      <GlassPanel className="mt-3 flex items-start gap-2 text-[12px] font-medium leading-5 text-brand">
        <Sparkles className="mt-0.5 shrink-0" size={14} />
        {result.aiNotice}
      </GlassPanel>

      <div className="mt-3 grid gap-3">
        {result.plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} result={result} />
        ))}
      </div>
    </MobileShell>
  );
}

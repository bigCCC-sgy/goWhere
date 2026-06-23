import { LocateFixed, ShieldCheck, Sparkles } from "lucide-react";
import { GlassPanel, MobileShell, SectionTitle, TopBackLink } from "@/components/mobile-shell";
import { Pill } from "@/components/ui";

const sections = [
  {
    id: "terms",
    title: "用户协议",
    text: "此刻去哪第一期为游客体验版，提供本地生活路线推荐参考。你应根据实际营业信息、现场情况、交通状态和个人安全判断决定是否前往。请勿使用本产品生成或传播违法、低俗、危险内容。",
  },
  {
    id: "privacy",
    title: "隐私政策",
    text: "第一版仅在你主动选择城市/商圈、输入需求或点击定位时处理必要信息。浏览器精确定位只用于当次推荐，不做持续追踪，不读取通讯录、相册、麦克风、摄像头、人脸或身份证信息。本地收藏保存在你的浏览器 localStorage。",
  },
  {
    id: "ai",
    title: "AI 生成提示",
    text: "AI 只负责生成标题、推荐理由、路线说明和风险提示。所有地点必须来自地图 API 或自建 POI 候选库，后端会校验 AI 输出中的地点 ID，未通过校验的地点不会返回给前端。",
  },
  {
    id: "location",
    title: "定位说明",
    text: "首页不会自动弹出定位授权。只有当你点击“当前位置”后，浏览器才会请求定位。拒绝定位后，你仍可手动输入城市、商圈、地址或地标继续使用。",
  },
];

export default function LegalPage() {
  return (
    <MobileShell activeDock="home">
      <TopBackLink
        href="/"
        label="返回首页"
        right={
          <Pill className="min-h-[40px] bg-white/62 text-foreground">
            <ShieldCheck size={14} strokeWidth={1.8} />
            协议
          </Pill>
        }
      />

      <SectionTitle
        className="mt-8"
        eyebrow="使用前，把边界说清楚"
        title="放心出门，也要知道边界"
        description="我们尽量少收集信息，AI 只写文案，地点必须来自真实候选库。"
      />

      <GlassPanel className="mt-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[22px] border border-white/70 bg-white/56 p-3">
            <Sparkles className="text-brand" size={18} strokeWidth={1.8} />
            <div className="mt-2 text-[15px] font-semibold text-foreground">AI 不造地点</div>
            <p className="mt-1 text-[12px] leading-5 text-muted">文案生成前后都做 POI ID 校验。</p>
          </div>
          <div className="rounded-[22px] border border-white/70 bg-white/56 p-3">
            <LocateFixed className="text-warm" size={18} strokeWidth={1.8} />
            <div className="mt-2 text-[15px] font-semibold text-foreground">定位不打扰</div>
            <p className="mt-1 text-[12px] leading-5 text-muted">主动点击后才请求，仅用于当次推荐。</p>
          </div>
        </div>
      </GlassPanel>

      <div className="mt-3 grid gap-3">
        {sections.map((section, index) => (
          <GlassPanel key={section.id} id={section.id}>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[12px] font-bold text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[18px] font-semibold text-foreground">{section.title}</h2>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-muted">{section.text}</p>
          </GlassPanel>
        ))}
      </div>
    </MobileShell>
  );
}

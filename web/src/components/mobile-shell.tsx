import type { HTMLAttributes, ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Compass,
  Heart,
  Home,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageShell } from "./ui";

type DockKey = "home" | "inspiration" | "favorites" | "trips";

const dockTabs: Array<{ key: DockKey; label: string; Icon: LucideIcon; href?: string }> = [
  { key: "home", label: "首页", Icon: Home, href: "/" },
  { key: "inspiration", label: "灵感", Icon: Compass, href: "/generate?mode=choose" },
  { key: "favorites", label: "收藏", Icon: Heart, href: "/favorites" },
  { key: "trips", label: "行程", Icon: Briefcase, href: "/results" },
];

export function MobileShell({
  children,
  activeDock = "inspiration",
  withDock = true,
  className = "",
}: {
  children: ReactNode;
  activeDock?: DockKey;
  withDock?: boolean;
  className?: string;
}) {
  return (
    <PageShell className={`bg-[#f8f6f3] ${className}`}>
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden px-4 pb-[132px] pt-4 sm:my-6 sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:border sm:border-black/[0.06] sm:bg-[#faf8f5]/80">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#faf8f5_0%,#f7f3ef_100%)]" />
        <div className="relative z-10">{children}</div>
      </div>
      {withDock && <BottomDock active={activeDock} />}
    </PageShell>
  );
}

export function TopBackLink({
  href,
  label,
  right,
}: {
  href: string;
  label: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-black/[0.07] bg-white/72 px-3.5 text-[13px] font-semibold text-foreground transition active:scale-[0.98]"
        href={href}
      >
        <ArrowLeft size={16} strokeWidth={1.9} />
        {label}
      </Link>
      {right}
    </header>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && <div className="text-[13px] font-semibold text-muted">{eyebrow}</div>}
      <h1 className="mt-1 text-[30px] font-[650] leading-[1.1] tracking-normal text-foreground">{title}</h1>
      {description && <p className="mt-2 text-[14px] leading-[22px] text-muted">{description}</p>}
    </div>
  );
}

export function GlassPanel({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`panel-glass rounded-[20px] p-3 ${className}`} {...props}>
      {children}
    </section>
  );
}

export function BottomDock({ active }: { active: DockKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto w-[min(348px,calc(100%_-_28px))]">
      <div className="dock-glass relative grid grid-cols-4 rounded-[24px] px-2 py-1.5">
        {dockTabs.map((item) => {
          const Icon = item.Icon;
          const isActive = item.key === active;
          const content = (
            <>
              <Icon
                className={`relative z-10 transition-transform duration-200 ease-out ${isActive ? "-translate-y-0.5 scale-[1.06]" : ""}`}
                size={21}
                strokeWidth={isActive ? 2.15 : 1.8}
              />
              <span className="relative z-10 leading-none">{item.label}</span>
            </>
          );

          const className = `ios-tab relative flex h-[49px] min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] text-[12px] ${
            isActive ? "ios-tab-active font-semibold" : "font-medium text-muted"
          }`;

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${isActive ? "当前页面：" : ""}${item.label}`}
                className={className}
              >
                {content}
              </Link>
            );
          }

          return (
            <button key={item.key} type="button" aria-current={isActive ? "page" : undefined} aria-label={item.label} className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

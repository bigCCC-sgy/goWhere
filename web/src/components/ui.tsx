import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`min-h-screen overflow-hidden bg-background text-foreground ${className}`}>{children}</main>;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`rounded-[20px] border border-black/[0.07] bg-card shadow-soft ${className}`} {...props}>
      {children}
    </section>
  );
}

export function Pill({ children, active = false, className = "" }: { children: ReactNode; active?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
        active
          ? "border border-brand/15 bg-brand text-white"
          : "border border-black/[0.07] bg-white/72 text-muted"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const variants = {
    primary:
      "bg-brand text-white shadow-[0_10px_22px_rgba(217,74,74,0.16)] hover:bg-warm",
    secondary:
      "border border-black/[0.07] bg-white/76 text-foreground shadow-[0_6px_16px_rgba(30,22,14,0.045)] hover:bg-white",
    ghost: "bg-transparent text-muted hover:bg-black/[0.04] hover:text-foreground",
  };

  return (
    <button
      className={`ios-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

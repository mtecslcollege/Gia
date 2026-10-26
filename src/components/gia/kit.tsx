import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { initials } from "@/lib/mock";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-primary">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ icon: Icon, label, value, hint, tone = "navy" }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: "navy" | "gold" | "green" | "red" }) {
  const tones = {
    navy: "bg-info-soft text-primary",
    gold: "bg-gold-soft text-warning",
    green: "bg-success-soft text-success",
    red: "bg-destructive-soft text-destructive",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-xl font-bold text-foreground">{value}</div>
        {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

const statusTone: Record<string, string> = {
  Active: "bg-success-soft text-success", Completed: "bg-success-soft text-success", Approved: "bg-success-soft text-success",
  Published: "bg-success-soft text-success", Issued: "bg-success-soft text-success", Present: "bg-success-soft text-success",
  Pending: "bg-warning-soft text-warning", "Pending Approval": "bg-warning-soft text-warning", "Under Review": "bg-warning-soft text-warning",
  Interview: "bg-info-soft text-primary", Submitted: "bg-info-soft text-primary", Draft: "bg-muted text-muted-foreground",
  Template: "bg-muted text-muted-foreground", Archived: "bg-muted text-muted-foreground", Inactive: "bg-muted text-muted-foreground",
  Rejected: "bg-destructive-soft text-destructive", Returned: "bg-destructive-soft text-destructive", Reversed: "bg-destructive-soft text-destructive",
  High: "bg-destructive-soft text-destructive", Normal: "bg-info-soft text-primary", Low: "bg-muted text-muted-foreground",
};

export function Status({ value }: { value: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[value] ?? "bg-muted text-muted-foreground"}`}>{value}</span>;
}

export function Avatar({ name, size = "h-9 w-9 text-xs" }: { name: string; size?: string }) {
  return <div className={`grid shrink-0 place-items-center rounded-full bg-primary font-bold text-gold ${size}`}>{initials(name)}</div>;
}

export function Bars({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground">{d}</span>
          <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d / max) * 120}px` }} />
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Line({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data) * 1.1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * 300},${120 - (d / max) * 110}`).join(" ");
  return (
    <div>
      <svg viewBox="0 0 300 125" className="h-40 w-full" preserveAspectRatio="none">
        {[30, 60, 90].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} className="stroke-border" strokeWidth="1" />)}
        <polygon points={`0,125 ${pts} 300,125`} className="fill-info-soft" />
        <polyline points={pts} fill="none" className="stroke-primary" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">{labels.map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );
}

export function Donut({ value, label }: { value: number; label?: string }) {
  const c = 2 * Math.PI * 40;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-muted" strokeWidth="11" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-primary" strokeWidth="11" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-gold" strokeWidth="11" strokeDasharray={`3 ${c}`} strokeDashoffset={-c * (value / 100) + 3} />
      </svg>
      <div className="-mt-[92px] mb-14 text-center">
        <div className="text-2xl font-bold text-primary">{value}%</div>
        {label && <div className="text-[11px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";

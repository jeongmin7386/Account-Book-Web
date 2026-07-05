import type { LucideIcon } from "lucide-react";

import { formatCurrency } from "../utils/format";

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "good" | "warn" | "info";
}

const toneClasses = {
  neutral: "border-slate-200 bg-white text-slate-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function MetricCard({ title, value, icon: Icon, tone = "neutral" }: MetricCardProps) {
  return (
    <section className={`rounded-lg border p-3 shadow-sm sm:p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon aria-hidden className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-3 break-words text-lg font-semibold tracking-normal text-slate-950 sm:text-2xl">
        {formatCurrency(value)}
      </p>
    </section>
  );
}

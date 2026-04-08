"use client";

import { cn } from "@/lib/utils";
import { formatKpiValue } from "@/lib/formatters";
import { TrendIndicator } from "./trend-indicator";
import type { KpiSummaryCard } from "@/types";

interface KpiCardProps {
  data: KpiSummaryCard;
  className?: string;
}

export function KpiCard({ data, className }: KpiCardProps) {
  const { label, value, format, changePercent, trend, trendIsPositive } = data;

  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[color:var(--muted-foreground)]">
          {label}
        </p>
        <TrendIndicator
          changePercent={changePercent}
          trend={trend}
          trendIsPositive={trendIsPositive}
        />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
        {formatKpiValue(value, format)}
      </p>
    </div>
  );
}

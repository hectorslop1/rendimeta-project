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
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 animate-[scaleIn_0.3s_ease-out]",
        className,
      )}
    >
      {/* Gradiente sutil de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-transparent to-purple-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Contenido */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <TrendIndicator
            changePercent={changePercent}
            trend={trend}
            trendIsPositive={trendIsPositive}
          />
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {formatKpiValue(value, format)}
        </p>

        {/* Barra decorativa inferior */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-0 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 group-hover:w-full" />
        </div>
      </div>
    </div>
  );
}

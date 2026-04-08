"use client";

import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  changePercent: number;
  trend: "up" | "down" | "neutral";
  trendIsPositive: boolean;
  className?: string;
}

export function TrendIndicator({
  changePercent,
  trend,
  trendIsPositive,
  className,
}: TrendIndicatorProps) {
  if (trend === "neutral") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400",
          className
        )}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M2 6h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        0%
      </span>
    );
  }

  const isPositiveColor = trendIsPositive;
  const colorClass = isPositiveColor
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {trend === "up" ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M6 9V3m0 0L3 6m3-3l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M6 3v6m0 0l3-3m-3 3L3 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

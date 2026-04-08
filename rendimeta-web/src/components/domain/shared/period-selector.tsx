"use client";

import { cn } from "@/lib/utils";
import { useFilters } from "@/providers/filter-provider";
import type { FilterState } from "@/types";

const PERIOD_OPTIONS: { value: FilterState["period"]; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

interface PeriodSelectorProps {
  className?: string;
}

export function PeriodSelector({ className }: PeriodSelectorProps) {
  const { filters, setPeriod } = useFilters();

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = filters.period === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

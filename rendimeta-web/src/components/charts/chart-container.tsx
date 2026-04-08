"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  height = 350,
  children,
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}

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
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5",
        className,
      )}
    >
      {/* Gradiente sutil de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-transparent to-purple-50/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && (
              <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
        <div style={{ height }}>{children}</div>
      </div>
    </div>
  );
}

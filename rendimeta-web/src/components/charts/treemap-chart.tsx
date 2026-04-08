"use client";

import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface TreemapItem {
  name: string;
  value: number;
  stationCount?: number;
  children?: TreemapItem[];
}

interface TreemapChartProps {
  data: TreemapItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

export function TreemapChart({
  data,
  title,
  subtitle,
  height = 400,
  className,
}: TreemapChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Override wheel event on the ECharts container to prevent it from
  // calling preventDefault(), which blocks page scrolling
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const blockPreventDefault = (e: Event) => {
      // Override preventDefault so ECharts can't block scrolling
      Object.defineProperty(e, "preventDefault", {
        value: () => {},
        writable: false,
      });
    };

    el.addEventListener("wheel", blockPreventDefault, {
      capture: true,
      passive: true,
    });
    return () =>
      el.removeEventListener("wheel", blockPreventDefault, { capture: true });
  }, []);

  const option = {
    tooltip: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const { name, value, data: itemData, treePathInfo } = params;
        const path = treePathInfo
          ?.map((p: { name: string }) => p.name)
          .filter(Boolean)
          .join(" → ");
        const stations = itemData?.stationCount;
        return `
          <div style="font-size:12px;min-width:180px">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px">${name}</div>
            ${path && path !== name ? `<div style="color:#9ca3af;margin-bottom:4px;font-size:11px">${path}</div>` : ""}
            <div style="font-weight:600;color:#059669">Ingreso: ${formatCurrency(value)}</div>
            ${stations ? `<div style="color:#6b7280">${stations} estacion${stations !== 1 ? "es" : ""}</div>` : ""}
          </div>
        `;
      },
    },
    series: [
      {
        type: "treemap" as const,
        data,
        width: "100%",
        height: "100%",
        roam: false,
        squareRatio: 0.5 * (1 + Math.sqrt(5)), // golden ratio for balanced layout
        nodeClick: "zoomToNode" as const,
        visibleMin: 300, // minimum area in px² — ensures small states remain visible
        breadcrumb: {
          show: true,
          bottom: 5,
          left: 10,
          itemStyle: {
            color: "#f9fafb",
            borderColor: "#d1d5db",
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: { color: "#e5e7eb" },
          },
          textStyle: { color: "#374151", fontSize: 12 },
        },
        // Labels inside each rectangle
        label: {
          show: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const stations = params.data?.stationCount;
            const lines = [params.name];
            if (params.value) lines.push(formatCurrency(params.value));
            if (stations) lines.push(`${stations} est.`);
            return lines.join("\n");
          },
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 16,
          textShadowColor: "rgba(0,0,0,0.6)",
          textShadowBlur: 4,
        },
        // Parent labels (state headers when zoomed into a state)
        upperLabel: {
          show: true,
          height: 32,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const stations = params.data?.stationCount;
            return `  ${params.name}${stations ? `  (${stations} estaciones)` : ""}`;
          },
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: [5, 8, 5, 8],
          textShadowColor: "rgba(0,0,0,0.5)",
          textShadowBlur: 4,
        },
        levels: [
          {
            // Level 0: States — dark header bar with white text
            itemStyle: {
              borderColor: "#374151",
              borderWidth: 3,
              gapWidth: 3,
            },
            upperLabel: {
              show: true,
              height: 34,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: "rgba(0,0,0,0.65)",
              borderRadius: [4, 4, 0, 0],
              padding: [6, 10, 6, 10],
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowBlur: 4,
            },
            color: ["#6366f1", "#06b6d4", "#3b82f6", "#22c55e", "#8b5cf6"],
          },
          {
            // Level 1: Cities — semi-dark header
            itemStyle: {
              borderColor: "rgba(255,255,255,0.5)",
              borderWidth: 2,
              gapWidth: 2,
            },
            upperLabel: {
              show: true,
              height: 28,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              padding: [4, 8, 4, 8],
              textShadowColor: "rgba(0,0,0,0.4)",
              textShadowBlur: 3,
            },
            colorSaturation: [0.35, 0.7],
          },
          {
            // Level 2: Stations
            itemStyle: {
              borderColor: "rgba(255,255,255,0.3)",
              borderWidth: 1,
              gapWidth: 1,
            },
            colorSaturation: [0.3, 0.6],
            label: {
              fontSize: 10,
              fontWeight: 500,
              color: "#fff",
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowBlur: 3,
            },
          },
        ],
      },
    ],
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950",
        className,
      )}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-1">
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
      <div ref={wrapperRef}>
        <ReactECharts
          option={option}
          style={{ height, width: "100%" }}
          notMerge={true}
        />
      </div>
    </div>
  );
}

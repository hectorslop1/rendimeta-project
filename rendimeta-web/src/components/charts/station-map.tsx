"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

interface StationPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  stateCode: string;
  revenue?: number;
  pumpCount?: number;
}

interface StationMapProps {
  stations: StationPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const STATE_COLORS: Record<string, string> = {
  BC: CHART_PALETTE[0],    // rose
  CHIH: CHART_PALETTE[1],  // orange
  NAY: CHART_PALETTE[2],   // yellow
  SIN: CHART_PALETTE[3],   // green
  SON: CHART_PALETTE[4],   // blue
};

export function StationMap({
  stations,
  title,
  subtitle,
  height = 500,
  className,
}: StationMapProps) {
  const option = useMemo(() => {
    // Group by state for legend
    const stateGroups = new Map<string, StationPoint[]>();
    for (const s of stations) {
      const key = s.stateCode;
      if (!stateGroups.has(key)) stateGroups.set(key, []);
      stateGroups.get(key)!.push(s);
    }

    // Compute bounds for auto-centering
    const lats = stations.map((s) => s.latitude);
    const lngs = stations.map((s) => s.longitude);
    // Revenue range for sizing
    const revenues = stations.map((s) => s.revenue || 0).filter((r) => r > 0);
    const maxRevenue = revenues.length > 0 ? Math.max(...revenues) : 1;
    const minRevenue = revenues.length > 0 ? Math.min(...revenues) : 0;

    return {
      tooltip: {
        trigger: "item" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const s = params.data?._station as StationPoint | undefined;
          if (!s) return "";
          return `
            <div style="font-size:12px;min-width:180px">
              <div style="font-weight:600;margin-bottom:4px">${s.name}</div>
              <div style="color:#6b7280">${s.city}, ${s.state}</div>
              ${s.revenue ? `<div style="margin-top:4px;font-weight:500;color:#059669">Ingreso: ${formatCurrency(s.revenue)}</div>` : ""}
              ${s.pumpCount ? `<div style="color:#6b7280">${s.pumpCount} bombas</div>` : ""}
            </div>
          `;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { fontSize: 11 },
        itemWidth: 14,
        itemHeight: 14,
      },
      grid: {
        top: 10,
        right: 30,
        bottom: 40,
        left: 60,
      },
      xAxis: {
        type: "value" as const,
        name: "Longitud",
        nameLocation: "middle" as const,
        nameGap: 25,
        nameTextStyle: { fontSize: 11, color: "#9ca3af" },
        axisLabel: { fontSize: 10, formatter: (v: number) => `${v.toFixed(1)}°` },
        splitLine: { lineStyle: { type: "dashed" as const, color: "#f3f4f6" } },
        min: Math.min(...lngs) - 0.5,
        max: Math.max(...lngs) + 0.5,
      },
      yAxis: {
        type: "value" as const,
        name: "Latitud",
        nameLocation: "middle" as const,
        nameGap: 40,
        nameTextStyle: { fontSize: 11, color: "#9ca3af" },
        axisLabel: { fontSize: 10, formatter: (v: number) => `${v.toFixed(1)}°` },
        splitLine: { lineStyle: { type: "dashed" as const, color: "#f3f4f6" } },
        min: Math.min(...lats) - 0.5,
        max: Math.max(...lats) + 0.5,
      },
      // Override series to use cartesian instead of geo
      series: Array.from(stateGroups.entries()).map(([stateCode, stateStations]) => {
        const stateName = stateStations[0]?.state || stateCode;
        const color = STATE_COLORS[stateCode] || CHART_PALETTE[5];

        return {
          name: stateName,
          type: "scatter" as const,
          data: stateStations.map((s) => {
            const size = s.revenue && maxRevenue > minRevenue
              ? 10 + ((s.revenue - minRevenue) / (maxRevenue - minRevenue)) * 25
              : 15;
            return {
              name: s.name,
              value: [s.longitude, s.latitude],
              symbolSize: size,
              itemStyle: { color },
              _station: s,
            };
          }),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.3)",
              borderColor: "#fff",
              borderWidth: 2,
            },
          },
        };
      }),
      // Visual hint: bubble size = revenue
      visualMap: revenues.length > 0
        ? {
            show: true,
            right: 10,
            top: 10,
            dimension: 2,
            min: minRevenue,
            max: maxRevenue,
            text: ["Mayor ingreso", "Menor ingreso"],
            textStyle: { fontSize: 10, color: "#9ca3af" },
            inRange: { symbolSize: [10, 35] },
            calculable: false,
            orient: "vertical" as const,
            itemWidth: 12,
            itemHeight: 80,
          }
        : undefined,
    };
  }, [stations]);

  if (stations.length === 0) {
    return (
      <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay estaciones con coordenadas disponibles.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950", className)}>
      {(title || subtitle) && (
        <div className="px-6 pt-5 pb-2">
          {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className="px-2 pb-4">
        <ReactECharts
          option={option}
          style={{ height, width: "100%" }}
          notMerge={true}
        />
      </div>
    </div>
  );
}

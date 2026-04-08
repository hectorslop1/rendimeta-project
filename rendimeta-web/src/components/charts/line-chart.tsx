"use client";

import ReactECharts from "echarts-for-react";
import { ChartContainer } from "./chart-container";
import { CHART_PALETTE } from "@/lib/constants";
import { formatNumber } from "@/lib/formatters";
import { formatDateLabel } from "@/lib/date-utils";

function formatXTick(value: string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateLabel(value);
  }
  return value;
}

interface DataKeyConfig {
  key: string;
  color?: string;
  name?: string;
}

interface DashboardLineChartProps {
  data: Record<string, unknown>[];
  dataKeys: DataKeyConfig[];
  xAxisKey?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  curved?: boolean;
}

export function DashboardLineChart({
  data,
  dataKeys,
  xAxisKey = "date",
  yAxisLabel,
  title,
  subtitle,
  height = 350,
  className,
  curved = true,
}: DashboardLineChartProps) {
  const option = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: { seriesName: string; value: number; color: string }[]) => {
        if (!Array.isArray(params) || !params.length) return "";
        const xVal = data[0]?.[xAxisKey] as string;
        const header = params.length > 0
          ? formatXTick(data[(params[0] as { dataIndex?: number }).dataIndex ?? 0]?.[xAxisKey] as string ?? "")
          : "";
        const lines = params.map(
          (p) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <strong>${formatNumber(p.value)}</strong>`
        );
        return `<div style="font-size:12px"><div style="margin-bottom:4px;font-weight:500">${header}</div>${lines.join("<br/>")}</div>`;
      },
    },
    legend: {
      show: dataKeys.length > 1,
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      top: 10,
      right: 20,
      bottom: dataKeys.length > 1 ? 30 : 10,
      left: yAxisLabel ? 60 : 50,
      containLabel: false,
    },
    xAxis: {
      type: "category" as const,
      data: data.map((d) => d[xAxisKey] as string),
      axisLabel: { fontSize: 11, formatter: formatXTick },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value" as const,
      name: yAxisLabel || "",
      nameLocation: "middle" as const,
      nameGap: 45,
      nameTextStyle: { fontSize: 11, color: "#9ca3af" },
      axisLabel: { fontSize: 11, formatter: (v: number) => formatNumber(v) },
      splitLine: { lineStyle: { type: "dashed" as const, color: "#e5e7eb" } },
    },
    series: dataKeys.map((dk, i) => ({
      name: dk.name || dk.key,
      type: "line" as const,
      data: data.map((d) => d[dk.key] as number),
      smooth: curved,
      symbolSize: 6,
      itemStyle: { color: dk.color || CHART_PALETTE[i % CHART_PALETTE.length] },
      lineStyle: { width: 2 },
    })),
  };

  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge={true}
      />
    </ChartContainer>
  );
}

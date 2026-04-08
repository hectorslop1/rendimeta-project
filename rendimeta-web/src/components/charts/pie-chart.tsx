"use client";

import ReactECharts from "echarts-for-react";
import { ChartContainer } from "./chart-container";
import { CHART_PALETTE } from "@/lib/constants";
import { formatNumber } from "@/lib/formatters";

interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

interface DashboardPieChartProps {
  data: PieDataItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  innerRadius?: number;
  showLabels?: boolean;
}

export function DashboardPieChart({
  data,
  title,
  subtitle,
  height = 350,
  className,
  innerRadius = 0,
  showLabels = true,
}: DashboardPieChartProps) {
  const option = {
    tooltip: {
      trigger: "item" as const,
      formatter: (params: { name: string; value: number; percent: number; color: string }) => {
        return `<div style="font-size:12px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px;"></span>${params.name}: <strong>${formatNumber(params.value)}</strong> (${params.percent}%)</div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: "pie" as const,
        radius: innerRadius > 0 ? [`${innerRadius}px`, "75%"] : ["0%", "75%"],
        center: ["50%", "45%"],
        data: data.map((item, i) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color || CHART_PALETTE[i % CHART_PALETTE.length],
          },
        })),
        label: {
          show: showLabels,
          position: "inside" as const,
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          formatter: (params: { percent: number }) => {
            if (params.percent < 5) return "";
            return `${params.percent.toFixed(0)}%`;
          },
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
    ],
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

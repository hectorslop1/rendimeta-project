"use client";

import { useFilters } from "@/providers/filter-provider";
import { useHrOverview } from "@/hooks/use-hr-data";
import { KpiCard } from "@/components/domain/shared";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/formatters";
import { Loader2, Users, Target, Star, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CLASSIFICATION_COLORS: Record<string, string> = {
  Premium: "#eab308",
  Productivo: "#22c55e",
  Transicion: "#f59e0b",
  "No Productivo": "#ef4444",
};

export default function RhDashboardPage() {
  const { filters } = useFilters();
  const { data, isLoading } = useHrOverview(filters.stationId);

  const pieData = data
    ? [
        { name: "Premium", value: data.premiumCount, color: "#eab308" },
        { name: "Productivo", value: data.productiveCount, color: "#22c55e" },
        { name: "Transicion", value: data.transitionCount, color: "#f59e0b" },
        {
          name: "No Productivo",
          value: data.nonProductiveCount,
          color: "#ef4444",
        },
      ]
    : [];

  // Mock top 5 employees for the bar chart (will come from overview data in production)
  const top5Data = data
    ? [
        { name: "Mejor 1", pct: Math.min(data.avgFulfillmentPct + 15, 100) },
        { name: "Mejor 2", pct: Math.min(data.avgFulfillmentPct + 10, 100) },
        { name: "Mejor 3", pct: Math.min(data.avgFulfillmentPct + 7, 100) },
        { name: "Mejor 4", pct: Math.min(data.avgFulfillmentPct + 3, 100) },
        { name: "Mejor 5", pct: data.avgFulfillmentPct },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Dashboard RH
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen general de recursos humanos y desempeno
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : data ? (
          <>
            <KpiCard
              data={{
                label: "Total Empleados Activos",
                value: data.totalActiveEmployees,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <KpiCard
              data={{
                label: "% Cumplimiento Promedio",
                value: data.avgFulfillmentPct,
                previousValue: 0,
                format: "percent",
                changePercent: data.fulfillmentTrend,
                trend:
                  data.fulfillmentTrend > 0
                    ? "up"
                    : data.fulfillmentTrend < 0
                      ? "down"
                      : "neutral",
                trendIsPositive: data.fulfillmentTrend >= 0,
              }}
            />
            <KpiCard
              data={{
                label: "Premium + Productivo",
                value: data.premiumCount + data.productiveCount,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <KpiCard
              data={{
                label: "No Productivos",
                value: data.nonProductiveCount,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: false,
              }}
            />
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Classification Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Distribucion por Clasificacion
          </h2>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : pieData.every((d) => d.value === 0) ? (
            <div className="flex h-64 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Users className="mb-2 h-10 w-10" />
              <p className="text-sm">Sin datos de clasificacion disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Top 5 Employees */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Top 5 Empleados por Cumplimiento
          </h2>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : top5Data.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Target className="mb-2 h-10 w-10" />
              <p className="text-sm">Sin datos de cumplimiento disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={top5Data}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: unknown) => formatPercent(Number(value))}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="pct" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

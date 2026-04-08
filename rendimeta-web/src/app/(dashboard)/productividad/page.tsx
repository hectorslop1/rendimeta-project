"use client";

import { useKpiCategory } from "@/hooks/use-kpi-data";
import {
  DashboardLineChart,
  DashboardBarChart,
} from "@/components/charts";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

const SUM_KEYS = new Set(["laborHours", "totalTransactions"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateByDate(data: Record<string, any>[]) {
  const map = new Map<string, { values: Record<string, number[]> }>();
  for (const row of data) {
    const date = row.date as string;
    if (!map.has(date)) map.set(date, { values: {} });
    const entry = map.get(date)!;
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "number") {
        if (!entry.values[k]) entry.values[k] = [];
        entry.values[k].push(v);
      }
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { values }]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = { date };
      for (const [k, arr] of Object.entries(values)) {
        const sum = arr.reduce((a: number, b: number) => a + b, 0);
        result[k] = SUM_KEYS.has(k)
          ? Math.round(sum * 100) / 100
          : Math.round((sum / arr.length) * 100) / 100;
      }
      return result;
    });
}

export default function ProductividadPage() {
  const { data, isLoading } = useKpiCategory("productivity");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs de Productividad</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de eficiencia y productividad del personal</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<KpiCardSkeleton key={i} />))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (<ChartSkeleton key={i} />))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs de Productividad</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de eficiencia y productividad del personal</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles.</p>
      </div>
    );
  }

  const aggregated = aggregateByDate(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgSalesPerLaborHour = data.reduce((sum: number, r: any) => sum + (r.salesPerLaborHour ?? 0), 0) / data.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgTransactionsPerHour = data.reduce((sum: number, r: any) => sum + (r.transactionsPerHour ?? 0), 0) / data.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalTransactions = data.reduce((sum: number, r: any) => sum + (r.totalTransactions ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgStaffEfficiency = data.reduce((sum: number, r: any) => sum + (r.staffEfficiencyPct ?? 0), 0) / data.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs de Productividad</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de eficiencia y productividad del personal</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ventas / Hora Laboral" value={formatNumber(avgSalesPerLaborHour)} />
        <SummaryCard title="Transacciones / Hora" value={formatNumber(avgTransactionsPerHour)} />
        <SummaryCard title="Total Transacciones" value={formatNumber(totalTransactions)} />
        <SummaryCard title="Eficiencia Personal" value={formatPercent(avgStaffEfficiency)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardLineChart
          title="Ventas y Transacciones por Hora"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "salesPerLaborHour", name: "Ventas / Hora Laboral", color: CHART_PALETTE[0] },
            { key: "transactionsPerHour", name: "Transacciones / Hora", color: CHART_PALETTE[1] },
          ]}
          yAxisLabel="Unidades/Hora"
        />
        <DashboardBarChart
          title="Total de Transacciones"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "totalTransactions", name: "Transacciones", color: CHART_PALETTE[2] },
          ]}
          yAxisLabel="Transacciones"
        />
        <DashboardLineChart
          title="Eficiencia del Personal"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "staffEfficiencyPct", name: "Eficiencia %", color: CHART_PALETTE[3] },
          ]}
          yAxisLabel="Porcentaje (%)"
        />
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{value}</p>
    </div>
  );
}

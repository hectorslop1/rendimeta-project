"use client";

import { useKpiCategory } from "@/hooks/use-kpi-data";
import {
  DashboardLineChart,
  DashboardBarChart,
} from "@/components/charts";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

const SUM_KEYS = new Set([
  "fuelGrossMarginMxn",
  "storeRevenueMxn",
  "ebitdaMxn",
  "totalRevenueMxn",
  "operatingCostsMxn",
]);

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

export default function FinancierosPage() {
  const { data, isLoading } = useKpiCategory("financial");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Financieros</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas financieras y de rentabilidad</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Financieros</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas financieras y de rentabilidad</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles.</p>
      </div>
    );
  }

  const aggregated = aggregateByDate(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = data.reduce((sum: number, r: any) => sum + (r.totalRevenueMxn ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalEbitda = data.reduce((sum: number, r: any) => sum + (r.ebitdaMxn ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgMarginPct = data.reduce((sum: number, r: any) => sum + (r.fuelGrossMarginPct ?? 0), 0) / data.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgOperatingCostsPct = data.reduce((sum: number, r: any) => sum + (r.operatingCostsPct ?? 0), 0) / data.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Financieros</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Métricas financieras y de rentabilidad</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ingresos Totales" value={formatCurrency(totalRevenue)} />
        <SummaryCard title="EBITDA Total" value={formatCurrency(totalEbitda)} />
        <SummaryCard title="Margen Promedio %" value={formatPercent(avgMarginPct)} />
        <SummaryCard title="Costos Operativos %" value={formatPercent(avgOperatingCostsPct)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardLineChart
          title="Ingresos y EBITDA"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "totalRevenueMxn", name: "Ingresos Totales", color: CHART_PALETTE[0] },
            { key: "ebitdaMxn", name: "EBITDA", color: CHART_PALETTE[1] },
          ]}
          yAxisLabel="MXN ($)"
        />
        <DashboardBarChart
          title="Margen Combustible e Ingreso Tienda"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "fuelGrossMarginMxn", name: "Margen Combustible", color: CHART_PALETTE[2] },
            { key: "storeRevenueMxn", name: "Ingreso Tienda", color: CHART_PALETTE[3] },
          ]}
          yAxisLabel="MXN ($)"
        />
        <DashboardLineChart
          title="Margen % y Costos Operativos %"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "fuelGrossMarginPct", name: "Margen %", color: CHART_PALETTE[4] },
            { key: "operatingCostsPct", name: "Costos Operativos %", color: CHART_PALETTE[5] },
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

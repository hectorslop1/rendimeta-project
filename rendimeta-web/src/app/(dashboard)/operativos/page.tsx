"use client";

import { useKpiCategory } from "@/hooks/use-kpi-data";
import {
  DashboardAreaChart,
  DashboardLineChart,
  DashboardBarChart,
} from "@/components/charts";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { formatLiters, formatPercent, formatNumber } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

const SUM_KEYS = new Set([
  "fuelVolumeLiters",
  "regularLiters",
  "premiumLiters",
  "dieselLiters",
  "equipmentDowntimeMin",
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

export default function OperativosPage() {
  const { data, isLoading } = useKpiCategory("operational");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Operativos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de operación y rendimiento de estaciones</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Operativos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de operación y rendimiento de estaciones</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles.</p>
      </div>
    );
  }

  const aggregated = aggregateByDate(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFuelVolume = data.reduce((sum: number, r: any) => sum + (r.fuelVolumeLiters ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgTankUtilization = data.reduce((sum: number, r: any) => sum + (r.tankUtilizationPct ?? 0), 0) / data.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgDispatchAccuracy = data.reduce((sum: number, r: any) => sum + (r.dispatchAccuracyPct ?? 0), 0) / data.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDowntime = data.reduce((sum: number, r: any) => sum + (r.equipmentDowntimeMin ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">KPIs Operativos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Métricas de operación y rendimiento de estaciones</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Volumen Total" value={formatLiters(totalFuelVolume)} />
        <SummaryCard title="Utilización Tanques" value={formatPercent(avgTankUtilization)} />
        <SummaryCard title="Precisión Despacho" value={formatPercent(avgDispatchAccuracy)} />
        <SummaryCard title="Tiempo Inactivo Total" value={`${formatNumber(totalDowntime)} min`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardAreaChart
          title="Volumen por Tipo de Combustible"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "regularLiters", name: "Regular", color: CHART_PALETTE[0] },
            { key: "premiumLiters", name: "Premium", color: CHART_PALETTE[1] },
            { key: "dieselLiters", name: "Diésel", color: CHART_PALETTE[2] },
          ]}
          stacked
          yAxisLabel="Litros"
        />
        <DashboardLineChart
          title="Utilización y Precisión de Despacho"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "tankUtilizationPct", name: "Utilización Tanques %", color: CHART_PALETTE[3] },
            { key: "dispatchAccuracyPct", name: "Precisión Despacho %", color: CHART_PALETTE[4] },
          ]}
          yAxisLabel="Porcentaje (%)"
        />
        <DashboardBarChart
          title="Tiempo Inactivo de Equipos"
          data={aggregated}
          xAxisKey="date"
          dataKeys={[
            { key: "equipmentDowntimeMin", name: "Minutos Inactivo", color: CHART_PALETTE[5] },
          ]}
          yAxisLabel="Minutos"
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

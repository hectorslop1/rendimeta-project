"use client";

import { useMemo } from "react";
import { useKpiCategory, useRankings } from "@/hooks/use-kpi-data";
import { DashboardBarChart } from "@/components/charts";
import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton";
import { formatLiters, formatPercent, formatCurrency, formatCompact } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateByGroup(data: any[]): Record<string, any>[] {
  const map = new Map<string, { count: number; sums: Record<string, number> }>();
  for (const row of data) {
    const name = row.groupName || row.stateName;
    if (!map.has(name)) map.set(name, { count: 0, sums: {} });
    const entry = map.get(name)!;
    entry.count++;
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "number") {
        entry.sums[k] = (entry.sums[k] || 0) + (v as number);
      }
    }
  }
  const SUM_KEYS = new Set([
    "fuelVolumeLiters", "regularLiters", "premiumLiters", "dieselLiters",
    "totalRevenueMxn", "ebitdaMxn", "totalTransactions",
  ]);
  return Array.from(map.entries())
    .map(([name, { count, sums }]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = { name };
      for (const [k, v] of Object.entries(sums)) {
        result[k] = SUM_KEYS.has(k)
          ? Math.round(v * 100) / 100
          : Math.round((v / count) * 100) / 100;
      }
      return result;
    })
    .sort((a, b) => ((b.fuelVolumeLiters as number) || 0) - ((a.fuelVolumeLiters as number) || 0));
}

// Heatmap color scale: low (red) → mid (yellow) → high (green)
function getHeatColor(value: number, min: number, max: number, invert = false): string {
  if (max === min) return "bg-gray-100 dark:bg-gray-800";
  let ratio = (value - min) / (max - min);
  if (invert) ratio = 1 - ratio;

  if (ratio >= 0.75) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (ratio >= 0.5) return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (ratio >= 0.25) return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

interface HeatmapMetric {
  key: string;
  label: string;
  format: (v: number) => string;
  invert?: boolean; // true = lower is better
}

const HEATMAP_METRICS: HeatmapMetric[] = [
  { key: "fuelVolumeLiters", label: "Volumen (L)", format: formatLiters },
  { key: "totalRevenueMxn", label: "Ingresos", format: formatCurrency },
  { key: "fuelGrossMarginPct", label: "Margen %", format: formatPercent },
  { key: "tankUtilizationPct", label: "Utilización %", format: formatPercent },
  { key: "dispatchAccuracyPct", label: "Precisión %", format: formatPercent },
  { key: "operatingCostsPct", label: "Costos Op. %", format: formatPercent, invert: true },
];

export default function EstadosPage() {
  const {
    data: operationalData,
    isLoading: opLoading,
    error: opError,
  } = useKpiCategory("operational", "state");
  const {
    data: financialData,
    isLoading: finLoading,
    error: finError,
  } = useKpiCategory("financial", "state");
  const {
    data: rankings,
    isLoading: rankingsLoading,
  } = useRankings();

  const isLoading = opLoading || finLoading;
  const error = opError || finError;

  const operationalByState = useMemo(
    () => (operationalData ? aggregateByGroup(operationalData) : []),
    [operationalData]
  );

  const financialByState = useMemo(
    () => (financialData ? aggregateByGroup(financialData) : []),
    [financialData]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergedStates: Record<string, any>[] = useMemo(() => {
    const finMap = new Map(financialByState.map((s) => [s.name, s]));
    return operationalByState.map((op) => ({
      ...op,
      ...(finMap.get(op.name as string) || {}),
      name: op.name,
    }));
  }, [operationalByState, financialByState]);

  // Compute min/max for heatmap colors
  const metricRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    for (const metric of HEATMAP_METRICS) {
      const values = mergedStates
        .map((s) => (s[metric.key] as number) || 0)
        .filter((v) => v > 0);
      ranges[metric.key] = {
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 1,
      };
    }
    return ranges;
  }, [mergedStates]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comparativo por Estado
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Rendimiento comparativo entre los 5 estados
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error al cargar datos: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <>
          {/* Bar charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardBarChart
              title="Volumen Total de Combustible por Estado"
              data={operationalByState}
              dataKeys={[{ key: "fuelVolumeLiters", name: "Volumen (L)", color: CHART_PALETTE[0] }]}
              xAxisKey="name"
              yAxisLabel="Litros"
            />
            <DashboardBarChart
              title="Utilización Promedio de Tanques por Estado"
              data={operationalByState}
              dataKeys={[{ key: "tankUtilizationPct", name: "Utilización (%)", color: CHART_PALETTE[1] }]}
              xAxisKey="name"
              yAxisLabel="Porcentaje (%)"
            />
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mapa de Calor por Estado
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Verde = mejor rendimiento &nbsp;|&nbsp; Rojo = atención requerida
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Estado
                    </th>
                    {HEATMAP_METRICS.map((m) => (
                      <th
                        key={m.key}
                        className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {mergedStates.map((state) => (
                    <tr key={state.name as string} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {state.name as string}
                      </td>
                      {HEATMAP_METRICS.map((m) => {
                        const val = (state[m.key] as number) || 0;
                        const range = metricRanges[m.key];
                        const colorClass = getHeatColor(val, range.min, range.max, m.invert);
                        return (
                          <td key={m.key} className="px-3 py-3 text-center">
                            <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
                              {m.format(val)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {mergedStates.length === 0 && (
                    <tr>
                      <td colSpan={HEATMAP_METRICS.length + 1} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* City Rankings */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ranking de Ingresos por Ciudad
              </h2>
            </div>
            {rankingsLoading ? (
              <div className="p-6">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : rankings?.cityRankings ? (
              <div className="p-6 space-y-3">
                {rankings.cityRankings.map((city: {
                  name: string;
                  state: string;
                  stateCode: string;
                  totalRevenue: number;
                  stationCount: number;
                }, i: number) => {
                  const maxRevenue = rankings.cityRankings[0].totalRevenue;
                  const barWidth = (city.totalRevenue / maxRevenue) * 100;
                  return (
                    <div key={`${city.name}-${city.stateCode}`} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-gray-400 dark:text-gray-500">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {city.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {city.stateCode} &middot; {city.stationCount} estacion{city.stationCount !== 1 ? "es" : ""}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {formatCurrency(city.totalRevenue)}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

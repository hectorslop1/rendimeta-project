"use client";

import { useState, useMemo } from "react";
import { useStationComparison } from "@/hooks/use-hr-data";
import { useFilters } from "@/providers/filter-provider";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Loader2, Building } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CLASSIFICATION_COLORS: Record<string, string> = {
  PREMIUM: "#eab308",
  PRODUCTIVE: "#22c55e",
  TRANSITION: "#f59e0b",
  NON_PRODUCTIVE: "#ef4444",
};

function getFulfillmentColor(pct: number) {
  if (pct >= 90) return "#22c55e";
  if (pct >= 80) return "#f59e0b";
  return "#ef4444";
}

export default function ComparativoEstacionesPage() {
  const { filters } = useFilters();
  const [stateId, setStateId] = useState(filters.stateId ?? "");
  const [cityId, setCityId] = useState(filters.cityId ?? "");

  const { data, isLoading } = useStationComparison(
    stateId || undefined,
    cityId || undefined
  );

  const stationsData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  // Sort by fulfillment descending
  const sorted = useMemo(
    () =>
      [...stationsData].sort(
        (a: any, b: any) =>
          (b.avgFulfillmentPct ?? 0) - (a.avgFulfillmentPct ?? 0)
      ),
    [stationsData]
  );

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Comparativo de Estaciones
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comparacion de desempeno de RH entre estaciones
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Estado
          </label>
          <input
            type="text"
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            placeholder="ID Estado (opcional)"
            className={selectClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Ciudad
          </label>
          <input
            type="text"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            placeholder="ID Ciudad (opcional)"
            className={selectClass}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Building className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay datos de comparativo disponibles
          </p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              % Cumplimiento por Estacion
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={sorted}
                margin={{ left: 10, right: 10, bottom: 30 }}
              >
                <XAxis
                  dataKey="stationName"
                  tick={{ fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown) => formatPercent(Number(value))}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="avgFulfillmentPct" radius={[4, 4, 0, 0]}>
                  {sorted.map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={getFulfillmentColor(entry.avgFulfillmentPct ?? 0)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "#",
                    "Estacion",
                    "Empleados",
                    "% Cumplimiento",
                    "% Premium",
                    "% No Productivo",
                    "Ventas Totales",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map((s: any, idx: number) => (
                  <tr
                    key={s.stationId ?? idx}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {s.stationName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {s.employeeCount ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-bold ${
                          (s.avgFulfillmentPct ?? 0) >= 90
                            ? "text-green-600 dark:text-green-400"
                            : (s.avgFulfillmentPct ?? 0) >= 80
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatPercent(s.avgFulfillmentPct ?? 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                      {formatPercent(s.premiumPct ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-red-600 dark:text-red-400 font-semibold">
                      {formatPercent(s.nonProductivePct ?? 0)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatCurrency(s.totalSales ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

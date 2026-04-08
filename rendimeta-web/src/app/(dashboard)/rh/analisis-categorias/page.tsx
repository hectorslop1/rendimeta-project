"use client";

import { useState, useMemo } from "react";
import { useCategoryAnalysis } from "@/hooks/use-hr-data";
import { useStations } from "@/hooks/use-kpi-data";
import { useFilters } from "@/providers/filter-provider";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Loader2, LayoutGrid } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function monthAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
}

export default function AnalisisCategoriasPage() {
  const { filters } = useFilters();
  const [stationId, setStationId] = useState(filters.stationId ?? "");
  const [dateFrom, setDateFrom] = useState(monthAgoISO());
  const [dateTo, setDateTo] = useState(todayISO());

  const { data: stations } = useStations();
  const { data, isLoading } = useCategoryAnalysis({
    stationId: stationId || undefined,
    from: dateFrom,
    to: dateTo,
  });

  const stationsArr = Array.isArray(stations) ? stations : [];
  const categories = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Analisis por Categorias
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Desempeno de ventas desglosado por categoria de producto
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Estacion
          </label>
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas las estaciones</option>
            {stationsArr.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={selectClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <LayoutGrid className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay datos de categorias para los filtros seleccionados
          </p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Ingresos por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={categories}
                margin={{ left: 10, right: 10, bottom: 20 }}
              >
                <XAxis
                  dataKey="categoryName"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: unknown) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="totalRevenue" radius={[4, 4, 0, 0]}>
                  {categories.map((_: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Categoria",
                    "Unidades",
                    "Ingresos",
                    "Promedio / Empleado",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {categories.map((cat: any, idx: number) => (
                  <tr
                    key={cat.categoryName ?? idx}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                        {cat.categoryName}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {formatNumber(cat.totalUnits ?? 0)}
                    </td>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatCurrency(cat.totalRevenue ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(cat.avgPerEmployee ?? 0)}
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

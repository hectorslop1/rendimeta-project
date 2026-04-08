"use client";

import { useState, useMemo } from "react";
import { useEvaluations } from "@/hooks/use-hr-data";
import { ClassificationBadge } from "@/components/domain/hr/classification-badge";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Loader2, FileBarChart } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CLASSIFICATION_COLORS: Record<string, string> = {
  PREMIUM: "#eab308",
  PRODUCTIVE: "#22c55e",
  TRANSITION: "#f59e0b",
  NON_PRODUCTIVE: "#ef4444",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  PREMIUM: "Premium",
  PRODUCTIVE: "Productivo",
  TRANSITION: "Transicion",
  NON_PRODUCTIVE: "No Productivo",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function EvaluacionesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [filterClassification, setFilterClassification] = useState("");

  const { data, isLoading } = useEvaluations(month, filterClassification || undefined);

  const evaluations = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  // Pie chart data
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      PREMIUM: 0,
      PRODUCTIVE: 0,
      TRANSITION: 0,
      NON_PRODUCTIVE: 0,
    };
    evaluations.forEach((e: any) => {
      if (counts[e.classification] !== undefined) {
        counts[e.classification]++;
      }
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: CLASSIFICATION_LABELS[key],
      value,
      color: CLASSIFICATION_COLORS[key],
    }));
  }, [evaluations]);

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Evaluaciones de Desempeno
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Clasificacion y metricas de rendimiento mensual
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Mes
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={selectClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Clasificacion
          </label>
          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            <option value="PREMIUM">Premium</option>
            <option value="PRODUCTIVE">Productivo</option>
            <option value="TRANSITION">Transicion</option>
            <option value="NON_PRODUCTIVE">No Productivo</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <FileBarChart className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay evaluaciones para el periodo seleccionado
          </p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Distribucion por Clasificacion
            </h2>
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
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
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
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Empleado",
                    "Estacion",
                    "% Cumplimiento",
                    "Clasificacion",
                    "Ventas Combustible",
                    "Ventas Perifericos",
                    "Score Asistencia",
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
                {evaluations.map((ev: any) => (
                  <tr
                    key={ev.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {ev.employee?.firstName} {ev.employee?.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {ev.station?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercent(ev.overallFulfillmentPct)}
                    </td>
                    <td className="px-3 py-2">
                      <ClassificationBadge classification={ev.classification} />
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(ev.fuelSalesAmount ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(ev.peripheralSalesAmount ?? 0)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {(ev.attendanceScore ?? 0).toFixed(1)}
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

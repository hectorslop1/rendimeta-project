"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useEmployee, usePerformanceTrend } from "@/hooks/use-hr-data";
import { ClassificationBadge } from "@/components/domain/hr/classification-badge";
import { EmployeePerformanceCard } from "@/components/domain/hr/employee-performance-card";
import { KpiCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const { data: employee, isLoading } = useEmployee(id);
  const { data: trendData, isLoading: isLoadingTrend } = usePerformanceTrend(id);

  const trendArr = useMemo(() => {
    if (!trendData) return [];
    if (Array.isArray(trendData)) return trendData;
    if (trendData.data && Array.isArray(trendData.data)) return trendData.data;
    return [];
  }, [trendData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Empleado no encontrado</p>
        <Link
          href="/rh/empleados"
          className="mt-4 inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a empleados
        </Link>
      </div>
    );
  }

  const classification =
    employee.latestEvaluation?.classification ?? "NON_PRODUCTIVE";
  const fulfillmentPct =
    employee.latestEvaluation?.overallFulfillmentPct ?? 0;
  const categories = employee.latestEvaluation?.categories ?? [];

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        href="/rh/empleados"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a empleados
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {employee.firstName} {employee.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>#{employee.employeeNumber}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>{employee.station?.name ?? "Sin estacion"}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>{employee.shift?.name ?? "Sin turno"}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>
              Ingreso:{" "}
              {employee.hireDate
                ? new Date(employee.hireDate).toLocaleDateString("es-MX")
                : "—"}
            </span>
          </div>
        </div>
        <ClassificationBadge classification={classification} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            % Cumplimiento
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {formatPercent(fulfillmentPct)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Ventas MXN
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {formatCurrency(
              (employee.latestEvaluation?.fuelSalesAmount ?? 0) +
                (employee.latestEvaluation?.peripheralSalesAmount ?? 0)
            )}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Racha Actual
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {employee.currentStreak ?? 0} dias
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Puntos Gamificacion
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {(employee.totalPoints ?? 0).toLocaleString("es-MX")}
          </p>
        </div>
      </div>

      {/* Performance Trend */}
      {trendArr.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Tendencia de Desempeno
          </h2>
          {isLoadingTrend ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendArr}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "-01");
                    return d.toLocaleDateString("es-MX", {
                      month: "short",
                      year: "2-digit",
                    });
                  }}
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
                <Line
                  type="monotone"
                  dataKey="fulfillmentPct"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#e11d48" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Category Donuts */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Desempeno por Categoria
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EmployeePerformanceCard
              employee={{
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeNumber: employee.employeeNumber,
              }}
              classification={classification}
              fulfillmentPct={fulfillmentPct}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

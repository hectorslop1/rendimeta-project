"use client";

import { useState, useMemo } from "react";
import { useCommissionPayments } from "@/hooks/use-hr-data";
import { useCalculateCommissions } from "@/hooks/use-hr-crud";
import { KpiCard } from "@/components/domain/shared";
import { KpiCardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Loader2, DollarSign, Calculator } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; classes: string }> = {
  CALCULATED: {
    label: "Calculada",
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  APPROVED: {
    label: "Aprobada",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  PAID: {
    label: "Pagada",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ComisionesPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading, refetch } = useCommissionPayments(month);
  const calculateMutation = useCalculateCommissions();

  const payments = Array.isArray(data) ? data : [];

  const summary = useMemo(() => {
    if (payments.length === 0)
      return { total: 0, avg: 0, topName: "—", withCommission: 0 };
    const total = payments.reduce(
      (acc: number, p: any) => acc + (p.commissionAmount ?? 0),
      0
    );
    const withCommission = payments.filter(
      (p: any) => (p.commissionAmount ?? 0) > 0
    ).length;
    const avg = withCommission > 0 ? total / withCommission : 0;
    const top = [...payments].sort(
      (a: any, b: any) =>
        (b.commissionAmount ?? 0) - (a.commissionAmount ?? 0)
    )[0];
    const topName = top
      ? `${top.employee.firstName} ${top.employee.lastName}`
      : "—";
    return { total, avg, topName, withCommission };
  }, [payments]);

  async function handleCalculate() {
    await calculateMutation.mutateAsync({ month });
    refetch();
  }

  async function handleApprove(id: string) {
    await fetch(`/api/hr/commissions/payments/${id}/approve`, {
      method: "POST",
    });
    refetch();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Comisiones
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Calculo y gestion de comisiones mensuales
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {calculateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          Calcular Comisiones
        </button>
      </div>

      {/* Month Selector */}
      <div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              data={{
                label: "Total Comisiones",
                value: summary.total,
                previousValue: 0,
                changePercent: 0,
                format: "currency",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <KpiCard
              data={{
                label: "Promedio por Empleado",
                value: summary.avg,
                previousValue: 0,
                changePercent: 0,
                format: "currency",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Mayor Ganador
              </p>
              <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50 truncate">
                {summary.topName}
              </p>
            </div>
            <KpiCard
              data={{
                label: "Empleados con Comision",
                value: summary.withCommission,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
          </>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <DollarSign className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay comisiones calculadas para este mes
          </p>
          <p className="mt-1 text-xs">
            Presiona &ldquo;Calcular Comisiones&rdquo; para generar el calculo
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  "Empleado",
                  "Categoria",
                  "Ventas",
                  "Cuota",
                  "%",
                  "Tasa",
                  "Comision MXN",
                  "Status",
                  "Acciones",
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
              {payments.map((p: any) => {
                const badge = STATUS_BADGES[p.status] ?? STATUS_BADGES.CALCULATED;
                return (
                  <tr
                    key={p.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {p.employee.firstName} {p.employee.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {p.categoryName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(p.salesAmount)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatCurrency(p.quotaAmount)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercent(p.fulfillmentPct)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {formatPercent(p.commissionRate)}
                    </td>
                    <td className="px-3 py-2 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatCurrency(p.commissionAmount)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.status === "CALCULATED" && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          Aprobar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useDailyPlanner, useEmployees } from "@/hooks/use-hr-data";
import { DailyPlannerTimeline } from "@/components/domain/hr/daily-planner-timeline";
import { TrafficLightCell } from "@/components/domain/hr/traffic-light-cell";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Loader2, CalendarDays, User } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function PlanificadorPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [empSearch, setEmpSearch] = useState("");

  const { data: employees } = useEmployees({ search: empSearch });
  const { data, isLoading } = useDailyPlanner(
    employeeId || undefined,
    date
  );

  const employeesArr = useMemo(() => {
    if (!employees) return [];
    return Array.isArray(employees) ? employees : employees?.data ?? [];
  }, [employees]);

  const slots = data?.slots ?? [];
  const quotas = data?.quotas ?? [];

  // Compute cumulative columns
  const tableData = useMemo(() => {
    let cumTarget = 0;
    let cumActual = 0;
    return slots.map((slot: any) => {
      cumTarget += slot.targetRevenue;
      cumActual += slot.actualRevenue;
      return {
        ...slot,
        cumTarget,
        cumActual,
        cumPct: cumTarget > 0 ? (cumActual / cumTarget) * 100 : 0,
      };
    });
  }, [slots]);

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Planificador Diario
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Plan y seguimiento hora por hora de cada empleado
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Empleado
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={selectClass + " w-full"}
          >
            <option value="">Seleccionar empleado...</option>
            {employeesArr.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} (#{e.employeeNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Content */}
      {!employeeId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <User className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            Selecciona un empleado para ver su planificacion diaria
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <CalendarDays className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay datos de planificacion para esta fecha
          </p>
        </div>
      ) : (
        <>
          {/* Timeline visual */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Linea de Tiempo
            </h2>
            <DailyPlannerTimeline slots={slots} />
          </div>

          {/* Detail Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Hora",
                    "Meta Unidades",
                    "Meta MXN",
                    "Real",
                    "% Cumplimiento",
                    "Acum. Meta",
                    "Acum. Real",
                    "% Acum.",
                    "Status",
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
                {tableData.map((row: any) => (
                  <tr
                    key={row.hour}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {String(row.hour).padStart(2, "0")}:00
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {row.targetUnits}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {formatCurrency(row.targetRevenue)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(row.actualRevenue)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercent(row.fulfillmentPct)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {formatCurrency(row.cumTarget)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {formatCurrency(row.cumActual)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {formatPercent(row.cumPct)}
                    </td>
                    <td className="px-1 py-2">
                      <TrafficLightCell
                        value={row.actualRevenue}
                        fulfillmentPct={row.fulfillmentPct}
                      />
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

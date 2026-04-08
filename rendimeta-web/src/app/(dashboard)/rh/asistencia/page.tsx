"use client";

import { useState, useMemo } from "react";
import { useAttendanceSummary } from "@/hooks/use-hr-data";
import { useStations } from "@/hooks/use-kpi-data";
import { KpiCard } from "@/components/domain/shared";
import { KpiCardSkeleton } from "@/components/ui/skeleton";
import { Loader2, ClipboardList } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  PRESENT: {
    label: "Presente",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  ABSENT: {
    label: "Falta",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  LATE: {
    label: "Retardo",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  EARLY_LEAVE: {
    label: "Salida Temprana",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  DAY_OFF: {
    label: "Descanso",
    classes:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  VACATION: {
    label: "Vacaciones",
    classes:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  SICK_LEAVE: {
    label: "Incapacidad",
    classes:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function AsistenciaPage() {
  const [stationId, setStationId] = useState("");
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());

  const { data: stations } = useStations();
  const { data, isLoading } = useAttendanceSummary(
    stationId || undefined,
    dateFrom
  );

  const stationsArr = Array.isArray(stations) ? stations : [];
  const records = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Compute summary cards
  const summary = useMemo(() => {
    if (records.length === 0)
      return { attendancePct: 0, avgHours: 0, absences: 0, lates: 0 };

    const presentLike = records.filter(
      (r: any) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EARLY_LEAVE"
    ).length;
    const workable = records.filter(
      (r: any) =>
        r.status !== "DAY_OFF" && r.status !== "VACATION" && r.status !== "SICK_LEAVE"
    ).length;
    const attendancePct = workable > 0 ? (presentLike / workable) * 100 : 0;

    const hoursArr = records
      .filter((r: any) => r.hoursWorked != null && r.hoursWorked > 0)
      .map((r: any) => r.hoursWorked);
    const avgHours =
      hoursArr.length > 0
        ? hoursArr.reduce((a: number, b: number) => a + b, 0) / hoursArr.length
        : 0;

    const absences = records.filter((r: any) => r.status === "ABSENT").length;
    const lates = records.filter((r: any) => r.status === "LATE").length;

    return { attendancePct, avgHours, absences, lates };
  }, [records]);

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Asistencia
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control de asistencia y puntualidad del personal
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              data={{
                label: "% Asistencia",
                value: summary.attendancePct,
                previousValue: 0,
                changePercent: 0,
                format: "percent",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <KpiCard
              data={{
                label: "Horas Promedio",
                value: summary.avgHours,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: true,
              }}
            />
            <KpiCard
              data={{
                label: "Faltas",
                value: summary.absences,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: false,
              }}
            />
            <KpiCard
              data={{
                label: "Retardos",
                value: summary.lates,
                previousValue: 0,
                changePercent: 0,
                format: "number",
                trend: "neutral",
                trendIsPositive: false,
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
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <ClipboardList className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay registros de asistencia para los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  "Fecha",
                  "Empleado",
                  "Turno",
                  "Entrada",
                  "Salida",
                  "Horas",
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
              {records.map((r: any) => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PRESENT;
                return (
                  <tr
                    key={r.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {r.date
                        ? new Date(r.date).toLocaleDateString("es-MX")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {r.shift?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {r.clockIn
                        ? new Date(r.clockIn).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {r.clockOut
                        ? new Date(r.clockOut).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">
                      {r.hoursWorked != null ? r.hoursWorked.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}
                      >
                        {cfg.label}
                      </span>
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

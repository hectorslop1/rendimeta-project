"use client";

import { useState } from "react";
import { useHourlyTracking } from "@/hooks/use-hr-data";
import { useStations } from "@/hooks/use-kpi-data";
import { HourlyTrackingGrid } from "@/components/domain/hr/hourly-tracking-grid";
import { Loader2, Clock, Building2 } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function SeguimientoHorarioPage() {
  const [date, setDate] = useState(todayISO());
  const [stationId, setStationId] = useState("");
  const { data: stations } = useStations();
  const { data, isLoading } = useHourlyTracking(
    stationId || undefined,
    date
  );

  const stationsArr = Array.isArray(stations) ? stations : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Seguimiento Horario
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitoreo en tiempo real del desempeno por hora de cada empleado
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Estacion
          </label>
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar estacion...</option>
            {stationsArr.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {!stationId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Building2 className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            Selecciona una estacion para ver el seguimiento horario
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : !data || !data.rows || data.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Clock className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay datos de seguimiento para esta fecha y estacion
          </p>
        </div>
      ) : (
        <HourlyTrackingGrid
          rows={data.rows}
          stationTotals={data.stationTotals}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Leyenda:
        </span>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/30" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Verde (&ge;90%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-100 dark:bg-amber-900/30" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Amarillo (80-89%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900/30" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Rojo (&lt;80%)
          </span>
        </div>
      </div>
    </div>
  );
}

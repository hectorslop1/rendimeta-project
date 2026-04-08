"use client";

import { useState } from "react";
import { useShiftAnalysis } from "@/hooks/use-hr-data";
import { useStations } from "@/hooks/use-kpi-data";
import { ShiftPerformanceCard } from "@/components/domain/hr/shift-performance-card";
import { Loader2, Clock } from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function monthAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
}

export default function AnalisisTurnosPage() {
  const [stationId, setStationId] = useState("");
  const [dateFrom, setDateFrom] = useState(monthAgoISO());
  const [dateTo, setDateTo] = useState(todayISO());

  const { data: stations } = useStations();
  const { data, isLoading } = useShiftAnalysis(
    stationId || undefined,
    dateFrom,
    dateTo
  );

  const stationsArr = Array.isArray(stations) ? stations : [];
  const shifts = (() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  })();

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Analisis por Turnos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comparacion de rendimiento entre turnos de trabajo
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
      ) : shifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Clock className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">
            No hay datos de analisis de turnos disponibles
          </p>
          <p className="mt-1 text-xs">
            Selecciona una estacion y rango de fechas para ver los resultados
          </p>
        </div>
      ) : (
        <ShiftPerformanceCard shifts={shifts} />
      )}
    </div>
  );
}

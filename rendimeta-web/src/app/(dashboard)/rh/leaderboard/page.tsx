"use client";

import { useState } from "react";
import { useLeaderboard } from "@/hooks/use-hr-data";
import { useFilters } from "@/providers/filter-provider";
import { LeaderboardTable } from "@/components/domain/hr/leaderboard-table";
import { ClassificationBadge } from "@/components/domain/hr/classification-badge";
import { formatCurrency } from "@/lib/formatters";
import { Loader2, Trophy } from "lucide-react";

const SCOPES = [
  { value: "global", label: "Global" },
  { value: "state", label: "Por Estado" },
  { value: "city", label: "Por Ciudad" },
  { value: "station", label: "Por Estacion" },
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PODIUM_STYLES = [
  {
    ring: "ring-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    medal: "1ro",
    size: "h-20 w-20",
    order: "order-2",
  },
  {
    ring: "ring-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
    medal: "2do",
    size: "h-16 w-16",
    order: "order-1",
  },
  {
    ring: "ring-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    medal: "3ro",
    size: "h-16 w-16",
    order: "order-3",
  },
];

export default function LeaderboardPage() {
  const { filters } = useFilters();
  const [scope, setScope] = useState("global");
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading } = useLeaderboard({
    scope,
    stationId: filters.stationId,
    stateId: filters.stateId,
    cityId: filters.cityId,
    month,
  });

  const entries = Array.isArray(data) ? data : [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Rankings de desempeno de empleados
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Scope tabs */}
        <div className="flex rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                scope === s.value
                  ? "bg-rose-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Trophy className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">No hay datos de ranking disponibles</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-6 py-8">
            {top3.map((entry: any, idx: number) => {
              const style = PODIUM_STYLES[idx];
              if (!style) return null;
              return (
                <div
                  key={entry.employee.id}
                  className={`flex flex-col items-center ${style.order}`}
                >
                  <div
                    className={`flex ${style.size} items-center justify-center rounded-full ring-4 ${style.ring} ${style.bg} mb-2`}
                  >
                    <span className={`text-lg font-bold ${style.text}`}>
                      {style.medal}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">
                    {entry.employee.firstName} {entry.employee.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.station.name}
                  </p>
                  <p className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-400">
                    {entry.fulfillmentPct.toFixed(1)}%
                  </p>
                  <ClassificationBadge
                    classification={
                      entry.classification as
                        | "PREMIUM"
                        | "PRODUCTIVE"
                        | "TRANSITION"
                        | "NON_PRODUCTIVE"
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Full Table */}
          <LeaderboardTable entries={entries} />
        </>
      )}
    </div>
  );
}

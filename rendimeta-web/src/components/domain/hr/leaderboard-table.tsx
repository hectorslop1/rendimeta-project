"use client";

import { formatCurrency } from "@/lib/formatters";
import { ClassificationBadge } from "./classification-badge";

interface LeaderboardEntry {
  rank: number;
  employee: { id: string; firstName: string; lastName: string };
  station: { id: string; name: string };
  classification: string;
  fulfillmentPct: number;
  totalSales: number;
  points: number;
  trend: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg" title="Oro">🥇</span>;
  if (rank === 2) return <span className="text-lg" title="Plata">🥈</span>;
  if (rank === 3) return <span className="text-lg" title="Bronce">🥉</span>;
  return (
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {rank}
    </span>
  );
}

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
          />
        </svg>
        <span className="text-xs font-medium">+{trend}</span>
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"
          />
        </svg>
        <span className="text-xs font-medium">{trend}</span>
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">&mdash;</span>
  );
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {["#", "Empleado", "Estacion", "Clasificacion", "% Cumplimiento", "Ventas", "Puntos", "Tendencia"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {entries.map((entry) => (
            <tr
              key={entry.employee.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <td className="px-3 py-2 text-center">
                <MedalIcon rank={entry.rank} />
              </td>
              <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {entry.employee.firstName} {entry.employee.lastName}
              </td>
              <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {entry.station.name}
              </td>
              <td className="px-3 py-2">
                <ClassificationBadge
                  classification={
                    entry.classification as
                      | "PREMIUM"
                      | "PRODUCTIVE"
                      | "TRANSITION"
                      | "NON_PRODUCTIVE"
                  }
                />
              </td>
              <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {entry.fulfillmentPct.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {formatCurrency(entry.totalSales)}
              </td>
              <td className="px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
                {entry.points.toLocaleString("es-MX")}
              </td>
              <td className="px-3 py-2">
                <TrendArrow trend={entry.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

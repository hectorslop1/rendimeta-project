"use client";

import { formatCurrency } from "@/lib/formatters";
import { TrafficLightCell } from "./traffic-light-cell";

interface HourData {
  hour: number;
  totalRevenue: number;
  fulfillmentPct: number;
}

interface RowData {
  employee: { id: string; firstName: string; lastName: string };
  hours: HourData[];
  dayTotal: number;
  monthAccumulated: number;
  monthFulfillmentPct: number;
}

interface HourlyTrackingGridProps {
  rows: RowData[];
  stationTotals: Record<number, number>;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

function getTrafficBg(pct: number) {
  if (pct >= 90) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
  if (pct >= 80) return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
}

export function HourlyTrackingGrid({
  rows,
  stationTotals,
}: HourlyTrackingGridProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-max w-full border-collapse text-xs">
        {/* Header */}
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">
              Empleado
            </th>
            {HOURS.map((h) => (
              <th
                key={h}
                className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 min-w-[72px]"
              >
                {h.toString().padStart(2, "0")}:00
              </th>
            ))}
            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 min-w-[90px]">
              Total Dia
            </th>
            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">
              Acumulado Mes
            </th>
            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 min-w-[70px]">
              % Mes
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.map((row) => {
            // Build a map for quick hour lookup
            const hourMap = new Map(row.hours.map((h) => [h.hour, h]));

            return (
              <tr
                key={row.employee.id}
                className="bg-white hover:bg-gray-50/50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
              >
                {/* Sticky employee name */}
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-1.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {row.employee.firstName} {row.employee.lastName}
                </td>

                {/* Hourly cells */}
                {HOURS.map((h) => {
                  const data = hourMap.get(h);
                  if (!data) {
                    return (
                      <td
                        key={h}
                        className="px-1 py-1.5 text-center text-gray-300 dark:text-gray-600"
                      >
                        &mdash;
                      </td>
                    );
                  }
                  return (
                    <TrafficLightCell
                      key={h}
                      value={data.totalRevenue}
                      fulfillmentPct={data.fulfillmentPct}
                    />
                  );
                })}

                {/* Day total */}
                <td className="px-2 py-1.5 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {formatCurrency(row.dayTotal)}
                </td>

                {/* Month accumulated */}
                <td className="px-2 py-1.5 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {formatCurrency(row.monthAccumulated)}
                </td>

                {/* Month fulfillment % */}
                <td
                  className={`px-2 py-1.5 text-right font-semibold whitespace-nowrap ${getTrafficBg(row.monthFulfillmentPct)}`}
                >
                  {row.monthFulfillmentPct.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Footer with station totals */}
        <tfoot>
          <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
            <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100">
              Total Estacion
            </td>
            {HOURS.map((h) => (
              <td
                key={h}
                className="px-1 py-2 text-right text-gray-800 dark:text-gray-200 whitespace-nowrap"
              >
                {stationTotals[h] != null
                  ? formatCurrency(stationTotals[h])
                  : "\u2014"}
              </td>
            ))}
            <td className="px-2 py-2" />
            <td className="px-2 py-2" />
            <td className="px-2 py-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

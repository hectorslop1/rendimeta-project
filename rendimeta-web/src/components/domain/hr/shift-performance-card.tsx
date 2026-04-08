"use client";

import { formatCurrency } from "@/lib/formatters";

interface Shift {
  name: string;
  avgFulfillmentPct: number;
  totalRevenue: number;
  employeeCount: number;
}

interface ShiftPerformanceCardProps {
  shifts: Shift[];
}

function getFulfillmentColor(pct: number) {
  if (pct >= 90) return "text-green-600 dark:text-green-400";
  if (pct >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getFulfillmentBg(pct: number) {
  if (pct >= 90) return "bg-green-50 dark:bg-green-900/20";
  if (pct >= 80) return "bg-amber-50 dark:bg-amber-900/20";
  return "bg-red-50 dark:bg-red-900/20";
}

export function ShiftPerformanceCard({ shifts }: ShiftPerformanceCardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shifts.map((shift, idx) => (
        <div
          key={`${shift.name}-${idx}`}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {shift.name}
          </h4>

          {/* Fulfillment */}
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-center ${getFulfillmentBg(shift.avgFulfillmentPct)}`}
          >
            <span
              className={`text-2xl font-bold ${getFulfillmentColor(shift.avgFulfillmentPct)}`}
            >
              {shift.avgFulfillmentPct.toFixed(1)}%
            </span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Cumplimiento promedio
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Ingresos
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(shift.totalRevenue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Empleados
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {shift.employeeCount}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

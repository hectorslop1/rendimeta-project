"use client";

import { ClassificationBadge } from "./classification-badge";

interface Category {
  name: string;
  pct: number;
}

interface EmployeePerformanceCardProps {
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  classification: string;
  fulfillmentPct: number;
  categories: Category[];
}

function RingProgress({ pct, label }: { pct: number; label: string }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  const color =
    pct >= 90
      ? "stroke-green-500"
      : pct >= 80
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="68" height="68" className="-rotate-90">
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="absolute text-xs font-bold text-gray-900 dark:text-gray-100">
        {pct.toFixed(0)}%
      </span>
      <span className="text-[10px] leading-tight text-center text-gray-600 dark:text-gray-400 max-w-[72px] truncate">
        {label}
      </span>
    </div>
  );
}

export function EmployeePerformanceCard({
  employee,
  classification,
  fulfillmentPct,
  categories,
}: EmployeePerformanceCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            #{employee.employeeNumber}
          </p>
        </div>
        <ClassificationBadge
          classification={
            classification as
              | "PREMIUM"
              | "PRODUCTIVE"
              | "TRANSITION"
              | "NON_PRODUCTIVE"
          }
        />
      </div>

      {/* Overall fulfillment */}
      <div className="mb-4 text-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {fulfillmentPct.toFixed(1)}%
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Cumplimiento general
        </p>
      </div>

      {/* Category rings */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.name} className="relative flex flex-col items-center">
            <RingProgress pct={cat.pct} label={cat.name} />
          </div>
        ))}
      </div>
    </div>
  );
}

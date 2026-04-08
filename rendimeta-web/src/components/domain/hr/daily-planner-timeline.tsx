"use client";

import { formatCurrency } from "@/lib/formatters";

interface TimelineSlot {
  hour: number;
  fulfillmentPct: number;
  actualRevenue: number;
  targetRevenue: number;
}

interface DailyPlannerTimelineProps {
  slots: TimelineSlot[];
}

function getSlotColor(pct: number) {
  if (pct >= 90)
    return "bg-green-500 dark:bg-green-600 text-white";
  if (pct >= 80)
    return "bg-amber-400 dark:bg-amber-600 text-gray-900 dark:text-white";
  return "bg-red-500 dark:bg-red-600 text-white";
}

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function DailyPlannerTimeline({ slots }: DailyPlannerTimelineProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {slots.map((slot) => {
          const color = getSlotColor(slot.fulfillmentPct);
          return (
            <div
              key={slot.hour}
              className="flex flex-col items-center"
              title={`${formatHour(slot.hour)} — ${slot.fulfillmentPct.toFixed(1)}% | Meta: ${formatCurrency(slot.targetRevenue)}`}
            >
              {/* Hour label */}
              <span className="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {formatHour(slot.hour)}
              </span>
              {/* Block */}
              <div
                className={`flex h-14 w-16 items-center justify-center rounded-md text-[10px] font-semibold leading-tight ${color}`}
              >
                <div className="text-center">
                  <div>{formatCurrency(slot.actualRevenue)}</div>
                  <div className="opacity-75">{slot.fulfillmentPct.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

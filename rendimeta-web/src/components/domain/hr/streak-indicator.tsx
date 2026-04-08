"use client";

interface StreakIndicatorProps {
  current: number;
  best: number;
}

export function StreakIndicator({ current, best }: StreakIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 dark:bg-orange-900/20 ${
          current > 0 ? "animate-pulse" : ""
        }`}
      >
        <span className="text-xl" role="img" aria-label="racha">
          🔥
        </span>
        <span
          className={`text-lg font-bold ${
            current > 0
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {current}
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Mejor: <span className="font-semibold">{best}</span>
      </span>
    </div>
  );
}

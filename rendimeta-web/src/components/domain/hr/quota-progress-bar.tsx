"use client";

interface Tier {
  min: number;
  max: number;
  color: string;
}

interface QuotaProgressBarProps {
  currentPct: number;
  tiers?: Tier[];
}

const DEFAULT_TIERS: Tier[] = [
  { min: 0, max: 79, color: "bg-red-500" },
  { min: 80, max: 89, color: "bg-amber-500" },
  { min: 90, max: 119, color: "bg-green-500" },
  { min: 120, max: 150, color: "bg-yellow-400" },
];

export function QuotaProgressBar({
  currentPct,
  tiers = DEFAULT_TIERS,
}: QuotaProgressBarProps) {
  const maxVal = Math.max(...tiers.map((t) => t.max), currentPct);
  const clampedPct = Math.min(currentPct, maxVal);
  const markerPosition = (clampedPct / maxVal) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>0%</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {currentPct.toFixed(1)}%
        </span>
        <span>{maxVal}%</span>
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {/* Tier segments */}
        {tiers.map((tier) => {
          const left = (tier.min / maxVal) * 100;
          const width = ((tier.max - tier.min) / maxVal) * 100;
          return (
            <div
              key={`${tier.min}-${tier.max}`}
              className={`absolute top-0 h-full ${tier.color} opacity-30`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Filled bar up to current */}
        {tiers.map((tier) => {
          if (currentPct <= tier.min) return null;
          const fillEnd = Math.min(currentPct, tier.max);
          const left = (tier.min / maxVal) * 100;
          const width = ((fillEnd - tier.min) / maxVal) * 100;
          return (
            <div
              key={`fill-${tier.min}`}
              className={`absolute top-0 h-full ${tier.color}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-900 dark:bg-white"
          style={{ left: `${markerPosition}%` }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-white" />
        </div>
      </div>
    </div>
  );
}

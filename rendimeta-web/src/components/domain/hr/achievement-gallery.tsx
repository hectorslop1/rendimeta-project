"use client";

import { AchievementBadge } from "./achievement-badge";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconEmoji: string;
  pointValue: number;
  earned: boolean;
  earnedAt?: string;
}

interface AchievementGalleryProps {
  achievements: Achievement[];
}

export function AchievementGallery({ achievements }: AchievementGalleryProps) {
  const sorted = [...achievements].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((ach) => (
        <div key={ach.id} className="group relative">
          <AchievementBadge
            emoji={ach.iconEmoji}
            name={ach.name}
            earned={ach.earned}
            earnedAt={ach.earnedAt}
          />
          {/* Tooltip with description on hover */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
            <p>{ach.description}</p>
            <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400">
              +{ach.pointValue} pts
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

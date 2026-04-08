"use client";

interface AchievementBadgeProps {
  emoji: string;
  name: string;
  earned: boolean;
  earnedAt?: string;
}

export function AchievementBadge({
  emoji,
  name,
  earned,
  earnedAt,
}: AchievementBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
        earned
          ? "border-rose-200 bg-white shadow-sm dark:border-rose-800 dark:bg-gray-800"
          : "border-gray-200 bg-gray-50 opacity-50 grayscale dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      <span className="text-2xl" role="img" aria-label={name}>
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold truncate ${
            earned
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-500"
          }`}
        >
          {name}
        </p>
        {earned && earnedAt && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {new Date(earnedAt).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

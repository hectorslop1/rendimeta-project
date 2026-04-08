"use client";

type Classification = "PREMIUM" | "PRODUCTIVE" | "TRANSITION" | "NON_PRODUCTIVE";

interface ClassificationBadgeProps {
  classification: Classification;
}

const CONFIG: Record<
  Classification,
  { label: string; classes: string }
> = {
  PREMIUM: {
    label: "Premium",
    classes:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  },
  PRODUCTIVE: {
    label: "Productivo",
    classes:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  },
  TRANSITION: {
    label: "Transicion",
    classes:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  },
  NON_PRODUCTIVE: {
    label: "No Productivo",
    classes:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  },
};

export function ClassificationBadge({
  classification,
}: ClassificationBadgeProps) {
  const cfg = CONFIG[classification];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

interface StatusBadgeProps {
  active: boolean;
  labels?: { active: string; inactive: string };
}

export function StatusBadge({
  active,
  labels = { active: "Activo", inactive: "Inactivo" },
}: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          active ? "bg-green-500" : "bg-red-400"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          active
            ? "text-green-700 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {active ? labels.active : labels.inactive}
      </span>
    </span>
  );
}

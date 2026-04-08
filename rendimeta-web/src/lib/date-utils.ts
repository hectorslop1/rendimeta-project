import {
  format,
  subDays,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDateLabel(
  date: string | Date,
  granularity: "daily" | "weekly" | "monthly" = "daily"
): string {
  // Parse "YYYY-MM-DD" strings as local date (not UTC) by appending T12:00:00
  const d =
    typeof date === "string"
      ? new Date(date.length === 10 ? `${date}T12:00:00` : date)
      : date;
  switch (granularity) {
    case "monthly":
      return format(d, "MMM yyyy", { locale: es });
    case "weekly":
      return `Sem ${format(d, "w, MMM yyyy", { locale: es })}`;
    default:
      return format(d, "dd MMM", { locale: es });
  }
}

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = subDays(to, 30);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

export function getDateRangePreset(
  preset: "7d" | "30d" | "90d" | "6m" | "1y"
): { from: string; to: string } {
  const to = new Date();
  let from: Date;
  switch (preset) {
    case "7d":
      from = subDays(to, 7);
      break;
    case "30d":
      from = subDays(to, 30);
      break;
    case "90d":
      from = subDays(to, 90);
      break;
    case "6m":
      from = subMonths(to, 6);
      break;
    case "1y":
      from = subMonths(to, 12);
      break;
  }
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

export { startOfWeek, startOfMonth, endOfMonth, format };

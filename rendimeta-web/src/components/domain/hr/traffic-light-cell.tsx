"use client";

interface TrafficLightCellProps {
  value: number;
  fulfillmentPct: number;
  label?: string;
}

function getTrafficColors(pct: number) {
  if (pct >= 90) {
    return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
  }
  if (pct >= 80) {
    return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
  }
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
}

export function TrafficLightCell({
  value,
  fulfillmentPct,
  label,
}: TrafficLightCellProps) {
  const colors = getTrafficColors(fulfillmentPct);

  return (
    <td
      className={`px-2 py-1.5 text-right text-sm font-medium whitespace-nowrap ${colors}`}
      title={`${fulfillmentPct.toFixed(1)}% cumplimiento`}
    >
      {label && (
        <span className="block text-[10px] font-normal opacity-70">
          {label}
        </span>
      )}
      {value.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}
    </td>
  );
}

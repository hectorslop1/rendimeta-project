const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return mxnFormatter.format(value ?? 0);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value ?? 0);
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value ?? 0);
}

export function formatPercent(value: number): string {
  return `${(value ?? 0).toFixed(1)}%`;
}

export function formatLiters(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M L`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K L`;
  }
  return `${numberFormatter.format(value)} L`;
}

export function formatKpiValue(
  value: number,
  format: "number" | "currency" | "percent" | "liters"
): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "liters":
      return formatLiters(value);
    default:
      return formatNumber(value);
  }
}

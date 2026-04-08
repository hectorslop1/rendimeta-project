"use client";

import { useState, useMemo } from "react";
import { useTrends } from "@/hooks/use-kpi-data";
import { DashboardLineChart } from "@/components/charts";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { KPI_CATEGORIES } from "@/lib/constants";
import type { KpiCategory } from "@/types";

const METRIC_OPTIONS: Record<string, { value: string; label: string }[]> = {
  operational: [
    { value: "fuelVolumeLiters", label: "Volumen de Combustible (L)" },
    { value: "tankUtilizationPct", label: "Utilización de Tanques (%)" },
    { value: "pumpThroughput", label: "Throughput por Bomba" },
    { value: "dispatchAccuracyPct", label: "Precisión de Despacho (%)" },
  ],
  financial: [
    { value: "totalRevenueMxn", label: "Ingreso Total (MXN)" },
    { value: "fuelGrossMarginPct", label: "Margen Bruto (%)" },
    { value: "ebitdaMxn", label: "EBITDA (MXN)" },
    { value: "operatingCostsPct", label: "Costos Operativos (%)" },
  ],
  productivity: [
    { value: "salesPerLaborHour", label: "Ventas/Hora-Trabajo" },
    { value: "transactionsPerHour", label: "Transacciones/Hora" },
    { value: "staffEfficiencyPct", label: "Eficiencia de Personal (%)" },
  ],
  inventory: [
    { value: "inventoryTurnover", label: "Rotación de Inventario" },
    { value: "shrinkagePct", label: "Merma (%)" },
    { value: "deliveryEfficiencyPct", label: "Eficiencia de Entregas (%)" },
  ],
  customer: [
    { value: "customerTraffic", label: "Tráfico de Clientes" },
    { value: "averageTicketMxn", label: "Ticket Promedio (MXN)" },
    { value: "npsScore", label: "NPS" },
  ],
  compliance: [
    { value: "regulatoryCompliancePct", label: "Cumplimiento Regulatorio (%)" },
    { value: "safetyIncidents", label: "Incidentes de Seguridad" },
    { value: "preventiveMaintenancePct", label: "Mantenimiento Preventivo (%)" },
  ],
  environmental: [
    { value: "vocEmissionsKg", label: "Emisiones COV (kg)" },
    { value: "waterContentPct", label: "Contenido de Agua (%)" },
    { value: "energyConsumptionKwh", label: "Consumo Energético (kWh)" },
  ],
};

type Granularity = "daily" | "weekly" | "monthly";

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

const selectClasses =
  "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";

export default function TendenciasPage() {
  const [category, setCategory] = useState<KpiCategory>("operational");
  const [metric, setMetric] = useState("fuelVolumeLiters");
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const { data: trendData, isLoading, error } = useTrends(category, metric, granularity);

  const currentMetrics = METRIC_OPTIONS[category] || [];

  const selectedMetricLabel = useMemo(
    () => currentMetrics.find((m) => m.value === metric)?.label || metric,
    [currentMetrics, metric]
  );

  const selectedCategoryColor = useMemo(
    () =>
      KPI_CATEGORIES.find((c) => c.key === category)?.color || "#3b82f6",
    [category]
  );

  const handleCategoryChange = (newCategory: KpiCategory) => {
    setCategory(newCategory);
    const newMetrics = METRIC_OPTIONS[newCategory];
    if (newMetrics && newMetrics.length > 0) {
      setMetric(newMetrics[0].value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tendencias
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Análisis de tendencias históricas
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error al cargar tendencias: {error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) =>
              handleCategoryChange(e.target.value as KpiCategory)
            }
            className={selectClasses}
          >
            {KPI_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Métrica
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className={selectClasses}
          >
            {currentMetrics.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Granularidad
          </label>
          <div className="flex rounded-lg border border-gray-300 shadow-sm dark:border-gray-600">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  granularity === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {selectedMetricLabel}
        </h2>
        {isLoading ? (
          <ChartSkeleton />
        ) : trendData && trendData.length > 0 ? (
          <DashboardLineChart
            data={trendData}
            dataKeys={[
              {
                key: "value",
                name: selectedMetricLabel,
                color: selectedCategoryColor,
              },
            ]}
            xAxisKey="label"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No hay datos disponibles para esta selección
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useOverviewKpis, useTrends, useRankings } from "@/hooks/use-kpi-data";
import { useFilters } from "@/providers/filter-provider";
import { KpiCard } from "@/components/domain/shared";
import { DashboardLineChart } from "@/components/charts";
import { KpiCardSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Map, Building2, Fuel, TrendingUp, TrendingDown } from "lucide-react";
import type { OverviewKpis } from "@/types";

const PERIOD_TO_GRANULARITY: Record<string, "daily" | "weekly" | "monthly"> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
};

const KPI_KEYS: (keyof OverviewKpis)[] = [
  "totalFuelVolume",
  "totalRevenue",
  "avgMargin",
  "avgNps",
  "avgDispatchAccuracy",
  "totalTransactions",
  "avgShrinkage",
  "avgCompliance",
];

const TREND_DATA_KEYS = [
  { key: "value", name: "Volumen (L)", color: "#3b82f6" },
];

export default function OverviewPage() {
  const { filters } = useFilters();
  const granularity = PERIOD_TO_GRANULARITY[filters.period] || "daily";
  const { data: overview, isLoading: isLoadingKpis } = useOverviewKpis();
  const { data: trendData, isLoading: isLoadingTrend } = useTrends(
    "operational",
    "fuelVolumeLiters",
    granularity
  );
  const { data: rankings, isLoading: isLoadingRankings } = useRankings();

  const kpis = overview as OverviewKpis | undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Vista General
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen de KPIs de todas las estaciones
        </p>
      </div>

      {/* Geographic Summary Cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoadingRankings ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : rankings?.geographic ? (
            <>
              <GeoCard
                icon={<Map className="h-8 w-8 text-rose-500" />}
                value={rankings.geographic.states}
                label="Estados"
                sublabel="Baja California, Chihuahua, Nayarit, Sinaloa, Sonora"
              />
              <GeoCard
                icon={<Building2 className="h-8 w-8 text-blue-500" />}
                value={rankings.geographic.cities}
                label="Ciudades"
                sublabel="Distribuidas en 5 estados"
              />
              <GeoCard
                icon={<Fuel className="h-8 w-8 text-emerald-500" />}
                value={rankings.geographic.stations}
                label="Estaciones"
                sublabel="Estaciones activas en operación"
              />
            </>
          ) : null}
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingKpis
            ? Array.from({ length: 8 }).map((_, i) => (
                <KpiCardSkeleton key={i} />
              ))
            : kpis &&
              KPI_KEYS.map((key) => (
                <KpiCard key={key} data={kpis[key]} />
              ))}
        </div>
      </section>

      {/* Trends Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Tendencias
        </h2>
        {isLoadingTrend ? (
          <ChartSkeleton height={350} />
        ) : (
          <DashboardLineChart
            data={(trendData as Record<string, unknown>[]) ?? []}
            dataKeys={TREND_DATA_KEYS}
            xAxisKey="label"
            title="Volumen de combustible"
            subtitle="Litros despachados por periodo"
            height={350}
            yAxisLabel="Litros"
          />
        )}
      </section>

      {/* Station Rankings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Ranking de Estaciones por Ingreso
        </h2>
        {isLoadingRankings ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        ) : rankings ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <RankingTable
              title="Top 5 Estaciones"
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              stations={rankings.top5}
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
            <RankingTable
              title="Bottom 5 Estaciones"
              icon={<TrendingDown className="h-5 w-5 text-red-500" />}
              stations={rankings.bottom5}
              colorClass="text-red-600 dark:text-red-400"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function GeoCard({
  icon,
  value,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {value}
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
      </div>
    </div>
  );
}

interface StationRank {
  id: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  totalRevenue: number;
  avgMargin: number;
}

function RankingTable({
  title,
  icon,
  stations,
  colorClass,
}: {
  title: string;
  icon: React.ReactNode;
  stations: StationRank[];
  colorClass: string;
}) {
  const maxRevenue = stations.length > 0 ? stations[0].totalRevenue : 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {stations.map((s, i) => {
          const barWidth = (s.totalRevenue / maxRevenue) * 100;
          return (
            <div key={s.id} className="relative px-5 py-3">
              {/* Revenue bar background */}
              <div
                className="absolute inset-y-0 left-0 bg-gray-50 dark:bg-gray-900/50"
                style={{ width: `${barWidth}%` }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.city}, {s.stateCode}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${colorClass}`}>
                    {formatCurrency(s.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Margen {formatPercent(s.avgMargin)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

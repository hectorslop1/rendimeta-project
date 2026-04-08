"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/providers/filter-provider";
import type { KpiCategory } from "@/types";

function buildQueryString(
  filters: ReturnType<typeof useFilters>["filters"],
  extra?: Record<string, string>
) {
  const params = new URLSearchParams();
  if (filters.stateId) params.set("stateId", filters.stateId);
  if (filters.cityId) params.set("cityId", filters.cityId);
  if (filters.stationId) params.set("stationId", filters.stationId);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.period) params.set("period", filters.period);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      params.set(k, v);
    }
  }
  return params.toString();
}

export function useOverviewKpis() {
  const { filters } = useFilters();
  const qs = buildQueryString(filters);

  return useQuery({
    queryKey: ["kpis", "overview", qs],
    queryFn: async () => {
      const res = await fetch(`/api/kpis/overview?${qs}`);
      if (!res.ok) throw new Error("Error fetching overview KPIs");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useKpiCategory(category: KpiCategory, groupBy?: string) {
  const { filters } = useFilters();
  const extra: Record<string, string> = {};
  if (groupBy) extra.groupBy = groupBy;
  const qs = buildQueryString(filters, extra);

  return useQuery({
    queryKey: ["kpis", category, qs],
    queryFn: async () => {
      const res = await fetch(`/api/kpis/${category}?${qs}`);
      if (!res.ok) throw new Error(`Error fetching ${category} KPIs`);
      const json = await res.json();
      return json.data;
    },
  });
}

export function useTrends(
  kpiCategory: KpiCategory,
  metric: string,
  granularity: "daily" | "weekly" | "monthly" = "daily"
) {
  const { filters } = useFilters();
  const qs = buildQueryString(filters, { kpiCategory, metric, granularity });

  return useQuery({
    queryKey: ["trends", kpiCategory, metric, granularity, qs],
    queryFn: async () => {
      const res = await fetch(`/api/trends?${qs}`);
      if (!res.ok) throw new Error("Error fetching trends");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useStations() {
  const { filters } = useFilters();
  const params = new URLSearchParams();
  if (filters.stateId) params.set("stateId", filters.stateId);
  if (filters.cityId) params.set("cityId", filters.cityId);
  const qs = params.toString();

  return useQuery({
    queryKey: ["stations", qs],
    queryFn: async () => {
      const res = await fetch(`/api/stations?${qs}`);
      if (!res.ok) throw new Error("Error fetching stations");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useStates() {
  return useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const res = await fetch("/api/states");
      if (!res.ok) throw new Error("Error fetching states");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useRankings() {
  const { filters } = useFilters();
  const qs = buildQueryString(filters);

  return useQuery({
    queryKey: ["kpis", "rankings", qs],
    queryFn: async () => {
      const res = await fetch(`/api/kpis/rankings?${qs}`);
      if (!res.ok) throw new Error("Error fetching rankings");
      const json = await res.json();
      return json.data;
    },
  });
}

export { buildQueryString };

"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCcw, Calendar, Filter, Pin, PinOff } from "lucide-react";
import { useFilters } from "@/providers/filter-provider";
import { cn } from "@/lib/utils";
import type { FilterOption, FilterState } from "@/types";

interface StationOption extends FilterOption {
  cityId: string;
  stateId: string;
}

interface StateOption extends FilterOption {
  cities: FilterOption[];
}

const PERIOD_OPTIONS: { value: FilterState["period"]; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

export function FilterBar() {
  const {
    filters,
    setStateId,
    setCityId,
    setStationId,
    setDateRange,
    setPeriod,
    resetFilters,
  } = useFilters();

  const [states, setStates] = useState<StateOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinned, setPinned] = useState(false);

  // Fetch states and stations
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [statesRes, stationsRes] = await Promise.all([
          fetch("/api/states"),
          fetch("/api/stations"),
        ]);
        if (statesRes.ok) {
          const statesData = await statesRes.json();
          setStates(statesData.data ?? statesData);
        }
        if (stationsRes.ok) {
          const stationsData = await stationsRes.json();
          setStations(stationsData.data ?? stationsData);
        }
      } catch {
        // Silently fail - selects will just be empty
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  // Derive cities from states
  const cities: FilterOption[] = filters.stateId
    ? (states.find((s) => s.value === filters.stateId)?.cities ?? [])
    : states.flatMap((s) => s.cities ?? []);

  // Derive filtered stations
  const filteredStations = stations.filter((s) => {
    if (filters.stationId && s.value === filters.stationId) return true;
    if (filters.cityId && s.cityId !== filters.cityId) return false;
    if (filters.stateId && s.stateId !== filters.stateId) return false;
    return true;
  });

  const handleDateFrom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange(e.target.value, filters.dateTo);
    },
    [filters.dateTo, setDateRange]
  );

  const handleDateTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange(filters.dateFrom, e.target.value);
    },
    [filters.dateFrom, setDateRange]
  );

  const selectClasses =
    "h-9 rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 text-sm text-[color:var(--foreground)] shadow-sm transition-colors focus:border-[color:var(--app-primary-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary-soft)]";

  const inputClasses =
    "h-9 rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 text-sm text-[color:var(--foreground)] shadow-sm transition-colors focus:border-[color:var(--app-primary-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--app-primary-soft)]";

  return (
    <div className={cn(
      "border-b border-[color:var(--app-panel-border)] px-4 py-3 transition-shadow lg:px-6",
      pinned
        ? "sticky top-0 z-30 bg-[color:var(--app-panel-bg)] shadow-md backdrop-blur-sm"
        : "bg-[color:var(--app-subtle-bg)]"
    )}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter icon label */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--muted-foreground)]">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </div>

        {/* State select */}
        <select
          value={filters.stateId ?? ""}
          onChange={(e) => setStateId(e.target.value || null)}
          className={cn(selectClasses, "w-40")}
          disabled={loading}
        >
          <option value="">Todos los estados</option>
          {states.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* City select */}
        <select
          value={filters.cityId ?? ""}
          onChange={(e) => setCityId(e.target.value || null)}
          className={cn(selectClasses, "w-40")}
          disabled={loading || cities.length === 0}
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Station select */}
        <select
          value={filters.stationId ?? ""}
          onChange={(e) => setStationId(e.target.value || null)}
          className={cn(selectClasses, "w-48")}
          disabled={loading || filteredStations.length === 0}
        >
          <option value="">Todas las estaciones</option>
          {filteredStations.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Separator */}
        <div className="hidden h-6 w-px bg-[color:var(--app-panel-border)] md:block" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[color:var(--muted-foreground)]" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={handleDateFrom}
            className={cn(inputClasses, "w-36")}
            aria-label="Fecha desde"
          />
          <span className="text-sm text-[color:var(--muted-foreground)]">—</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={handleDateTo}
            className={cn(inputClasses, "w-36")}
            aria-label="Fecha hasta"
          />
        </div>

        {/* Separator */}
        <div className="hidden h-6 w-px bg-[color:var(--app-panel-border)] md:block" />

        {/* Period toggle */}
        <div className="inline-flex rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg",
                filters.period === opt.value
                  ? "bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--foreground)]"
            aria-label="Restablecer filtros"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          {/* Pin/Unpin toggle */}
          <button
            onClick={() => setPinned((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              pinned
                ? "bg-[color:var(--app-primary-soft)] text-[color:var(--app-primary-strong)] hover:opacity-90"
                : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--foreground)]"
            )}
            aria-label={pinned ? "Desfijar filtros" : "Fijar filtros"}
            title={pinned ? "Desfijar filtros" : "Fijar filtros"}
          >
            {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

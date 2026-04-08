"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FilterState } from "@/types";
import { getDefaultDateRange } from "@/lib/date-utils";

interface FilterContextValue {
  filters: FilterState;
  setStateId: (id: string | null) => void;
  setCityId: (id: string | null) => void;
  setStationId: (id: string | null) => void;
  setDateRange: (from: string, to: string) => void;
  setPeriod: (period: FilterState["period"]) => void;
  resetFilters: () => void;
}

const defaultRange = getDefaultDateRange();

const defaultFilters: FilterState = {
  stateId: null,
  cityId: null,
  stationId: null,
  dateFrom: defaultRange.from,
  dateTo: defaultRange.to,
  period: "day",
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setStateId = useCallback((id: string | null) => {
    setFilters((prev) => ({
      ...prev,
      stateId: id,
      cityId: null,
      stationId: null,
    }));
  }, []);

  const setCityId = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, cityId: id, stationId: null }));
  }, []);

  const setStationId = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, stationId: id }));
  }, []);

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
  }, []);

  const setPeriod = useCallback((period: FilterState["period"]) => {
    setFilters((prev) => ({ ...prev, period }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setStateId,
        setCityId,
        setStationId,
        setDateRange,
        setPeriod,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

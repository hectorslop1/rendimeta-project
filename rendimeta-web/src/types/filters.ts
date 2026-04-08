export interface FilterState {
  stateId: string | null;
  cityId: string | null;
  stationId: string | null;
  dateFrom: string;
  dateTo: string;
  period: "day" | "week" | "month";
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface GroupedKpiData<T> {
  groupId: string;
  groupName: string;
  data: T;
}

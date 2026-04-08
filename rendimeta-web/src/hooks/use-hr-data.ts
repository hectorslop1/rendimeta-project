"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  HrOverviewKpis,
  HourlyTrackingRow,
  DailyPlannerSlot,
  LeaderboardEntry,
  PerformanceEvaluationRecord,
  CommissionPaymentRecord,
  AttendanceRecord,
  GamificationScoreRecord,
  SystemConfigRecord,
  QuotaTemplateRecord,
  CommissionRuleRecord,
  AchievementDefinitionRecord,
} from "@/types/hr";

function buildParams(params: Record<string, string | undefined | null>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  return qs.toString();
}

export function useHrOverview(stationId?: string | null) {
  const qs = buildParams({ stationId: stationId ?? undefined });
  return useQuery<HrOverviewKpis>({
    queryKey: ["hr-overview", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/overview?${qs}`);
      if (!res.ok) throw new Error("Error loading HR overview");
      const json = await res.json();
      // Normalize API shape → HrOverviewKpis
      const d = json.data ?? json;
      const cc = d.classificationCounts ?? {};
      const ft = d.fulfillmentTrend ?? {};
      return {
        totalActiveEmployees: d.activeEmployees ?? d.totalActiveEmployees ?? 0,
        avgFulfillmentPct: d.avgFulfillmentPct ?? 0,
        premiumCount: cc.PREMIUM ?? d.premiumCount ?? 0,
        productiveCount: cc.PRODUCTIVE ?? d.productiveCount ?? 0,
        transitionCount: cc.TRANSITION ?? d.transitionCount ?? 0,
        nonProductiveCount: cc.NON_PRODUCTIVE ?? d.nonProductiveCount ?? 0,
        fulfillmentTrend: ft.changePct ?? d.fulfillmentTrend ?? 0,
      } satisfies HrOverviewKpis;
    },
  });
}

export function useHourlyTracking(stationId?: string | null, date?: string) {
  const qs = buildParams({ stationId: stationId ?? undefined, date });
  return useQuery<{ rows: HourlyTrackingRow[]; stationTotals: Record<number, number> }>({
    queryKey: ["hr-hourly-tracking", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/hourly-tracking?${qs}`);
      if (!res.ok) throw new Error("Error loading hourly tracking");
      return res.json();
    },
    enabled: !!stationId && !!date,
  });
}

export function useDailyPlanner(employeeId?: string, date?: string) {
  const qs = buildParams({ employeeId, date });
  return useQuery<{ slots: DailyPlannerSlot[]; quotas: { categoryName: string; dailyTarget: number }[] }>({
    queryKey: ["hr-daily-planner", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/daily-planner?${qs}`);
      if (!res.ok) throw new Error("Error loading daily planner");
      return res.json();
    },
    enabled: !!employeeId && !!date,
  });
}

export function useLeaderboard(params: {
  scope?: string;
  stationId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  month?: string;
}) {
  const qs = buildParams({
    scope: params.scope,
    stationId: params.stationId ?? undefined,
    stateId: params.stateId ?? undefined,
    cityId: params.cityId ?? undefined,
    month: params.month,
  });
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["hr-leaderboard", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/leaderboard?${qs}`);
      if (!res.ok) throw new Error("Error loading leaderboard");
      return res.json();
    },
  });
}

export function usePerformanceTrend(employeeId?: string, stationId?: string | null, months = 6) {
  const qs = buildParams({
    employeeId,
    stationId: stationId ?? undefined,
    months: String(months),
  });
  return useQuery({
    queryKey: ["hr-performance-trend", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/performance-trend?${qs}`);
      if (!res.ok) throw new Error("Error loading performance trend");
      return res.json();
    },
  });
}

export function useCategoryAnalysis(params: {
  stationId?: string | null;
  employeeId?: string;
  from?: string;
  to?: string;
}) {
  const qs = buildParams({
    stationId: params.stationId ?? undefined,
    employeeId: params.employeeId,
    from: params.from,
    to: params.to,
  });
  return useQuery({
    queryKey: ["hr-category-analysis", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/category-analysis?${qs}`);
      if (!res.ok) throw new Error("Error loading category analysis");
      return res.json();
    },
  });
}

export function useStationComparison(stateId?: string | null, cityId?: string | null) {
  const qs = buildParams({
    stateId: stateId ?? undefined,
    cityId: cityId ?? undefined,
  });
  return useQuery({
    queryKey: ["hr-station-comparison", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/station-comparison?${qs}`);
      if (!res.ok) throw new Error("Error loading station comparison");
      return res.json();
    },
  });
}

export function useShiftAnalysis(stationId?: string | null, from?: string, to?: string) {
  const qs = buildParams({ stationId: stationId ?? undefined, from, to });
  return useQuery({
    queryKey: ["hr-shift-analysis", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/dashboard/shift-analysis?${qs}`);
      if (!res.ok) throw new Error("Error loading shift analysis");
      return res.json();
    },
  });
}

export function useEmployees(filters?: {
  search?: string;
  stationId?: string | null;
  roleId?: string;
  status?: string;
}) {
  const qs = buildParams({
    search: filters?.search,
    stationId: filters?.stationId ?? undefined,
    roleId: filters?.roleId,
    status: filters?.status,
  });
  return useQuery({
    queryKey: ["hr-employees", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees?${qs}`);
      if (!res.ok) throw new Error("Error loading employees");
      return res.json();
    },
  });
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ["hr-employee", id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees/${id}`);
      if (!res.ok) throw new Error("Error loading employee");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useEvaluations(month?: string, classification?: string) {
  const qs = buildParams({ month, classification });
  return useQuery<PerformanceEvaluationRecord[]>({
    queryKey: ["hr-evaluations", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/evaluations?${qs}`);
      if (!res.ok) throw new Error("Error loading evaluations");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useCommissionPayments(month?: string, employeeId?: string) {
  const qs = buildParams({ month, employeeId });
  return useQuery<CommissionPaymentRecord[]>({
    queryKey: ["hr-commission-payments", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/commissions/payments?${qs}`);
      if (!res.ok) throw new Error("Error loading commission payments");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useAttendanceSummary(stationId?: string | null, date?: string) {
  const qs = buildParams({ stationId: stationId ?? undefined, date });
  return useQuery<AttendanceRecord[]>({
    queryKey: ["hr-attendance", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/attendance?${qs}`);
      if (!res.ok) throw new Error("Error loading attendance");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useGamificationScores(employeeId?: string, month?: string) {
  const qs = buildParams({ employeeId, month });
  return useQuery<GamificationScoreRecord[]>({
    queryKey: ["hr-gamification-scores", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/gamification/scores?${qs}`);
      if (!res.ok) throw new Error("Error loading gamification scores");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["hr-roles"],
    queryFn: async () => {
      const res = await fetch("/api/hr/roles");
      if (!res.ok) throw new Error("Error loading roles");
      return res.json();
    },
  });
}

export function useShifts() {
  return useQuery({
    queryKey: ["hr-shifts"],
    queryFn: async () => {
      const res = await fetch("/api/hr/shifts");
      if (!res.ok) throw new Error("Error loading shifts");
      return res.json();
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["hr-categories"],
    queryFn: async () => {
      const res = await fetch("/api/hr/categories");
      if (!res.ok) throw new Error("Error loading categories");
      return res.json();
    },
  });
}

export function useProducts(categoryId?: string) {
  const qs = buildParams({ categoryId });
  return useQuery({
    queryKey: ["hr-products", qs],
    queryFn: async () => {
      const res = await fetch(`/api/hr/products?${qs}`);
      if (!res.ok) throw new Error("Error loading products");
      return res.json();
    },
  });
}

export function useQuotaTemplates() {
  return useQuery<QuotaTemplateRecord[]>({
    queryKey: ["hr-quota-templates"],
    queryFn: async () => {
      const res = await fetch("/api/hr/quotas/templates");
      if (!res.ok) throw new Error("Error loading quota templates");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useCommissionRules() {
  return useQuery<CommissionRuleRecord[]>({
    queryKey: ["hr-commission-rules"],
    queryFn: async () => {
      const res = await fetch("/api/hr/commissions/rules");
      if (!res.ok) throw new Error("Error loading commission rules");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useAchievements() {
  return useQuery<AchievementDefinitionRecord[]>({
    queryKey: ["hr-achievements"],
    queryFn: async () => {
      const res = await fetch("/api/hr/gamification/achievements");
      if (!res.ok) throw new Error("Error loading achievements");
      const data = await res.json();
      return data.data || data;
    },
  });
}

export function useSystemConfig() {
  return useQuery<SystemConfigRecord>({
    queryKey: ["system-config"],
    queryFn: async () => {
      const res = await fetch("/api/hr/config");
      if (!res.ok) throw new Error("Error loading config");
      return res.json();
    },
  });
}

export interface ShiftRecord {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
}

export interface EmployeeRecord {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: { id: string; name: string; level: number };
  shift: { id: string; name: string };
  station: { id: string; name: string };
  hireDate: string;
  terminationDate: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  avatarUrl: string | null;
}

export interface ProductCategoryRecord {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  category: { id: string; name: string; code: string };
  unitPrice: number;
  costPrice: number;
  unit: string;
  isActive: boolean;
}

export interface QuotaTemplateRecord {
  id: string;
  name: string;
  category: { id: string; name: string };
  station: { id: string; name: string } | null;
  roleId: string | null;
  monthlyTarget: number;
  isRevenue: boolean;
  isActive: boolean;
}

export interface QuotaAssignmentRecord {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  month: string;
  dailyTarget: number;
  monthlyTarget: number;
  categoryName: string;
}

export interface CommissionRuleRecord {
  id: string;
  name: string;
  category: { id: string; name: string };
  tierMinPct: number;
  tierMaxPct: number | null;
  commissionPct: number;
  commissionFixed: number | null;
  isActive: boolean;
}

export interface CommissionPaymentRecord {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  month: string;
  categoryName: string;
  salesAmount: number;
  quotaAmount: number;
  fulfillmentPct: number;
  commissionRate: number;
  commissionAmount: number;
  status: "CALCULATED" | "APPROVED" | "PAID";
}

export interface SaleRecordData {
  id: string;
  employeeId: string;
  productId: string;
  stationId: string;
  date: string;
  hour: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface AttendanceRecord {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  station: { id: string; name: string };
  shift: { id: string; name: string };
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "EARLY_LEAVE" | "DAY_OFF" | "VACATION" | "SICK_LEAVE";
  notes: string | null;
}

export interface PerformanceEvaluationRecord {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  evaluationMonth: string;
  overallFulfillmentPct: number;
  classification: "PREMIUM" | "PRODUCTIVE" | "TRANSITION" | "NON_PRODUCTIVE";
  fuelSalesAmount: number;
  peripheralSalesAmount: number;
  attendanceScore: number;
  notes: string | null;
  evaluatedBy: string | null;
}

export interface AchievementDefinitionRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  iconEmoji: string;
  category: string;
  pointValue: number;
  condition: Record<string, unknown>;
  isActive: boolean;
}

export interface EmployeeAchievementRecord {
  id: string;
  employeeId: string;
  achievement: AchievementDefinitionRecord;
  earnedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface GamificationScoreRecord {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  month: string;
  totalPoints: number;
  salesPoints: number;
  attendancePoints: number;
  streakPoints: number;
  bonusPoints: number;
  currentStreak: number;
  bestStreak: number;
  rank: number | null;
}

export interface HourlySalesCell {
  hour: number;
  totalUnits: number;
  totalRevenue: number;
  quotaTarget: number;
  fulfillmentPct: number;
}

export interface HourlyTrackingRow {
  employee: { id: string; firstName: string; lastName: string };
  hours: HourlySalesCell[];
  dayTotal: number;
  monthAccumulated: number;
  monthFulfillmentPct: number;
}

export interface LeaderboardEntry {
  rank: number;
  employee: { id: string; firstName: string; lastName: string };
  station: { id: string; name: string };
  classification: string;
  fulfillmentPct: number;
  totalSales: number;
  points: number;
  trend: number;
}

export interface HrOverviewKpis {
  totalActiveEmployees: number;
  avgFulfillmentPct: number;
  premiumCount: number;
  productiveCount: number;
  transitionCount: number;
  nonProductiveCount: number;
  fulfillmentTrend: number;
}

export interface DailyPlannerSlot {
  hour: number;
  targetUnits: number;
  targetRevenue: number;
  actualUnits: number;
  actualRevenue: number;
  fulfillmentPct: number;
  cumulativeTarget: number;
  cumulativeActual: number;
  cumulativePct: number;
}

export interface SystemConfigRecord {
  id: string;
  companyName: string;
  companyShortName: string;
  brandColor: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  operatingHoursStart: number;
  operatingHoursEnd: number;
}

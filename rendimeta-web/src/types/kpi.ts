export interface OperationalKpiData {
  date: string;
  fuelVolumeLiters: number;
  regularLiters: number;
  premiumLiters: number;
  dieselLiters: number;
  tankUtilizationPct: number;
  pumpThroughput: number;
  equipmentDowntimeMin: number;
  dispatchAccuracyPct: number;
}

export interface FinancialKpiData {
  date: string;
  fuelGrossMarginPct: number;
  fuelGrossMarginMxn: number;
  storeMarginPct: number;
  storeRevenueMxn: number;
  ebitdaMxn: number;
  totalRevenueMxn: number;
  operatingCostsMxn: number;
  operatingCostsPct: number;
}

export interface ProductivityKpiData {
  date: string;
  salesPerLaborHour: number;
  transactionsPerHour: number;
  pumpProductivity: number;
  staffEfficiencyPct: number;
  laborHours: number;
  totalTransactions: number;
}

export interface InventoryKpiData {
  date: string;
  inventoryTurnover: number;
  shrinkagePct: number;
  shrinkageLiters: number;
  daysOfInventory: number;
  deliveryEfficiencyPct: number;
  inventoryAccuracyPct: number;
}

export interface CustomerKpiData {
  date: string;
  customerTraffic: number;
  averageTicketMxn: number;
  storeConversionPct: number;
  npsScore: number;
  loyaltyParticipationPct: number;
}

export interface ComplianceKpiData {
  date: string;
  regulatoryCompliancePct: number;
  safetyIncidents: number;
  tankLeakTestsPassed: number;
  tankLeakTestsTotal: number;
  preventiveMaintenancePct: number;
  pendingMaintenanceTasks: number;
}

export interface EnvironmentalKpiData {
  date: string;
  vocEmissionsKg: number;
  waterContentPct: number;
  energyConsumptionKwh: number;
}

export type KpiCategory =
  | "operational"
  | "financial"
  | "productivity"
  | "inventory"
  | "customer"
  | "compliance"
  | "environmental";

export type AggregationPeriod = "day" | "week" | "month";

export type GroupBy = "station" | "city" | "state";

export interface KpiSummaryCard {
  label: string;
  value: number;
  previousValue: number;
  changePercent: number;
  format: "number" | "currency" | "percent" | "liters";
  trend: "up" | "down" | "neutral";
  trendIsPositive: boolean;
}

export interface OverviewKpis {
  totalFuelVolume: KpiSummaryCard;
  totalRevenue: KpiSummaryCard;
  avgMargin: KpiSummaryCard;
  avgNps: KpiSummaryCard;
  avgDispatchAccuracy: KpiSummaryCard;
  totalTransactions: KpiSummaryCard;
  avgShrinkage: KpiSummaryCard;
  avgCompliance: KpiSummaryCard;
}

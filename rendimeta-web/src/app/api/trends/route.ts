import { prisma } from "@/lib/prisma";
import {
  parseFilters,
  buildKpiWhere,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import type { KpiCategory, TrendDataPoint } from "@/types";
import { formatDateLabel } from "@/lib/date-utils";

const MODEL_MAP: Record<KpiCategory, keyof typeof prisma> = {
  operational: "operationalKpi",
  financial: "financialKpi",
  productivity: "productivityKpi",
  inventory: "inventoryKpi",
  customer: "customerKpi",
  compliance: "complianceKpi",
  environmental: "environmentalKpi",
};

// Fields that should be summed rather than averaged
const SUM_FIELDS = new Set([
  "fuelVolumeLiters",
  "regularLiters",
  "premiumLiters",
  "dieselLiters",
  "fuelGrossMarginMxn",
  "storeRevenueMxn",
  "ebitdaMxn",
  "totalRevenueMxn",
  "operatingCostsMxn",
  "laborHours",
  "totalTransactions",
  "shrinkageLiters",
  "customerTraffic",
  "safetyIncidents",
  "tankLeakTestsPassed",
  "tankLeakTestsTotal",
  "pendingMaintenanceTasks",
  "vocEmissionsKg",
  "energyConsumptionKwh",
  "equipmentDowntimeMin",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kpiCategory = url.searchParams.get("kpiCategory") as KpiCategory;
    const metric = url.searchParams.get("metric");
    const granularity = (url.searchParams.get("granularity") || "daily") as
      | "daily"
      | "weekly"
      | "monthly";

    if (!kpiCategory || !metric) {
      return errorResponse(
        "Se requieren los parámetros kpiCategory y metric",
        400
      );
    }

    if (!MODEL_MAP[kpiCategory]) {
      return errorResponse(`Categoría KPI inválida: ${kpiCategory}`, 400);
    }

    const filters = parseFilters(url);
    const where = buildKpiWhere(filters);

    const modelKey = MODEL_MAP[kpiCategory];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = prisma[modelKey] as any;

    const records = await model.findMany({
      where,
      orderBy: { date: "asc" },
    });

    // Group by date bucket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buckets = new Map<string, any[]>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of records as any[]) {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      let bucketKey: string;

      switch (granularity) {
        case "monthly":
          bucketKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
          break;
        case "weekly": {
          // ISO week start (Monday)
          const day = d.getUTCDay();
          const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d);
          monday.setUTCDate(diff);
          bucketKey = monday.toISOString().slice(0, 10);
          break;
        }
        default:
          bucketKey = d.toISOString().slice(0, 10);
      }

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(r);
    }

    const isSumField = SUM_FIELDS.has(metric);

    const data: TrendDataPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, entries]) => {
        const values = entries
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((e: any) => e[metric])
          .filter((v: unknown) => typeof v === "number");

        let value = 0;
        if (values.length > 0) {
          const sum = values.reduce((a: number, b: number) => a + b, 0);
          value = isSumField ? sum : sum / values.length;
        }

        return {
          date: dateKey,
          value: Math.round(value * 100) / 100,
          label: formatDateLabel(dateKey, granularity),
        };
      });

    return jsonResponse({ data });
  } catch (error) {
    console.error("GET /api/trends error:", error);
    return errorResponse("Error al obtener tendencias", 500);
  }
}

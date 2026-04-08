import { prisma } from "@/lib/prisma";
import {
  parseFilters,
  buildKpiWhere,
  buildPreviousPeriodWhere,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import type { KpiSummaryCard, OverviewKpis } from "@/types";

function makeSummaryCard(
  label: string,
  value: number,
  previousValue: number,
  format: KpiSummaryCard["format"],
  positiveIsGood = true
): KpiSummaryCard {
  const change =
    previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : 0;
  const trend: KpiSummaryCard["trend"] =
    Math.abs(change) < 0.1 ? "neutral" : change > 0 ? "up" : "down";
  const trendIsPositive =
    trend === "neutral" ? true : positiveIsGood ? trend === "up" : trend === "down";

  return {
    label,
    value,
    previousValue,
    changePercent: Math.round(change * 10) / 10,
    format,
    trend,
    trendIsPositive,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const currentWhere = buildKpiWhere(filters);
    const prevWhere = buildPreviousPeriodWhere(filters);

    // Run all aggregation queries in parallel
    const [
      opCurrent,
      opPrev,
      finCurrent,
      finPrev,
      prodCurrent,
      prodPrev,
      invCurrent,
      invPrev,
      custCurrent,
      custPrev,
      compCurrent,
      compPrev,
    ] = await Promise.all([
      prisma.operationalKpi.aggregate({
        where: currentWhere,
        _sum: { fuelVolumeLiters: true },
        _avg: { dispatchAccuracyPct: true },
      }),
      prisma.operationalKpi.aggregate({
        where: prevWhere,
        _sum: { fuelVolumeLiters: true },
        _avg: { dispatchAccuracyPct: true },
      }),
      prisma.financialKpi.aggregate({
        where: currentWhere,
        _sum: { totalRevenueMxn: true },
        _avg: { fuelGrossMarginPct: true },
      }),
      prisma.financialKpi.aggregate({
        where: prevWhere,
        _sum: { totalRevenueMxn: true },
        _avg: { fuelGrossMarginPct: true },
      }),
      prisma.productivityKpi.aggregate({
        where: currentWhere,
        _sum: { totalTransactions: true },
      }),
      prisma.productivityKpi.aggregate({
        where: prevWhere,
        _sum: { totalTransactions: true },
      }),
      prisma.inventoryKpi.aggregate({
        where: currentWhere,
        _avg: { shrinkagePct: true },
      }),
      prisma.inventoryKpi.aggregate({
        where: prevWhere,
        _avg: { shrinkagePct: true },
      }),
      prisma.customerKpi.aggregate({
        where: currentWhere,
        _avg: { npsScore: true },
      }),
      prisma.customerKpi.aggregate({
        where: prevWhere,
        _avg: { npsScore: true },
      }),
      prisma.complianceKpi.aggregate({
        where: currentWhere,
        _avg: { regulatoryCompliancePct: true },
      }),
      prisma.complianceKpi.aggregate({
        where: prevWhere,
        _avg: { regulatoryCompliancePct: true },
      }),
    ]);

    const overview: OverviewKpis = {
      totalFuelVolume: makeSummaryCard(
        "Volumen Total de Combustible",
        opCurrent._sum.fuelVolumeLiters ?? 0,
        opPrev._sum.fuelVolumeLiters ?? 0,
        "liters"
      ),
      totalRevenue: makeSummaryCard(
        "Ingreso Total",
        finCurrent._sum.totalRevenueMxn ?? 0,
        finPrev._sum.totalRevenueMxn ?? 0,
        "currency"
      ),
      avgMargin: makeSummaryCard(
        "Margen Promedio",
        finCurrent._avg.fuelGrossMarginPct ?? 0,
        finPrev._avg.fuelGrossMarginPct ?? 0,
        "percent"
      ),
      avgNps: makeSummaryCard(
        "NPS Promedio",
        custCurrent._avg.npsScore ?? 0,
        custPrev._avg.npsScore ?? 0,
        "number"
      ),
      avgDispatchAccuracy: makeSummaryCard(
        "Precisión de Despacho",
        opCurrent._avg.dispatchAccuracyPct ?? 0,
        opPrev._avg.dispatchAccuracyPct ?? 0,
        "percent"
      ),
      totalTransactions: makeSummaryCard(
        "Transacciones Totales",
        prodCurrent._sum.totalTransactions ?? 0,
        prodPrev._sum.totalTransactions ?? 0,
        "number"
      ),
      avgShrinkage: makeSummaryCard(
        "Merma Promedio",
        invCurrent._avg.shrinkagePct ?? 0,
        invPrev._avg.shrinkagePct ?? 0,
        "percent",
        false // lower shrinkage is better
      ),
      avgCompliance: makeSummaryCard(
        "Cumplimiento Regulatorio",
        compCurrent._avg.regulatoryCompliancePct ?? 0,
        compPrev._avg.regulatoryCompliancePct ?? 0,
        "percent"
      ),
    };

    return jsonResponse({ data: overview });
  } catch (error) {
    console.error("GET /api/kpis/overview error:", error);
    return errorResponse("Error al obtener resumen de KPIs", 500);
  }
}

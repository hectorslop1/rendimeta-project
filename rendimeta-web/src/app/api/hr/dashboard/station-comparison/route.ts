import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId") || undefined;
    const cityId = url.searchParams.get("cityId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stationWhere: Record<string, any> = { isActive: true };
    if (cityId) stationWhere.cityId = cityId;
    else if (stateId) stationWhere.city = { stateId };

    const stations = await prisma.station.findMany({
      where: stationWhere,
      select: { id: true, name: true },
    });

    // For each station, get HR metrics
    const stationIds = stations.map((s) => s.id);
    const stationNameMap = new Map(stations.map((s) => [s.id, s.name]));

    // Get employee counts
    const employees = await prisma.employee.findMany({
      where: { stationId: { in: stationIds }, status: "ACTIVE" },
      select: { id: true, stationId: true },
    });

    const empCountByStation = new Map<string, string[]>();
    for (const emp of employees) {
      const list = empCountByStation.get(emp.stationId) || [];
      list.push(emp.id);
      empCountByStation.set(emp.stationId, list);
    }

    // Get latest evaluations for these employees
    const allEmployeeIds = employees.map((e) => e.id);
    const latestEvals = await prisma.performanceEvaluation.findMany({
      where: { employeeId: { in: allEmployeeIds } },
      orderBy: { evaluationMonth: "desc" },
      distinct: ["employeeId"],
    });

    // Map employee to station for grouping
    const empStationMap = new Map(employees.map((e) => [e.id, e.stationId]));

    // Aggregate by station
    const stationMetrics = new Map<
      string,
      {
        fulfillmentSum: number;
        evalCount: number;
        premiumCount: number;
        nonProductiveCount: number;
        totalFuelSales: number;
        totalPeripheralSales: number;
      }
    >();

    for (const ev of latestEvals) {
      const sid = empStationMap.get(ev.employeeId);
      if (!sid) continue;

      const metrics = stationMetrics.get(sid) || {
        fulfillmentSum: 0,
        evalCount: 0,
        premiumCount: 0,
        nonProductiveCount: 0,
        totalFuelSales: 0,
        totalPeripheralSales: 0,
      };

      metrics.fulfillmentSum += ev.overallFulfillmentPct;
      metrics.evalCount++;
      if (ev.classification === "PREMIUM") metrics.premiumCount++;
      if (ev.classification === "NON_PRODUCTIVE") metrics.nonProductiveCount++;
      metrics.totalFuelSales += ev.fuelSalesAmount;
      metrics.totalPeripheralSales += ev.peripheralSalesAmount;

      stationMetrics.set(sid, metrics);
    }

    const comparison = stations
      .map((station) => {
        const empCount = empCountByStation.get(station.id)?.length ?? 0;
        const metrics = stationMetrics.get(station.id);
        const avgFulfillmentPct =
          metrics && metrics.evalCount > 0
            ? Math.round((metrics.fulfillmentSum / metrics.evalCount) * 100) / 100
            : 0;
        const premiumPct =
          empCount > 0 && metrics
            ? Math.round((metrics.premiumCount / empCount) * 10000) / 100
            : 0;
        const nonProductivePct =
          empCount > 0 && metrics
            ? Math.round((metrics.nonProductiveCount / empCount) * 10000) / 100
            : 0;

        return {
          stationId: station.id,
          stationName: stationNameMap.get(station.id) ?? "",
          employeeCount: empCount,
          avgFulfillmentPct,
          premiumPct,
          nonProductivePct,
          totalSales: metrics
            ? Math.round((metrics.totalFuelSales + metrics.totalPeripheralSales) * 100) / 100
            : 0,
        };
      })
      .sort((a, b) => b.avgFulfillmentPct - a.avgFulfillmentPct);

    return jsonResponse({ data: comparison });
  } catch (error) {
    console.error("GET /api/hr/dashboard/station-comparison error:", error);
    return errorResponse("Error al obtener comparación de estaciones", 500);
  }
}

import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeWhere: Record<string, any> = { status: "ACTIVE" };
    if (stationId) employeeWhere.stationId = stationId;

    // Active employee count
    const activeEmployees = await prisma.employee.count({ where: employeeWhere });

    // Get latest PerformanceEvaluation per employee
    const latestEvals = await prisma.performanceEvaluation.findMany({
      where: stationId
        ? { employee: { stationId, status: "ACTIVE" } }
        : { employee: { status: "ACTIVE" } },
      orderBy: { evaluationMonth: "desc" },
      distinct: ["employeeId"],
    });

    // Average fulfillment %
    const avgFulfillmentPct =
      latestEvals.length > 0
        ? latestEvals.reduce((sum, e) => sum + e.overallFulfillmentPct, 0) /
          latestEvals.length
        : 0;

    // Count by classification
    const classificationCounts = {
      PREMIUM: 0,
      PRODUCTIVE: 0,
      TRANSITION: 0,
      NON_PRODUCTIVE: 0,
    };
    for (const ev of latestEvals) {
      classificationCounts[ev.classification]++;
    }

    // Fulfillment trend: current month avg vs previous month avg
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evalFilter: Record<string, any> = {};
    if (stationId) evalFilter.employee = { stationId };

    const [currentMonthAgg, prevMonthAgg] = await Promise.all([
      prisma.performanceEvaluation.aggregate({
        where: {
          ...evalFilter,
          evaluationMonth: { gte: currentMonthStart },
        },
        _avg: { overallFulfillmentPct: true },
      }),
      prisma.performanceEvaluation.aggregate({
        where: {
          ...evalFilter,
          evaluationMonth: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _avg: { overallFulfillmentPct: true },
      }),
    ]);

    const currentAvg = currentMonthAgg._avg.overallFulfillmentPct ?? 0;
    const prevAvg = prevMonthAgg._avg.overallFulfillmentPct ?? 0;
    const fulfillmentTrend = {
      currentMonthAvg: Math.round(currentAvg * 100) / 100,
      previousMonthAvg: Math.round(prevAvg * 100) / 100,
      changePct:
        prevAvg !== 0
          ? Math.round(((currentAvg - prevAvg) / prevAvg) * 10000) / 100
          : 0,
    };

    return jsonResponse({
      data: {
        activeEmployees,
        avgFulfillmentPct: Math.round(avgFulfillmentPct * 100) / 100,
        classificationCounts,
        fulfillmentTrend,
      },
    });
  } catch (error) {
    console.error("GET /api/hr/dashboard/overview error:", error);
    return errorResponse("Error al obtener resumen HR", 500);
  }
}
